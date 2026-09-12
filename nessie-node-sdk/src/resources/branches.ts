import * as v from "valibot";
import type { RequestOptions } from "../http/options.js";
import { segment } from "../http/validation.js";
import { type Branch, branchSchema } from "../models/branches.js";
import { Resource } from "./resource.js";

export class Branches extends Resource {
  async list(options?: RequestOptions): Promise<Branch[]> {
    return this.http.read(`/branches`, v.array(branchSchema), options);
  }

  async get(id: string, options?: RequestOptions): Promise<Branch> {
    return this.http.read(`/branches/${segment(id)}`, branchSchema, options);
  }
}
