import * as v from "valibot";
import type { RequestOptions } from "../http/options.js";
import { segment } from "../http/validation.js";
import {
  type Acknowledgement,
  acknowledgementSchema,
  type CreationResult,
  creationSchema,
} from "../models/responses.js";
import {
  type Withdrawal,
  type WithdrawalCreate,
  type WithdrawalUpdate,
  withdrawalCreateSchema,
  withdrawalSchema,
  withdrawalUpdateSchema,
} from "../models/withdrawals.js";
import { Resource } from "./resource.js";

export class Withdrawals extends Resource {
  async get(id: string, options?: RequestOptions): Promise<Withdrawal> {
    return this.http.read(`/withdrawal/${segment(id)}`, withdrawalSchema, options);
  }

  async create(
    accountId: string,
    body: WithdrawalCreate,
    options?: RequestOptions,
  ): Promise<CreationResult<Withdrawal>> {
    return this.http.write(
      "POST",
      `/accounts/${segment(accountId)}/withdrawals`,
      body,
      withdrawalCreateSchema,
      creationSchema(withdrawalSchema),
      options,
    );
  }

  async update(
    id: string,
    body: WithdrawalUpdate,
    options?: RequestOptions,
  ): Promise<Acknowledgement> {
    return this.http.write(
      "PUT",
      `/withdrawal/${segment(id)}`,
      body,
      withdrawalUpdateSchema,
      acknowledgementSchema,
      options,
    );
  }

  async delete(id: string, options?: RequestOptions): Promise<Acknowledgement> {
    return this.http.remove(`/withdrawal/${segment(id)}`, acknowledgementSchema, options);
  }

  async listByAccount(accountId: string, options?: RequestOptions): Promise<Withdrawal[]> {
    return this.http.read(
      `/accounts/${segment(accountId)}/withdrawals`,
      v.array(withdrawalSchema),
      options,
    );
  }
}
