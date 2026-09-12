import { Injectable } from "@nestjs/common";

import { addDays, toIsoDate } from "../../common/utilities/date";
import type { CfdiDocumentDto } from "./dto/cfdi-document.dto";

@Injectable()
export class SyntheticCfdiProvider {
  public createDemoDocuments(asOf = new Date()): CfdiDocumentDto[] {
    const baseDate = toIsoDate(asOf, "demo date");
    const receivables = Array.from({ length: 6 }, (_, index) => ({
      cfdiUuid: `DEMO-RECEIVABLE-${index + 1}`,
      direction: "receivable" as const,
      issuerRfc: "AAA010101AAA",
      receiverRfc: "BBB010101BBB",
      counterpartyName: `Cliente ${index + 1}`,
      issuedAt: `${baseDate}T09:00:00.000Z`,
      dueOn: addDays(baseDate, 7 + index * 5),
      totalAmount: (18000 + index * 2500).toFixed(2),
      outstandingAmount: (18000 + index * 2500).toFixed(2),
      currency: "MXN",
      paymentStatus: "pending" as const,
      expectedCollectionProbability: Math.max(0.65, 0.92 - index * 0.04),
      metadata: { source: "synthetic-demo" },
    }));
    const payables = Array.from({ length: 4 }, (_, index) => ({
      cfdiUuid: `DEMO-PAYABLE-${index + 1}`,
      direction: "payable" as const,
      issuerRfc: "CCC010101CCC",
      receiverRfc: "BBB010101BBB",
      counterpartyName: `Proveedor ${index + 1}`,
      issuedAt: `${baseDate}T10:00:00.000Z`,
      dueOn: addDays(baseDate, 5 + index * 9),
      totalAmount: (12500 + index * 1800).toFixed(2),
      outstandingAmount: (12500 + index * 1800).toFixed(2),
      currency: "MXN",
      paymentStatus: "pending" as const,
      metadata: { source: "synthetic-demo" },
    }));

    return [...receivables, ...payables];
  }
}
