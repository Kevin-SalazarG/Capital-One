# Contract and provenance

Reviewed on 2026-09-12. The primary source is the [published OpenAPI specification](https://prod.nessieisreal.com/nessie-openapi-spec.yaml), version 1.0.0 / OpenAPI 3.0.3, preserved in `spec/nessie-openapi.yaml`.

Local snapshot SHA-256:
`0a8e49d1764850a0f85ef3591f385c491f262b89973988f3070db13d1547d8c7`.

The [documentation website](https://prod.nessieisreal.com/docs) configures `https://prod-api.nessieisreal.com` as the production server. The SDK preserves current paths, including singular forms: `/purchase/{id}`, `/withdrawal/{id}`, and `/enterprise/withdrawal/{id}`. Earlier SDKs use plural forms for some of these paths; the SDK does not automatically substitute legacy routes.

## Contract differences

| Case                  | Evidence                                                                                                                       | SDK behavior                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Resource identifiers  | OpenAPI constrains IDs to 24 characters; an authenticated `GET /customers` on 2026-09-12 returned UUIDs from the deployed API. | Accepts legacy 24-character strings or valid UUIDs; rejects other lengths and malformed UUIDs.                           |
| ATM                   | OpenAPI references `ATM` without defining it. The website shows `_id`, `name`, `address`, `geocode`, and `amount_left`.        | The schema uses these fields without guessing additional field types.                                                    |
| Transfers             | OpenAPI uses objects without properties. The website shows common fields; the Go SDK defines creation and update fields.       | Models include the documented common fields, `payee_id`, `payer_id`, and named inputs from those sources.                |
| Withdrawals           | OpenAPI uses objects without properties. The Go SDK documents `medium`, `amount`, and optional fields.                         | Schemas follow those fields; detail routes follow the current OpenAPI specification.                                     |
| Purchases             | OpenAPI uses objects without properties. JavaScript and Go SDKs use `purchase_date`; the website shows `transaction_date`.     | Creation uses `purchase_date`. Responses accept both date fields as optional. Updates accept fields named by either SDK. |
| Merchant category     | OpenAPI specifies a string; the current example shows an array of strings.                                                     | Input follows OpenAPI; responses accept a string or an array of strings.                                                 |
| Account customer      | OpenAPI specifies a string; JavaScript and Python SDKs expect a customer.                                                      | `getByAccount` returns `Customer \| string` and validates both variants.                                                 |
| Creation              | OpenAPI specifies strings; the Python SDK reads `objectCreated` from an object containing `code` and `message`.                | `CreationResult<T>` preserves both variants. The created object is optional and validated when present.                  |
| Updates and deletions | OpenAPI mixes strings and empty responses. The Python SDK also reads acknowledgements with a code.                             | `Acknowledgement` preserves strings, acknowledgement objects, and empty bodies.                                          |

Complete OpenAPI models retain their required fields and constraints. Fields are not all made optional to hide server discrepancies. Incompatible responses produce `NessieResponseError` with the affected field paths. Unmodeled response fields are discarded.

## Supplemental operations

These six operations are absent from the downloaded OpenAPI specification but documented in official sources:

- GET and POST `/accounts/{id}/transfers`: [Go transfer SDK](https://github.com/nessieisreal/nessie-golang-sdk/blob/master/lib/transfer/transfer.go). POST also appears in the current website's Quick Start.
- GET and POST `/accounts/{id}/purchases`: [JavaScript purchase SDK](https://github.com/nessieisreal/nessie-javascript-sdk/blob/master/lib/purchase.js) and [Go purchase SDK](https://github.com/nessieisreal/nessie-golang-sdk/blob/master/lib/purchase/purchase.go).
- GET `/merchants/{id}/purchases` and GET `/merchants/{id}/accounts/{id}/purchases`: JavaScript purchase SDK.

The test suite maintains an explicit allowlist: every OpenAPI operation must be covered, and every additional operation must belong to this list. Bulk data deletion is not implemented because the current contract does not publish that operation.

Supplemental filters:

- `accounts.list({ type })`: [JavaScript](https://github.com/nessieisreal/nessie-javascript-sdk/blob/master/lib/account.js) and [Python](https://github.com/nessieisreal/nessie-python-sdk/blob/master/nessie/accountRequest.py).
- `atms.list({ lat, lng, rad })`: [JavaScript](https://github.com/nessieisreal/nessie-javascript-sdk/blob/master/lib/atm.js).
- `transfers.listByAccount(id, { type })`: [JavaScript](https://github.com/nessieisreal/nessie-javascript-sdk/blob/master/lib/transfer.js).

Earlier official SDKs were used as contract references, without copying their implementations. Some contain incorrect routes or methods: for example, JavaScript's `createTransfer` points to withdrawals. This SDK uses the transfer route corroborated by Quick Start and Go.

## Verification limits

Automated tests use sample data and local HTTP servers, and verify the complete OpenAPI operation inventory and installed package. Authenticated checks on 2026-09-12 created a dedicated simulation customer, two accounts, ten deposits, and ten withdrawals, then read them back and synchronized them through the application's bank adapter. Customer, account, deposit, and withdrawal responses used UUIDs. This is a scoped compatibility check, not verification of every production operation. Supplemental operations and response discrepancies are documented explicitly; their availability depends on the server deployment.

For these existing accounts, `GET /accounts/{id}/transfers` returned HTTP 404 with the text `No transfers found for this account` when there were no transfers. The SDK preserves that HTTP error. The application adapter handles only that exact empty-collection response as an empty list, after resolving the account through the customer account list; authorization errors and other failures still propagate.

The SDK does not invent pagination, idempotency headers, OAuth support, currencies, radius units, or business rules that the sources do not define. It does not convert monetary amounts between units. Domain validation follows the contract, and JavaScript numeric values must be finite.
