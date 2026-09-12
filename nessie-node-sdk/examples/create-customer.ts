import { type CustomerCreate, NessieClient } from "../src/nessie.js";

const apiKey = process.env["NESSIE_API_KEY"];
if (!apiKey) throw new Error("Set NESSIE_API_KEY before running this example.");

const client = new NessieClient({ apiKey });
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
const result = await client.customers.create(input);
if (typeof result === "string") {
  console.log(result);
} else {
  console.log(result.message, result.objectCreated?._id);
}
