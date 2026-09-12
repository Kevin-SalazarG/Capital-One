import * as v from "valibot";
import type { RequestOptions } from "../http/options.js";
import { segment, validate } from "../http/validation.js";
import { type ATM, type ATMQuery, atmQuerySchema, atmSchema } from "../models/atms.js";
import { Resource } from "./resource.js";

export class Atms extends Resource {
  async list(query: ATMQuery = {}, options?: RequestOptions): Promise<ATM[]> {
    return this.http.read(`/atms`, v.array(atmSchema), options, validate(atmQuerySchema, query));
  }

  async get(id: string, options?: RequestOptions): Promise<ATM> {
    return this.http.read(`/atms/${segment(id)}`, atmSchema, options);
  }
}
