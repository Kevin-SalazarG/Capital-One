# Nessie Node.js SDK

A typed Node.js client for [Nessie](https://prod.nessieisreal.com/docs), Capital One's banking simulation API.

`nessie-node-sdk` is an independent implementation, not an official Capital One package. It follows the naming conventions of the [Nessie SDKs](https://prod.nessieisreal.com/sdk) and preserves the API's resource and field names.

- Node.js 22+, with native `fetch` and Promise-based methods.
- TypeScript types and runtime validation from shared schemas.
- ESM and CommonJS, including declarations for both formats.
- Resource-based clients, configurable deadlines, cancellation, and read-only retries.
- One runtime dependency: [Valibot](https://valibot.dev).

[Installation](#installation) · [Quick start](#quick-start) · [Resources](#resources) · [Configuration](#configuration) · [Errors](#errors) · [Contributing](CONTRIBUTING.md)

## Installation

This project has not been published to npm. Build a package from this repository using Node.js 22+ and the pnpm version pinned in `package.json`:

```sh
git clone https://github.com/Kevin-SalazarG/nessie-node-sdk.git
cd nessie-node-sdk
pnpm install --frozen-lockfile
pnpm pack
```

`pnpm pack` builds the SDK and creates `nessie-node-sdk-0.1.0.tgz`. From your application's directory, install that file:

```sh
pnpm add /absolute/path/to/nessie-node-sdk/nessie-node-sdk-0.1.0.tgz
```

The same tarball works with npm:

```sh
npm install /absolute/path/to/nessie-node-sdk/nessie-node-sdk-0.1.0.tgz
```

## Quick start

Get your API key from [Nessie](https://prod.nessieisreal.com/docs) and provide it through your application's environment. Never commit real credentials.

```sh
export NESSIE_API_KEY="your-nessie-api-key"
```

Save the following as `app.mjs` and run `node app.mjs`. The same code also works in a TypeScript ESM project.

```js
import { NessieClient } from "nessie-node-sdk";

const apiKey = process.env["NESSIE_API_KEY"];
if (!apiKey) throw new Error("Set NESSIE_API_KEY before running this example.");

const nessie = new NessieClient({ apiKey });
const customers = await nessie.customers.list();

for (const customer of customers) {
  console.log(customer._id, customer.first_name, customer.last_name);
}
```

The default API server is `https://prod-api.nessieisreal.com`, not the documentation website. Authentication uses the `key` query parameter required by Nessie. Keep this client on the server and avoid logging authenticated URLs.

### CommonJS

```js
const { NessieClient } = require("nessie-node-sdk");

const apiKey = process.env["NESSIE_API_KEY"];
if (!apiKey) throw new Error("Set NESSIE_API_KEY before running this example.");

const nessie = new NessieClient({ apiKey });
nessie.customers.list().then(console.log).catch(console.error);
```

## Usage

The examples below reuse the `nessie` client from the quick start. Replace placeholder IDs with IDs from your Nessie data. Creation, update, and deletion methods change data on the configured server.

### Read and filter

```ts
const checkingAccounts = await nessie.accounts.list({ type: "Checking" });
const customerAccounts = await nessie.accounts.listByCustomer("CUSTOMER_ID");
const account = await nessie.accounts.get("ACCOUNT_ID");

console.log(checkingAccounts, customerAccounts, account);
```

### Create and update

Input fields keep Nessie's names, including `first_name`, `customer_id`, and `payee_id`.

```ts
import type { CustomerCreate } from "nessie-node-sdk";

const input: CustomerCreate = {
  first_name: "Jane",
  last_name: "Doe",
  address: {
    street_number: "1",
    street_name: "Main St",
    city: "Arlington",
    state: "VA",
    zip: "22201",
  },
};

const result = await nessie.customers.create(input);

if (typeof result === "string") {
  console.log(result);
} else {
  console.log(result.message, result.objectCreated?._id);
}

await nessie.customers.update("CUSTOMER_ID", { first_name: "Janet" });
```

Creation methods return `CreationResult<T>`: a string or an object containing `code`, `message`, and an optional, validated `objectCreated`. Updates and deletions return `Acknowledgement`: a string, a `{ code, message }` object, or `undefined` for an empty response body. These unions reflect differences between Nessie's published contracts; the SDK does not fabricate a created object from a text acknowledgement.

## Resources

Every method returns a Promise and accepts optional `RequestOptions` as its final argument. For methods with filters, pass filters before request options; use `{}` to omit filters while setting options.

| Resource      | Methods                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `customers`   | `list`, `get`, `getByAccount`, `create`, `update`                                                  |
| `accounts`    | `list`, `get`, `listByCustomer`, `create`, `update`, `delete`                                      |
| `bills`       | `get`, `listByAccount`, `listByCustomer`, `create`, `update`, `delete`                             |
| `deposits`    | `list`, `get`, `listByAccount`, `create`, `update`, `delete`                                       |
| `loans`       | `get`, `listByAccount`, `create`, `update`, `delete`                                               |
| `merchants`   | `list`, `get`, `create`, `update`                                                                  |
| `atms`        | `list`, `get`                                                                                      |
| `branches`    | `list`, `get`                                                                                      |
| `withdrawals` | `get`, `listByAccount`, `create`, `update`, `delete`                                               |
| `transfers`   | `get`, `listByAccount`, `create`, `update`, `delete`                                               |
| `purchases`   | `get`, `listByAccount`, `listByMerchant`, `listByMerchantAndAccount`, `create`, `update`, `delete` |
| `enterprise`  | `listCustomers`, `getCustomer`, `listDeposits`, `getDeposit`, `getWithdrawal`                      |

The SDK covers all 52 operations in the checked-in OpenAPI specification, plus 6 operations documented by earlier official SDKs. See the [endpoint reference](docs/endpoints.md) for exact HTTP paths and the [contract notes](docs/contract.md) for supplemental operations and filters.

## Configuration

| Client option | Default                             | Description                                                                                                   |
| ------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `apiKey`      | Required                            | Your Nessie API key. Each client keeps its own key.                                                           |
| `baseUrl`     | `https://prod-api.nessieisreal.com` | API server. Override only with a server you trust with your key.                                              |
| `timeoutMs`   | `10000`                             | Total operation deadline in milliseconds, including response reads and retries. Integer from 1 to 2147483647. |
| `maxRetries`  | `2`                                 | Additional attempts for GET requests only. Integer from 0 to 10.                                              |
| `fetch`       | Native `fetch`                      | Custom transport, useful for testing.                                                                         |

`timeoutMs` and `maxRetries` can also be set per request:

```ts
await nessie.customers.list({ timeoutMs: 5_000, maxRetries: 0 });
await nessie.accounts.list({}, { timeoutMs: 3_000 });
```

### Cancellation

Pass an `AbortSignal` in request options:

```ts
import { NessieAbortError } from "nessie-node-sdk/errors";

const controller = new AbortController();
const pending = nessie.customers.list({ signal: controller.signal });
controller.abort();

try {
  await pending;
} catch (error: unknown) {
  if (!(error instanceof NessieAbortError)) throw error;
}
```

### Retries

GET requests retry network failures and HTTP `408`, `429`, `500`, `502`, `503`, and `504` with exponential backoff and jitter. The SDK honors `Retry-After`; if it requests a delay above 30 seconds, the HTTP error is returned without retrying early. The total deadline still applies.

POST, PUT, and DELETE are never retried automatically. Validation errors are not retried. Redirects are disabled to prevent forwarding the API key to another destination.

## Errors

All SDK errors extend `NessieError`. Import them from the package root or `nessie-node-sdk/errors`.

```ts
import {
  NessieHttpError,
  NessieResponseError,
  NessieValidationError,
} from "nessie-node-sdk/errors";

try {
  await nessie.customers.get("CUSTOMER_ID");
} catch (error: unknown) {
  if (error instanceof NessieHttpError) {
    console.error(error.status, error.method, error.path, error.requestId);
  } else if (error instanceof NessieValidationError || error instanceof NessieResponseError) {
    console.error(error.issues);
  } else {
    throw error;
  }
}
```

| Error                      | Meaning                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `NessieConfigurationError` | Invalid client configuration or request options.               |
| `NessieValidationError`    | Input rejected before sending the request.                     |
| `NessieHttpError`          | The server returned a non-success HTTP status.                 |
| `NessieResponseError`      | The response could not be decoded or did not match its schema. |
| `NessieNetworkError`       | The transport failed without an HTTP response.                 |
| `NessieTimeoutError`       | The operation exceeded its total deadline.                     |
| `NessieAbortError`         | The caller cancelled the request.                              |

`NessieHttpError.body` is `unknown` because error payloads have no fixed schema. The SDK redacts the configured API key from HTTP errors and omits raw transport messages that could expose an authenticated URL. Error bodies can still contain application data; handle them accordingly.

## Types and validation

Request and response types are inferred from the same Valibot schemas used at runtime. Resource inputs reject unknown top-level fields and invalid values. Responses retain validated model fields and discard unmodeled fields. Dates remain strings, and amounts retain the API's units without conversion.

Import types from the root, or types and schemas from resource-specific subpaths:

```ts
import type { CustomerCreate } from "nessie-node-sdk";
import { customerSchema, type Customer } from "nessie-node-sdk/models/customers";
```

Some published API schemas are incomplete or inconsistent. The [contract notes](docs/contract.md) describe each compatibility decision, including legacy and UUID resource identifiers, `Customer | string` from `customers.getByAccount`, and the creation-response union. Automated tests use fixtures and local HTTP servers; scoped authenticated checks are recorded in the contract notes.

## Testing your application

Inject a transport to test your integration without real credentials or network requests:

```ts
import { NessieClient } from "nessie-node-sdk";

const client = new NessieClient({
  apiKey: "test-key",
  fetch: async () => Response.json([]),
});

const customers = await client.customers.list();
console.log(customers);
```

## Examples and contributing

See [list customers](https://github.com/Kevin-SalazarG/nessie-node-sdk/blob/main/examples/list-customers.ts) for a read-only example and [create a customer](https://github.com/Kevin-SalazarG/nessie-node-sdk/blob/main/examples/create-customer.ts) for a write example. Both require `NESSIE_API_KEY` in the environment; running the latter creates data.

For setup, project structure, quality checks, and contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md). Report reproducible problems through [GitHub Issues](https://github.com/Kevin-SalazarG/nessie-node-sdk/issues), without credentials or sensitive data.

## License

[MIT](LICENSE).
