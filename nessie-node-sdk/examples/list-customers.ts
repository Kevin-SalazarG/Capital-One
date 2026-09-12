import { NessieClient, NessieHttpError } from "../src/nessie.js";

const apiKey = process.env["NESSIE_API_KEY"];
if (!apiKey) throw new Error("Set NESSIE_API_KEY before running this example.");

const client = new NessieClient({ apiKey });
try {
  const customers = await client.customers.list();
  for (const customer of customers) {
    console.log(customer._id, customer.first_name, customer.last_name);
  }
} catch (error: unknown) {
  if (error instanceof NessieHttpError) {
    console.error("HTTP", error.status, error.path, error.requestId);
  } else throw error;
}
