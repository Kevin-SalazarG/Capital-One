import * as v from "valibot";
import type { RequestOptions } from "../http/options.js";
import { segment } from "../http/validation.js";
import {
  type Bill,
  type BillCreate,
  type BillUpdate,
  billCreateSchema,
  billSchema,
  billUpdateSchema,
} from "../models/bills.js";
import {
  type Acknowledgement,
  acknowledgementSchema,
  type CreationResult,
  creationSchema,
} from "../models/responses.js";
import { Resource } from "./resource.js";

export class Bills extends Resource {
  async get(id: string, options?: RequestOptions): Promise<Bill> {
    return this.http.read(`/bills/${segment(id)}`, billSchema, options);
  }

  async create(
    accountId: string,
    body: BillCreate,
    options?: RequestOptions,
  ): Promise<CreationResult<Bill>> {
    return this.http.write(
      "POST",
      `/accounts/${segment(accountId)}/bills`,
      body,
      billCreateSchema,
      creationSchema(billSchema),
      options,
    );
  }

  async update(id: string, body: BillUpdate, options?: RequestOptions): Promise<Acknowledgement> {
    return this.http.write(
      "PUT",
      `/bills/${segment(id)}`,
      body,
      billUpdateSchema,
      acknowledgementSchema,
      options,
    );
  }

  async delete(id: string, options?: RequestOptions): Promise<Acknowledgement> {
    return this.http.remove(`/bills/${segment(id)}`, acknowledgementSchema, options);
  }

  async listByAccount(accountId: string, options?: RequestOptions): Promise<Bill[]> {
    return this.http.read(`/accounts/${segment(accountId)}/bills`, v.array(billSchema), options);
  }

  async listByCustomer(customerId: string, options?: RequestOptions): Promise<Bill[]> {
    return this.http.read(`/customers/${segment(customerId)}/bills`, v.array(billSchema), options);
  }
}
