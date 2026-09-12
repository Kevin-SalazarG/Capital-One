import * as v from "valibot";
import type { RequestOptions } from "../http/options.js";
import { segment } from "../http/validation.js";
import {
  type Loan,
  type LoanCreate,
  type LoanUpdate,
  loanCreateSchema,
  loanSchema,
  loanUpdateSchema,
} from "../models/loans.js";
import {
  type Acknowledgement,
  acknowledgementSchema,
  type CreationResult,
  creationSchema,
} from "../models/responses.js";
import { Resource } from "./resource.js";

export class Loans extends Resource {
  async get(id: string, options?: RequestOptions): Promise<Loan> {
    return this.http.read(`/loans/${segment(id)}`, loanSchema, options);
  }

  async create(
    accountId: string,
    body: LoanCreate,
    options?: RequestOptions,
  ): Promise<CreationResult<Loan>> {
    return this.http.write(
      "POST",
      `/accounts/${segment(accountId)}/loans`,
      body,
      loanCreateSchema,
      creationSchema(loanSchema),
      options,
    );
  }

  async update(id: string, body: LoanUpdate, options?: RequestOptions): Promise<Acknowledgement> {
    return this.http.write(
      "PUT",
      `/loans/${segment(id)}`,
      body,
      loanUpdateSchema,
      acknowledgementSchema,
      options,
    );
  }

  async delete(id: string, options?: RequestOptions): Promise<Acknowledgement> {
    return this.http.remove(`/loans/${segment(id)}`, acknowledgementSchema, options);
  }

  async listByAccount(accountId: string, options?: RequestOptions): Promise<Loan[]> {
    return this.http.read(`/accounts/${segment(accountId)}/loans`, v.array(loanSchema), options);
  }
}
