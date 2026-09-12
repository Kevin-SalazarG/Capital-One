import * as v from "valibot";
import type { RequestOptions } from "../http/options.js";
import { segment, validate } from "../http/validation.js";
import {
  type Acknowledgement,
  acknowledgementSchema,
  type CreationResult,
  creationSchema,
} from "../models/responses.js";
import {
  type Transfer,
  type TransferCreate,
  type TransferQuery,
  type TransferUpdate,
  transferCreateSchema,
  transferQuerySchema,
  transferSchema,
  transferUpdateSchema,
} from "../models/transfers.js";
import { Resource } from "./resource.js";

export class Transfers extends Resource {
  async get(id: string, options?: RequestOptions): Promise<Transfer> {
    return this.http.read(`/transfers/${segment(id)}`, transferSchema, options);
  }

  async create(
    accountId: string,
    body: TransferCreate,
    options?: RequestOptions,
  ): Promise<CreationResult<Transfer>> {
    return this.http.write(
      "POST",
      `/accounts/${segment(accountId)}/transfers`,
      body,
      transferCreateSchema,
      creationSchema(transferSchema),
      options,
    );
  }

  async update(
    id: string,
    body: TransferUpdate,
    options?: RequestOptions,
  ): Promise<Acknowledgement> {
    return this.http.write(
      "PUT",
      `/transfers/${segment(id)}`,
      body,
      transferUpdateSchema,
      acknowledgementSchema,
      options,
    );
  }

  async delete(id: string, options?: RequestOptions): Promise<Acknowledgement> {
    return this.http.remove(`/transfers/${segment(id)}`, acknowledgementSchema, options);
  }

  async listByAccount(
    accountId: string,
    query: TransferQuery = {},
    options?: RequestOptions,
  ): Promise<Transfer[]> {
    return this.http.read(
      `/accounts/${segment(accountId)}/transfers`,
      v.array(transferSchema),
      options,
      validate(transferQuerySchema, query),
    );
  }
}
