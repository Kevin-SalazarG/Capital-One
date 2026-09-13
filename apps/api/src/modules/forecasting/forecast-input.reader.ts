import { Inject, Injectable } from "@nestjs/common";
import Decimal from "decimal.js";
import { planningMetadata } from "./treasury/planning-metadata.mapper";
import { addDays } from "@colchon/treasury/treasury-date";
import { occurrenceAt } from "./domain/recurring-calendar";
import { AppError } from "../../common/errors/app-error";
import { toDecimal } from "../../common/utilities/money";
import type { OrganizationRow } from "../../common/database/database.types";
import { OrganizationsRepository } from "../organizations/organizations.repository";
import { ConnectionsRepository } from "../connections/connections.repository";
import { BankDataRepository } from "../bank-data/bank-data.repository";
import { CfdiRepository } from "../cfdi/cfdi.repository";
import { ObligationsRepository } from "../obligations/obligations.repository";
import type { ForecastEvent, ForecastInput } from "./domain/forecast.types";

@Injectable()
export class ForecastInputReader {
  public constructor(
    @Inject(OrganizationsRepository)
    private readonly organizations: OrganizationsRepository,
    @Inject(BankDataRepository) private readonly bankData: BankDataRepository,
    @Inject(CfdiRepository) private readonly cfdi: CfdiRepository,
    @Inject(ObligationsRepository)
    private readonly obligations: ObligationsRepository,
    @Inject(ConnectionsRepository)
    private readonly connections: ConnectionsRepository,
  ) {}

  public async read(
    organizationId: string,
    accessToken: string,
    horizonDays: number,
  ): Promise<{
    readonly organization: OrganizationRow;
    readonly input: ForecastInput;
  }> {
    const [organization, accounts, invoices, obligations, connections] =
      await Promise.all([
        this.organizations.getById(organizationId, accessToken),
        this.bankData.listAccounts(organizationId, accessToken),
        this.cfdi.listOpenInvoices(organizationId, accessToken),
        this.obligations.listActive(organizationId, accessToken),
        this.connections.list(organizationId, accessToken),
      ]);
    let asOf: string;
    try {
      asOf = new Intl.DateTimeFormat("en-CA", {
        timeZone: organization.time_zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    } catch {
      throw new AppError("Invalid organization time zone", {
        code: "INVALID_TIME_ZONE",
        status: 422,
      });
    }
    const warnings = [
      "Fechas y acuerdos capturados por el usuario; el CFDI no garantiza una fecha de cobro.",
      "La proyección usa cierres diarios, no el orden intradía. Confirma los saldos y concilia las facturas pagadas antes de decidir.",
    ];
    const eligible = accounts.filter(
      (account) =>
        connections.some(
          (connection) =>
            connection.id === account.connection_id &&
            connection.status !== "revoked",
        ) &&
        account.status === "active" &&
        account.currency === organization.currency &&
        /^(checking|savings)$/i.test(account.type),
    );
    const unique = [
      ...new Map(
        eligible.map((account) => [account.external_id, account]),
      ).values(),
    ];
    if (unique.length === 0)
      throw new AppError(
        "Synchronize a checking or savings account in the organization's currency",
        {
          code: "FORECAST_INPUTS_INCOMPLETE",
          status: 422,
          details: { missing: ["sameCurrencyCashAccount"] },
        },
      );
    if (unique.length !== accounts.length)
      warnings.push(
        "Se excluyeron cuentas duplicadas, inactivas, revocadas, de crédito o en otra moneda. No hay conversión de divisas.",
      );
    const currentBalance = unique.reduce(
      (total, account) =>
        total.plus(
          toDecimal(
            account.available_balance ?? account.balance,
            "available balance",
          ),
        ),
      new Decimal(0),
    );
    if (
      unique.some(
        (a) =>
          !a.last_synced_at ||
          Date.now() - new Date(a.last_synced_at).getTime() > 86400000,
      )
    )
      warnings.push(
        "Hay saldos sin sincronizar en las últimas 24 horas. Actualiza el banco antes de actuar.",
      );
    const end = addDays(asOf, horizonDays - 1);
    const events: ForecastEvent[] = [];
    for (const invoice of invoices) {
      if (invoice.currency !== organization.currency) {
        warnings.push("Se excluyeron facturas en otra moneda.");
        continue;
      }
      if (
        !invoice.due_on ||
        (invoice.due_on < asOf && invoice.direction === "receivable")
      ) {
        warnings.push(
          "Hay cobros vencidos o sin fecha: no se consideran liquidez hasta que actualices su fecha esperada.",
        );
        continue;
      }
      if (new Decimal(invoice.outstanding_amount).lte(0)) continue;
      const meta = planningMetadata(invoice.metadata);
      events.push({
        id: invoice.id,
        date: invoice.due_on < asOf ? asOf : invoice.due_on,
        signedExpectedAmount: toDecimal(
          invoice.outstanding_amount,
          "outstanding",
        ).mul(invoice.direction === "receivable" ? 1 : -1),
        sourceType: "cfdi_invoice",
        sourceId: invoice.id,
        label: invoice.counterparty_name ?? invoice.cfdi_uuid,
        confidence: "low",
        ...meta,
        critical:
          meta.critical ||
          meta.category === "payroll" ||
          meta.category === "tax",
      });
      if (invoice.due_on < asOf)
        warnings.push(
          "Los pagos vencidos se exigen hoy; no se omiten del saldo.",
        );
    }
    for (const obligation of obligations) {
      if (obligation.currency !== organization.currency) {
        warnings.push("Se excluyeron compromisos en otra moneda.");
        continue;
      }
      const meta = planningMetadata(obligation.metadata);
      const linked = invoices.filter(
        (invoice) =>
          invoice.metadata &&
          typeof invoice.metadata === "object" &&
          !Array.isArray(invoice.metadata) &&
          invoice.metadata["obligationId"] === obligation.id,
      );
      for (let index = 0; index < 10000; index++) {
        const occurrence = occurrenceAt(
          obligation.next_due_on,
          obligation.frequency,
          index,
        );
        if (occurrence > end) break;
        if (
          occurrence < asOf ||
          linked.some((invoice) => invoice.due_on === occurrence)
        )
          continue;
        events.push({
          id: `${obligation.id}:${occurrence}`,
          date: occurrence,
          signedExpectedAmount: toDecimal(
            obligation.amount,
            "obligation",
          ).negated(),
          sourceType: "recurring_obligation",
          sourceId: obligation.id,
          label: obligation.name,
          confidence: "medium",
          ...meta,
          earliestDate: null,
          latestDate: null,
          critical:
            meta.critical ||
            meta.category === "payroll" ||
            meta.category === "tax",
        });
      }
    }
    const daily = toDecimal(
      organization.daily_operating_expense ?? "0",
      "daily expense",
    );
    if (daily.isZero())
      warnings.push(
        "Gasto operativo diario en cero: configura el gasto variable sin incluir los pagos ya programados.",
      );
    if (!events.some((event) => event.critical))
      warnings.push(
        "Aún no hay nómina ni pagos protegidos. Agrega tus compromisos críticos.",
      );
    return {
      organization,
      input: {
        asOf,
        horizonDays,
        currentBalance,
        minimumCashReserve: toDecimal(
          organization.minimum_cash_reserve,
          "reserve",
        ),
        averageMonthlyOutflow: new Decimal(0),
        variableOutflowPerDay: daily,
        events: events.sort(
          (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
        ),
        confidence: "low",
        currency: organization.currency,
        warnings: [...new Set(warnings)],
      },
    };
  }
}
