import * as v from "valibot";
import type { RequestOptions } from "../http/options.js";
import { segment } from "../http/validation.js";
import {
  type Merchant,
  type MerchantCreate,
  type MerchantUpdate,
  merchantCreateSchema,
  merchantSchema,
  merchantUpdateSchema,
} from "../models/merchants.js";
import {
  type Acknowledgement,
  acknowledgementSchema,
  type CreationResult,
  creationSchema,
} from "../models/responses.js";
import { Resource } from "./resource.js";

export class Merchants extends Resource {
  async list(options?: RequestOptions): Promise<Merchant[]> {
    return this.http.read(`/merchants`, v.array(merchantSchema), options);
  }

  async get(id: string, options?: RequestOptions): Promise<Merchant> {
    return this.http.read(`/merchants/${segment(id)}`, merchantSchema, options);
  }

  async create(body: MerchantCreate, options?: RequestOptions): Promise<CreationResult<Merchant>> {
    return this.http.write(
      "POST",
      `/merchants`,
      body,
      merchantCreateSchema,
      creationSchema(merchantSchema),
      options,
    );
  }

  async update(
    id: string,
    body: MerchantUpdate,
    options?: RequestOptions,
  ): Promise<Acknowledgement> {
    return this.http.write(
      "PUT",
      `/merchants/${segment(id)}`,
      body,
      merchantUpdateSchema,
      acknowledgementSchema,
      options,
    );
  }
}
