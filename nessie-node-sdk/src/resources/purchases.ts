import * as v from "valibot";
import type { RequestOptions } from "../http/options.js";
import { segment } from "../http/validation.js";
import {
  type Purchase,
  type PurchaseCreate,
  type PurchaseUpdate,
  purchaseCreateSchema,
  purchaseSchema,
  purchaseUpdateSchema,
} from "../models/purchases.js";
import {
  type Acknowledgement,
  acknowledgementSchema,
  type CreationResult,
  creationSchema,
} from "../models/responses.js";
import { Resource } from "./resource.js";

export class Purchases extends Resource {
  async get(id: string, options?: RequestOptions): Promise<Purchase> {
    return this.http.read(`/purchase/${segment(id)}`, purchaseSchema, options);
  }

  async create(
    accountId: string,
    body: PurchaseCreate,
    options?: RequestOptions,
  ): Promise<CreationResult<Purchase>> {
    return this.http.write(
      "POST",
      `/accounts/${segment(accountId)}/purchases`,
      body,
      purchaseCreateSchema,
      creationSchema(purchaseSchema),
      options,
    );
  }

  async update(
    id: string,
    body: PurchaseUpdate,
    options?: RequestOptions,
  ): Promise<Acknowledgement> {
    return this.http.write(
      "PUT",
      `/purchase/${segment(id)}`,
      body,
      purchaseUpdateSchema,
      acknowledgementSchema,
      options,
    );
  }

  async delete(id: string, options?: RequestOptions): Promise<Acknowledgement> {
    return this.http.remove(`/purchase/${segment(id)}`, acknowledgementSchema, options);
  }

  async listByAccount(accountId: string, options?: RequestOptions): Promise<Purchase[]> {
    return this.http.read(
      `/accounts/${segment(accountId)}/purchases`,
      v.array(purchaseSchema),
      options,
    );
  }

  async listByMerchant(merchantId: string, options?: RequestOptions): Promise<Purchase[]> {
    return this.http.read(
      `/merchants/${segment(merchantId)}/purchases`,
      v.array(purchaseSchema),
      options,
    );
  }

  async listByMerchantAndAccount(
    merchantId: string,
    accountId: string,
    options?: RequestOptions,
  ): Promise<Purchase[]> {
    return this.http.read(
      `/merchants/${segment(merchantId)}/accounts/${segment(accountId)}/purchases`,
      v.array(purchaseSchema),
      options,
    );
  }
}
