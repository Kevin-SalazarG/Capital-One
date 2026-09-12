import * as v from "valibot";
import type { RequestOptions } from "../http/options.js";
import { segment } from "../http/validation.js";
import { type Customer, customerSchema } from "../models/customers.js";
import { type Deposit, depositSchema } from "../models/deposits.js";
import { type Withdrawal, withdrawalSchema } from "../models/withdrawals.js";
import { Resource } from "./resource.js";

export class Enterprise extends Resource {
  async listCustomers(options?: RequestOptions): Promise<Customer[]> {
    return this.http.read("/enterprise/customers", v.array(customerSchema), options);
  }
  async getCustomer(id: string, options?: RequestOptions): Promise<Customer> {
    return this.http.read(`/enterprise/customers/${segment(id)}`, customerSchema, options);
  }
  async listDeposits(options?: RequestOptions): Promise<Deposit[]> {
    return this.http.read("/enterprise/deposits", v.array(depositSchema), options);
  }
  async getDeposit(id: string, options?: RequestOptions): Promise<Deposit> {
    return this.http.read(`/enterprise/deposits/${segment(id)}`, depositSchema, options);
  }
  async getWithdrawal(id: string, options?: RequestOptions): Promise<Withdrawal> {
    return this.http.read(`/enterprise/withdrawal/${segment(id)}`, withdrawalSchema, options);
  }
}
