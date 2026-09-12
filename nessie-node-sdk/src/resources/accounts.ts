import * as v from "valibot";
import type { RequestOptions } from "../http/options.js";
import { segment, validate } from "../http/validation.js";
import {
  type Account,
  type AccountCreate,
  type AccountQuery,
  type AccountUpdate,
  accountCreateSchema,
  accountQuerySchema,
  accountSchema,
  accountUpdateSchema,
} from "../models/accounts.js";
import {
  type Acknowledgement,
  acknowledgementSchema,
  type CreationResult,
  creationSchema,
} from "../models/responses.js";
import { Resource } from "./resource.js";

export class Accounts extends Resource {
  async list(query: AccountQuery = {}, options?: RequestOptions): Promise<Account[]> {
    return this.http.read(
      `/accounts`,
      v.array(accountSchema),
      options,
      validate(accountQuerySchema, query),
    );
  }

  async get(id: string, options?: RequestOptions): Promise<Account> {
    return this.http.read(`/accounts/${segment(id)}`, accountSchema, options);
  }

  async create(
    customerId: string,
    body: AccountCreate,
    options?: RequestOptions,
  ): Promise<CreationResult<Account>> {
    return this.http.write(
      "POST",
      `/customers/${segment(customerId)}/accounts`,
      body,
      accountCreateSchema,
      creationSchema(accountSchema),
      options,
    );
  }

  async update(
    id: string,
    body: AccountUpdate,
    options?: RequestOptions,
  ): Promise<Acknowledgement> {
    return this.http.write(
      "PUT",
      `/accounts/${segment(id)}`,
      body,
      accountUpdateSchema,
      acknowledgementSchema,
      options,
    );
  }

  async delete(id: string, options?: RequestOptions): Promise<Acknowledgement> {
    return this.http.remove(`/accounts/${segment(id)}`, acknowledgementSchema, options);
  }

  async listByCustomer(customerId: string, options?: RequestOptions): Promise<Account[]> {
    return this.http.read(
      `/customers/${segment(customerId)}/accounts`,
      v.array(accountSchema),
      options,
    );
  }
}
