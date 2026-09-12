import * as v from "valibot";
import type { RequestOptions } from "../http/options.js";
import { segment } from "../http/validation.js";
import {
  type Customer,
  type CustomerCreate,
  type CustomerUpdate,
  customerCreateSchema,
  customerSchema,
  customerUpdateSchema,
} from "../models/customers.js";
import {
  type Acknowledgement,
  acknowledgementSchema,
  type CreationResult,
  creationSchema,
} from "../models/responses.js";
import { Resource } from "./resource.js";

export class Customers extends Resource {
  async list(options?: RequestOptions): Promise<Customer[]> {
    return this.http.read(`/customers`, v.array(customerSchema), options);
  }

  async get(id: string, options?: RequestOptions): Promise<Customer> {
    return this.http.read(`/customers/${segment(id)}`, customerSchema, options);
  }

  async create(body: CustomerCreate, options?: RequestOptions): Promise<CreationResult<Customer>> {
    return this.http.write(
      "POST",
      `/customers`,
      body,
      customerCreateSchema,
      creationSchema(customerSchema),
      options,
    );
  }

  async update(
    id: string,
    body: CustomerUpdate,
    options?: RequestOptions,
  ): Promise<Acknowledgement> {
    return this.http.write(
      "PUT",
      `/customers/${segment(id)}`,
      body,
      customerUpdateSchema,
      acknowledgementSchema,
      options,
    );
  }

  async getByAccount(accountId: string, options?: RequestOptions): Promise<Customer | string> {
    return this.http.read(
      `/accounts/${segment(accountId)}/customer`,
      v.union([customerSchema, v.string()]),
      options,
    );
  }
}
