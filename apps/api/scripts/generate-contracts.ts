import "reflect-metadata";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { format } from "prettier";
import * as v from "valibot";
import { configureAppModule } from "../dist/app.module.js";
import { configureApplication } from "../dist/configure-app.js";
import { createOpenApi } from "../dist/platform/http/openapi.js";

const schemaShape = v.object({
  type: v.optional(v.union([v.string(), v.array(v.string())])),
  properties: v.optional(v.record(v.string(), v.unknown())),
  required: v.optional(v.array(v.string())),
  items: v.optional(v.unknown()),
  enum: v.optional(v.array(v.union([v.string(), v.number(), v.boolean(), v.null()]))),
  const: v.optional(v.union([v.string(), v.number(), v.boolean(), v.null()])),
  anyOf: v.optional(v.array(v.unknown())),
  oneOf: v.optional(v.array(v.unknown())),
  allOf: v.optional(v.array(v.unknown())),
  nullable: v.optional(v.boolean()),
  $ref: v.optional(v.string()),
  pattern: v.optional(v.string()),
  minLength: v.optional(v.number()),
  maxLength: v.optional(v.number()),
  minimum: v.optional(v.number()),
  maximum: v.optional(v.number()),
  minItems: v.optional(v.number()),
  maxItems: v.optional(v.number()),
  additionalProperties: v.optional(v.unknown()),
});

function expression(input: unknown): string {
  const schema = v.parse(schemaShape, input);
  if (schema.$ref) throw new Error(`Reference resolution required: ${schema.$ref}`);
  let result: string;
  if (schema.enum)
    result =
      schema.enum.length === 1
        ? literalExpression(schema.enum[0])
        : `v.union([${schema.enum.map(literalExpression).join(",")}])`;
  else if (schema.const !== undefined) result = literalExpression(schema.const);
  else if (schema.anyOf || schema.oneOf)
    result = `v.union([${(schema.anyOf ?? schema.oneOf ?? []).map(expression).join(",")}])`;
  else if (schema.allOf) result = `v.intersect([${schema.allOf.map(expression).join(",")}])`;
  else if (schema.type === "object" || schema.properties) {
    result = `v.object({${Object.entries(schema.properties ?? {})
      .map(
        ([name, child]) =>
          `${JSON.stringify(name)}:${schema.required?.includes(name) ? expression(child) : `v.optional(${expression(child)})`}`,
      )
      .join(",")}})`;
  } else if (schema.type === "array") {
    result = `v.array(${expression(schema.items)})`;
    const rules = [
      schema.minItems === undefined ? "" : `v.minLength(${schema.minItems})`,
      schema.maxItems === undefined ? "" : `v.maxLength(${schema.maxItems})`,
    ].filter(Boolean);
    if (rules.length) result = `v.pipe(${result},${rules.join(",")})`;
  } else if (schema.type === "string") {
    const rules = [
      schema.pattern ? `v.regex(${new RegExp(schema.pattern).toString()})` : "",
      schema.minLength === undefined ? "" : `v.minLength(${schema.minLength})`,
      schema.maxLength === undefined ? "" : `v.maxLength(${schema.maxLength})`,
    ].filter(Boolean);
    result = rules.length ? `v.pipe(v.string(),${rules.join(",")})` : "v.string()";
  } else if (schema.type === "number" || schema.type === "integer") {
    const rules = [
      schema.type === "integer" ? "v.integer()" : "",
      schema.minimum === undefined ? "" : `v.minValue(${schema.minimum})`,
      schema.maximum === undefined ? "" : `v.maxValue(${schema.maximum})`,
    ].filter(Boolean);
    result = rules.length ? `v.pipe(v.number(),${rules.join(",")})` : "v.number()";
  } else if (schema.type === "boolean") result = "v.boolean()";
  else if (schema.type === "null") result = "v.null()";
  else throw new Error(`Unsupported schema: ${JSON.stringify(input).slice(0, 200)}`);
  return schema.nullable ? `v.nullable(${result})` : result;
}

function literalExpression(value: string | number | boolean | null | undefined): string {
  if (value === undefined) throw new Error("Empty literal schema");
  return value === null ? "v.null()" : `v.literal(${JSON.stringify(value)})`;
}

