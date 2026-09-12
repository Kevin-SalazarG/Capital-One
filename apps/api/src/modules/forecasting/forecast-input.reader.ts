import { Inject, Injectable } from "@nestjs/common";
import Decimal from "decimal.js";

import { AppError } from "../../common/errors/app-error";
import { addDays, daysBetween, toIsoDate } from "../../common/utilities/date";
import { toDecimal } from "../../common/utilities/money";
import type {
  OrganizationRow,
  RecurringObligationRow,
} from "../../common/database/database.types";
import { OrganizationsRepository } from "../organizations/organizations.repository";
import { BankDataRepository } from "../bank-data/bank-data.repository";
import { CfdiRepository } from "../cfdi/cfdi.repository";
import { ObligationsRepository } from "../obligations/obligations.repository";
import type {
  ForecastConfidence,
  ForecastEvent,
  ForecastInput,
} from "./domain/forecast.types";

const HISTORICAL_DAYS = 90;

function confidenceFor(
  accountCount: number,
  transactionCount: number,
  invoiceCount: number,
  obligationCount: number,
): ForecastConfidence {
  if (
    accountCount > 0 &&
    transactionCount >= 10 &&
    (invoiceCount > 0 || obligationCount > 0)
  ) {
    return "high";
  }
  if (
    accountCount > 0 &&
    (transactionCount > 0 || invoiceCount > 0 || obligationCount > 0)
  ) {
    return "medium";
  }
  return "low";
}

function nextOccurrence(
  date: string,
  frequency: RecurringObligationRow["frequency"],
): string {
  const increment =
    frequency === "weekly"
      ? 7
      : frequency === "monthly"
        ? 30
        : frequency === "quarterly"
          ? 91
          : 365;
  return addDays(date, increment);
}

function recurringEvents(
  obligations: readonly RecurringObligationRow[],
  asOf: string,
  horizonDays: number,
): ForecastEvent[] {
  const horizonEnd = addDays(asOf, horizonDays - 1);
  return obligations.flatMap((obligation) => {
    const events: ForecastEvent[] = [];
    let occurrence = obligation.next_due_on;
    while (occurrence <= horizonEnd) {
      if (occurrence >= asOf) {
        events.push({
          id: `${obligation.id}:${occurrence}`,
          date: occurrence,
          signedExpectedAmount: toDecimal(
            obligation.amount,
            "obligation.amount",
          ).negated(),
          sourceType: "recurring_obligation",
          sourceId: obligation.id,
          label: obligation.name,
          confidence: "medium",
        });
      }
      occurrence = nextOccurrence(occurrence, obligation.frequency);
    }
    return events;
  });
}

@Injectable()
export class ForecastInputReader {
  public constructor(
    @Inject(OrganizationsRepository)
    private readonly organizations: OrganizationsRepository,
    @Inject(BankDataRepository) private readonly bankData: BankDataRepository,
    @Inject(CfdiRepository) private readonly cfdi: CfdiRepository,
    @Inject(ObligationsRepository)
    private readonly obligations: ObligationsRepository,
  ) {}

  public async read(
    organizationId: string,
    accessToken: string,
    horizonDays: number,
  ): Promise<{
    readonly organization: OrganizationRow;
    readonly input: ForecastInput;
  }> {
    const asOf = toIsoDate(new Date(), "forecast asOf");
    const [organization, accounts, transactions, invoices, obligations] =
      await Promise.all([
        this.organizations.getById(organizationId, accessToken),
        this.bankData.listAccounts(organizationId, accessToken),
        this.bankData.listTransactions(
          organizationId,
          accessToken,
          addDays(asOf, -HISTORICAL_DAYS),
          500,
        ),
        this.cfdi.listOpenInvoices(organizationId, accessToken),
        this.obligations.listActive(organizationId, accessToken),
      ]);
    if (accounts.length === 0) {
      throw new AppError("At least one synchronized bank account is required", {
        code: "FORECAST_INPUTS_INCOMPLETE",
        status: 422,
        details: { missing: ["bankAccount"] },
      });
    }

    const currentBalance = accounts.reduce(
      (total, account) =>
        total.plus(toDecimal(account.balance, "bank account balance")),
      new Decimal(0),
    );
    const historicalDays = Math.max(
      1,
      transactions.length > 0
        ? Math.min(
            HISTORICAL_DAYS,
            daysBetween(
              asOf,
              transactions[transactions.length - 1]?.posted_at ?? asOf,
            ) * -1,
          )
        : HISTORICAL_DAYS,
    );
    const historicalOutflows = transactions
      .filter((transaction) => transaction.direction === "outflow")
      .reduce(
        (total, transaction) =>
          total.plus(toDecimal(transaction.amount, "transaction amount")),
        new Decimal(0),
      );
    const averageMonthlyOutflow = historicalOutflows
      .mul(30)
      .div(historicalDays);
    const events: ForecastEvent[] = invoices.flatMap((invoice) => {
      if (
        !invoice.due_on ||
        invoice.due_on < asOf ||
        invoice.due_on > addDays(asOf, horizonDays - 1)
      ) {
        return [];
      }
      const outstanding = toDecimal(
        invoice.outstanding_amount,
        "invoice outstanding amount",
      );
      const probability =
        invoice.direction === "receivable"
          ? toDecimal(
              invoice.expected_collection_probability ?? 1,
              "collection probability",
            )
          : new Decimal(1);
      return [
        {
          id: invoice.id,
          date: invoice.due_on,
          signedExpectedAmount:
            invoice.direction === "receivable"
              ? outstanding.mul(probability)
              : outstanding.negated(),
          sourceType: "cfdi_invoice" as const,
          sourceId: invoice.id,
          label: invoice.counterparty_name ?? invoice.cfdi_uuid,
          confidence:
            invoice.expected_collection_probability === null
              ? ("medium" as const)
              : ("high" as const),
        },
      ];
    });
    const allEvents = [
      ...events,
      ...recurringEvents(obligations, asOf, horizonDays),
    ];
    const confidence = confidenceFor(
      accounts.length,
      transactions.length,
      invoices.length,
      obligations.length,
    );

    return {
      organization,
      input: {
        asOf,
        horizonDays,
        currentBalance,
        minimumCashReserve: toDecimal(
          organization.minimum_cash_reserve,
          "minimum cash reserve",
        ),
        averageMonthlyOutflow,
        variableOutflowPerDay: averageMonthlyOutflow.div(30),
        events: allEvents,
        confidence,
      },
    };
  }
}
