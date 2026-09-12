import type { HttpTransport } from "../http/transport.js";

export abstract class Resource {
  protected readonly http: HttpTransport;
  constructor(http: HttpTransport) {
    this.http = http;
  }
}
