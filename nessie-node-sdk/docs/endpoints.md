# Endpoint reference

58 operations: 52 from the downloaded OpenAPI specification and 6 documented supplemental operations. Paths preserve the names and singular/plural forms explained in the [contract notes](contract.md).

| SDK method                           | HTTP   | Path                                                     | Source                               |
| ------------------------------------ | ------ | -------------------------------------------------------- | ------------------------------------ |
| `customers.list`                     | GET    | `/customers`                                             | Current OpenAPI                      |
| `customers.get`                      | GET    | `/customers/{id}`                                        | Current OpenAPI                      |
| `customers.create`                   | POST   | `/customers`                                             | Current OpenAPI                      |
| `customers.update`                   | PUT    | `/customers/{id}`                                        | Current OpenAPI                      |
| `customers.getByAccount`             | GET    | `/accounts/{accountId}/customer`                         | Current OpenAPI                      |
| `accounts.list`                      | GET    | `/accounts`                                              | Current OpenAPI                      |
| `accounts.get`                       | GET    | `/accounts/{id}`                                         | Current OpenAPI                      |
| `accounts.create`                    | POST   | `/customers/{customerId}/accounts`                       | Current OpenAPI                      |
| `accounts.update`                    | PUT    | `/accounts/{id}`                                         | Current OpenAPI                      |
| `accounts.delete`                    | DELETE | `/accounts/{id}`                                         | Current OpenAPI                      |
| `accounts.listByCustomer`            | GET    | `/customers/{customerId}/accounts`                       | Current OpenAPI                      |
| `bills.get`                          | GET    | `/bills/{id}`                                            | Current OpenAPI                      |
| `bills.create`                       | POST   | `/accounts/{accountId}/bills`                            | Current OpenAPI                      |
| `bills.update`                       | PUT    | `/bills/{id}`                                            | Current OpenAPI                      |
| `bills.delete`                       | DELETE | `/bills/{id}`                                            | Current OpenAPI                      |
| `bills.listByAccount`                | GET    | `/accounts/{accountId}/bills`                            | Current OpenAPI                      |
| `bills.listByCustomer`               | GET    | `/customers/{customerId}/bills`                          | Current OpenAPI                      |
| `deposits.list`                      | GET    | `/deposits`                                              | Current OpenAPI                      |
| `deposits.get`                       | GET    | `/deposits/{id}`                                         | Current OpenAPI                      |
| `deposits.create`                    | POST   | `/accounts/{accountId}/deposits`                         | Current OpenAPI                      |
| `deposits.update`                    | PUT    | `/deposits/{id}`                                         | Current OpenAPI                      |
| `deposits.delete`                    | DELETE | `/deposits/{id}`                                         | Current OpenAPI                      |
| `deposits.listByAccount`             | GET    | `/accounts/{accountId}/deposits`                         | Current OpenAPI                      |
| `loans.get`                          | GET    | `/loans/{id}`                                            | Current OpenAPI                      |
| `loans.create`                       | POST   | `/accounts/{accountId}/loans`                            | Current OpenAPI                      |
| `loans.update`                       | PUT    | `/loans/{id}`                                            | Current OpenAPI                      |
| `loans.delete`                       | DELETE | `/loans/{id}`                                            | Current OpenAPI                      |
| `loans.listByAccount`                | GET    | `/accounts/{accountId}/loans`                            | Current OpenAPI                      |
| `merchants.list`                     | GET    | `/merchants`                                             | Current OpenAPI                      |
| `merchants.get`                      | GET    | `/merchants/{id}`                                        | Current OpenAPI                      |
| `merchants.create`                   | POST   | `/merchants`                                             | Current OpenAPI                      |
| `merchants.update`                   | PUT    | `/merchants/{id}`                                        | Current OpenAPI                      |
| `atms.list`                          | GET    | `/atms`                                                  | Current OpenAPI                      |
| `atms.get`                           | GET    | `/atms/{id}`                                             | Current OpenAPI                      |
| `branches.list`                      | GET    | `/branches`                                              | Current OpenAPI                      |
| `branches.get`                       | GET    | `/branches/{id}`                                         | Current OpenAPI                      |
| `withdrawals.get`                    | GET    | `/withdrawal/{id}`                                       | Current OpenAPI                      |
| `withdrawals.create`                 | POST   | `/accounts/{accountId}/withdrawals`                      | Current OpenAPI                      |
| `withdrawals.update`                 | PUT    | `/withdrawal/{id}`                                       | Current OpenAPI                      |
| `withdrawals.delete`                 | DELETE | `/withdrawal/{id}`                                       | Current OpenAPI                      |
| `withdrawals.listByAccount`          | GET    | `/accounts/{accountId}/withdrawals`                      | Current OpenAPI                      |
| `transfers.get`                      | GET    | `/transfers/{id}`                                        | Current OpenAPI                      |
| `transfers.create`                   | POST   | `/accounts/{accountId}/transfers`                        | Earlier official SDK / documentation |
| `transfers.update`                   | PUT    | `/transfers/{id}`                                        | Current OpenAPI                      |
| `transfers.delete`                   | DELETE | `/transfers/{id}`                                        | Current OpenAPI                      |
| `transfers.listByAccount`            | GET    | `/accounts/{accountId}/transfers`                        | Earlier official SDK / documentation |
| `purchases.get`                      | GET    | `/purchase/{id}`                                         | Current OpenAPI                      |
| `purchases.create`                   | POST   | `/accounts/{accountId}/purchases`                        | Earlier official SDK / documentation |
| `purchases.update`                   | PUT    | `/purchase/{id}`                                         | Current OpenAPI                      |
| `purchases.delete`                   | DELETE | `/purchase/{id}`                                         | Current OpenAPI                      |
| `purchases.listByAccount`            | GET    | `/accounts/{accountId}/purchases`                        | Earlier official SDK / documentation |
| `purchases.listByMerchant`           | GET    | `/merchants/{merchantId}/purchases`                      | Earlier official SDK / documentation |
| `purchases.listByMerchantAndAccount` | GET    | `/merchants/{merchantId}/accounts/{accountId}/purchases` | Earlier official SDK / documentation |
| `enterprise.listCustomers`           | GET    | `/enterprise/customers`                                  | Current OpenAPI                      |
| `enterprise.getCustomer`             | GET    | `/enterprise/customers/{id}`                             | Current OpenAPI                      |
| `enterprise.listDeposits`            | GET    | `/enterprise/deposits`                                   | Current OpenAPI                      |
| `enterprise.getDeposit`              | GET    | `/enterprise/deposits/{id}`                              | Current OpenAPI                      |
| `enterprise.getWithdrawal`           | GET    | `/enterprise/withdrawal/{id}`                            | Current OpenAPI                      |