const app = await NestFactory.create<NestExpressApplication>(
  configureAppModule({
    NODE_ENV: "test",
    PORT: 3000,
    SUPABASE_URL: "https://synthetic.invalid",
    SUPABASE_ANON_KEY: "synthetic-contract-generation",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-contract-server-key",
    BANKING_MODE: "replay",
    TRUST_PROXY_HOPS: 0,
  }),
  { bodyParser: false, logger: false },
);
configureApplication(app, 0);
const document = createOpenApi(app);
const declarations: string[] = [
  "// Generated from apps/api/openapi.json. Regenerate with pnpm generate:contracts.",
  'import * as v from "valibot";',
];
const methods: string[] = [];
for (const [path, pathItem] of Object.entries(document.paths)) {
  for (const verb of ["get", "post", "patch", "put", "delete"] as const) {
    const operation = pathItem[verb];
    if (!operation?.operationId) continue;
    const id = operation.operationId;
    const response = operation.responses["200"];
    if (!response || !("content" in response)) throw new Error(`Missing success response: ${id}`);
    const responseSchema = response.content?.["application/json"]?.schema;
    declarations.push(
      `export const ${id}ResponseSchema = ${expression(responseSchema)};`,
      `export type ${id[0]?.toUpperCase()}${id.slice(1)}Result = v.InferOutput<typeof ${id}ResponseSchema>;`,
    );
    const requestBody = operation.requestBody;
    const requestSchema =
      requestBody && "content" in requestBody
        ? requestBody.content["application/json"]?.schema
        : undefined;
    if (requestSchema)
      declarations.push(`export const ${id}RequestSchema = ${expression(requestSchema)};`);
    const parameters = operation.parameters?.filter((parameter) => "name" in parameter) ?? [];
    const pathParams = parameters.filter((parameter) => parameter.in === "path");
    const queryParams = parameters.filter((parameter) => parameter.in === "query");
    const args = [
      ...pathParams.map((parameter) => `${parameter.name}:string`),
      ...(requestSchema ? [`body:v.InferInput<typeof ${id}RequestSchema>`] : []),
      ...(queryParams.length
        ? [
            `query:{${queryParams.map((parameter) => `${JSON.stringify(parameter.name)}${parameter.required ? "" : "?"}:${parameter.schema ? `v.InferInput<typeof ${id}${parameter.name}QuerySchema>` : "string"}`).join(";")}}={}`,
          ]
        : []),
      "options?:MirrorRequestOptions",
    ];
    for (const parameter of queryParams)
      if (parameter.schema)
        declarations.push(
          `const ${id}${parameter.name}QuerySchema = ${expression(parameter.schema)};`,
        );
    let route = JSON.stringify(path);
    for (const parameter of pathParams)
      route += `.replace(${JSON.stringify(`{${parameter.name}}`)},encodeURIComponent(${parameter.name}))`;
    methods.push(
      `async ${id}(${args.join(",")}):Promise<v.InferOutput<typeof ${id}ResponseSchema>> { return this.request(${JSON.stringify(verb.toUpperCase())},${route},${id}ResponseSchema,${requestSchema ? `validateRequest(${id}RequestSchema,body)` : "undefined"},${queryParams.length ? "query" : "undefined"},options); }`,
    );
  }
}
const runtime = `
const errorSchema=v.object({code:v.string(),message:v.string(),requestId:v.string()});
export class MirrorApiError extends Error {
 constructor(readonly status:number,readonly code:string,readonly requestId:string,message:string,readonly retryAfterMs?:number){super(message);this.name="MirrorApiError";}
}
const transportMessages={
 NETWORK_ERROR:"The API could not be reached or its response could not be read.",
 RESPONSE_NOT_JSON:"The API response is not valid JSON.",
 RESPONSE_SCHEMA_INVALID:"The API response does not match its public contract.",
 REQUEST_SCHEMA_INVALID:"The request does not match the public API contract.",
 REQUEST_OPTIONS_INVALID:"The API base URL or request timeout is invalid.",
 REQUEST_ABORTED:"The request was cancelled; this does not confirm a server rollback.",
 REQUEST_TIMEOUT:"The request deadline elapsed; its server outcome may be unknown.",
} as const;
export type MirrorTransportErrorCode=keyof typeof transportMessages;
export class MirrorTransportError extends Error {
 constructor(readonly code:MirrorTransportErrorCode,readonly status?:number,readonly requestId?:string,readonly retryAfterMs?:number){super(transportMessages[code]);this.name="MirrorTransportError";}
}
export interface MirrorRequestOptions {
 readonly signal?:AbortSignal;
 /** Total request/body deadline in milliseconds, from 1 through 2147483647. */
 readonly timeoutMs?:number;
}
export interface MirrorClientOptions {
 readonly baseUrl:string;
 readonly accessToken?:()=>string|undefined;
 readonly fetch?:typeof fetch;
 /** Default deadline; an operation may override it with its request options. */
 readonly timeoutMs?:number;
}
function validateRequest<Schema extends v.BaseSchema<unknown,unknown,v.BaseIssue<unknown>>>(schema:Schema,input:unknown):v.InferOutput<Schema> {
 const parsed=v.safeParse(schema,input);
 if(!parsed.success)throw new MirrorTransportError("REQUEST_SCHEMA_INVALID");
 return parsed.output;
}
function retryAfterMilliseconds(value:string|null):number|undefined {
 if(value===null)return undefined;
 const trimmed=value.trim();
 if(/^\\d+$/.test(trimmed)){
  const milliseconds=Number(trimmed)*1000;
  return Number.isSafeInteger(milliseconds)?milliseconds:undefined;
 }
 if(!/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \\d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \\d{4} \\d{2}:\\d{2}:\\d{2} GMT$/.test(trimmed))return undefined;
 const timestamp=Date.parse(trimmed);
 if(!Number.isFinite(timestamp)||new Date(timestamp).toUTCString()!==trimmed)return undefined;
 return Math.max(0,timestamp-Date.now());
}
function responseRequestId(response:Response):string|undefined {
 const value=response.headers.get("x-request-id");
 return value!==null&&/^[A-Za-z0-9_-]{1,128}$/.test(value)?value:undefined;
}
export class MirrorClient {
 constructor(private readonly options:MirrorClientOptions){}
 private async request<Schema extends v.BaseSchema<unknown,unknown,v.BaseIssue<unknown>>>(method:string,path:string,schema:Schema,body:unknown,query:Readonly<Record<string,string|number|undefined>>|undefined,options:MirrorRequestOptions|undefined):Promise<v.InferOutput<Schema>> {
  const timeoutMs=options?.timeoutMs??this.options.timeoutMs;
  if(timeoutMs!==undefined&&(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>2147483647))throw new MirrorTransportError("REQUEST_OPTIONS_INVALID");
  let url:URL;
  try{url=new URL(this.options.baseUrl.replace(/\\/$/,"")+path);}catch{throw new MirrorTransportError("REQUEST_OPTIONS_INVALID");}
  for(const [name,value] of Object.entries(query??{})) if(value!==undefined) url.searchParams.set(name,String(value));
  const headers:Record<string,string>={accept:"application/json"};
  const token=this.options.accessToken?.(); if(token)headers.authorization=\`Bearer \${token}\`;
  if(body!==undefined)headers["content-type"]="application/json";
  const controller=new AbortController();
  let timeout:ReturnType<typeof setTimeout>|undefined;
  let cancellationError:MirrorTransportError|undefined;
  let rejectCancellation:((error:MirrorTransportError)=>void)|undefined;
  const cancelled=new Promise<never>((_resolve,reject)=>{rejectCancellation=reject;});
  const cancel=(code:"REQUEST_ABORTED"|"REQUEST_TIMEOUT"):void=>{
   if(cancellationError)return;
   cancellationError=new MirrorTransportError(code);
   rejectCancellation?.(cancellationError);
   controller.abort();
  };
  const onAbort=():void=>cancel("REQUEST_ABORTED");
  if(options?.signal?.aborted)throw new MirrorTransportError("REQUEST_ABORTED");
  options?.signal?.addEventListener("abort",onAbort,{once:true});
  if(timeoutMs!==undefined)timeout=setTimeout(()=>cancel("REQUEST_TIMEOUT"),timeoutMs);
  try{
   // Racing also settles the caller when an injected/native transport ignores abort.
   return await Promise.race([
    this.readResponse(url,{method,headers,signal:controller.signal,...(body===undefined?{}:{body:JSON.stringify(body)})},schema),
    cancelled,
   ]);
  }finally{
   if(timeout!==undefined)clearTimeout(timeout);
   options?.signal?.removeEventListener("abort",onAbort);
  }
 }
 private async readResponse<Schema extends v.BaseSchema<unknown,unknown,v.BaseIssue<unknown>>>(url:URL,init:RequestInit,schema:Schema):Promise<v.InferOutput<Schema>> {
  let response:Response;
  try{response=await (this.options.fetch??fetch)(url,init);}catch{throw new MirrorTransportError("NETWORK_ERROR");}
  const requestId=responseRequestId(response);
  const retryAfterMs=retryAfterMilliseconds(response.headers.get("retry-after"));
  let text:string;
  try{text=await response.text();}catch{throw new MirrorTransportError("NETWORK_ERROR",response.status,requestId,retryAfterMs);}
  let payload:unknown;
  try{payload=JSON.parse(text);}catch{throw new MirrorTransportError("RESPONSE_NOT_JSON",response.status,requestId,retryAfterMs);}
  if(!response.ok){
   const error=v.safeParse(errorSchema,payload);
   if(!error.success)throw new MirrorTransportError("RESPONSE_SCHEMA_INVALID",response.status,requestId,retryAfterMs);
   throw new MirrorApiError(response.status,error.output.code,error.output.requestId,error.output.message,retryAfterMs);
  }
  const parsed=v.safeParse(schema,payload);
  if(!parsed.success)throw new MirrorTransportError("RESPONSE_SCHEMA_INVALID",response.status,requestId,retryAfterMs);
  return parsed.output;
 }
 ${methods.join("\n")}
}
`;
const artifacts = [
  {
    path: resolve("openapi.json"),
    text: await format(JSON.stringify(document), { parser: "json", printWidth: 100 }),
  },
  {
    path: resolve("../../packages/api-client/src/client.ts"),
    text: await format([...declarations, runtime].join("\n"), {
      parser: "typescript",
      printWidth: 100,
    }),
  },
];
for (const artifact of artifacts) {
  if (process.argv.includes("--check")) {
    if (readFileSync(artifact.path, "utf8") !== artifact.text)
      throw new Error(`Contract drift: ${artifact.path}`);
  } else {
    mkdirSync(resolve(artifact.path, ".."), { recursive: true });
    writeFileSync(artifact.path, artifact.text);
  }
}
await app.close();
console.log(
  process.argv.includes("--check")
    ? "Contract artifacts match."
    : "OpenAPI and validated browser-compatible client generated.",
);
