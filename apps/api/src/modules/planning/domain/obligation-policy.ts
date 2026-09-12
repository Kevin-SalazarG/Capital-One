export interface ObligationTerms {
  readonly category: string;
  readonly negotiable: boolean;
}

export function permitsNegotiability(terms: ObligationTerms): boolean {
  return !terms.negotiable || !["payroll", "taxes"].includes(terms.category);
}
