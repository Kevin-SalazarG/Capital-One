import * as v from "valibot";
import type { RequestOptions } from "../http/options.js";
import { segment } from "../http/validation.js";
import {
  type Deposit,
  type DepositCreate,
  type DepositUpdate,
  depositCreateSchema,
  depositSchema,
  depositUpdateSchema,
} from "../models/deposits.js";
import {
  type Acknowledgement,
  acknowledgementSchema,
  type CreationResult,
  creationSchema,
} from "../models/responses.js";
import { Resource } from "./resource.js";

export class Deposits extends Resource {
  async list(options?: RequestOptions): Promise<Deposit[]> {
    return this.http.read(`/deposits`, v.array(depositSchema), options);
  }

  async get(id: string, options?: RequestOptions): Promise<Deposit> {
    return this.http.read(`/deposits/${segment(id)}`, depositSchema, options);
  }

  async create(
    accountId: string,
    body: DepositCreate,
    options?: RequestOptions,
  ): Promise<CreationResult<Deposit>> {
    return this.http.write(
      "POST",
      `/accounts/${segment(accountId)}/deposits`,
      body,
      depositCreateSchema,
      creationSchema(depositSchema),
      options,
    );
  }

  async update(
    id: string,
    body: DepositUpdate,
    options?: RequestOptions,
  ): Promise<Acknowledgement> {
    return this.http.write(
      "PUT",
      `/deposits/${segment(id)}`,
      body,
      depositUpdateSchema,
      acknowledgementSchema,
      options,
    );
  }

  async delete(id: string, options?: RequestOptions): Promise<Acknowledgement> {
    return this.http.remove(`/deposits/${segment(id)}`, acknowledgementSchema, options);
  }

  async listByAccount(accountId: string, options?: RequestOptions): Promise<Deposit[]> {
    return this.http.read(
      `/accounts/${segment(accountId)}/deposits`,
      v.array(depositSchema),
      options,
    );
  }
}
