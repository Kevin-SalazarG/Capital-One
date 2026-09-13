export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
}

export interface EmailDeliveryResult {
  readonly id: string;
}

export interface EmailDeliveryConfig {
  get<T>(key: string): T | undefined;
  getOrThrow<T>(key: string): T;
}

export interface EmailDeliveryPort {
  send(message: EmailMessage): Promise<EmailDeliveryResult>;
}

export const EMAIL_DELIVERY_PORT = Symbol("EMAIL_DELIVERY_PORT");
export const EMAIL_CONFIG_PORT = Symbol("EMAIL_CONFIG_PORT");
