import { MirrorApiError, MirrorTransportError } from "@mirror/api-client";

export interface ApiErrorDescription {
  readonly kind:
    | "authorization"
    | "network"
    | "timeout"
    | "cancelled"
    | "invalid-response"
    | "rate-limit"
    | "conflict"
    | "validation"
    | "unavailable"
    | "unknown";
  readonly message: string;
  readonly retryAfterMs?: number;
}

export function describeApiError(error: unknown): ApiErrorDescription {
  if (error instanceof MirrorTransportError) {
    switch (error.code) {
      case "REQUEST_ABORTED":
        return {
          kind: "cancelled",
          message: "Se canceló la consulta. Puedes volver a intentarlo.",
        };
      case "REQUEST_TIMEOUT":
        return { kind: "timeout", message: "La respuesta tardó demasiado. Revisa tu conexión." };
      case "NETWORK_ERROR":
        return { kind: "network", message: "No pudimos conectar con Mirror. Revisa tu conexión." };
      case "RESPONSE_NOT_JSON":
      case "RESPONSE_SCHEMA_INVALID":
        return {
          kind: "invalid-response",
          message: "Mirror devolvió una respuesta que no pudimos verificar.",
        };
      case "REQUEST_SCHEMA_INVALID":
      case "REQUEST_OPTIONS_INVALID":
        return { kind: "validation", message: "Revisa los datos ingresados antes de continuar." };
    }
  }
  if (error instanceof MirrorApiError) {
    if (error.status === 401)
      return {
        kind: "authorization",
        message: "La sesión no es válida. Inicia sesión nuevamente.",
      };
    if (error.status === 403)
      return { kind: "authorization", message: "Tu sesión no tiene acceso a esta información." };
    if (error.status === 429)
      return {
        kind: "rate-limit",
        message: "Hay demasiadas solicitudes. Espera antes de volver a intentarlo.",
        ...(error.retryAfterMs === undefined ? {} : { retryAfterMs: error.retryAfterMs }),
      };
    if (error.status === 409)
      return {
        kind: "conflict",
        message: "Los datos cambiaron. Actualiza la información y revisa tu decisión.",
      };
    if (error.status === 400 || error.status === 422)
      return { kind: "validation", message: "Revisa los datos ingresados antes de continuar." };
    if (error.status >= 500)
      return { kind: "unavailable", message: "Mirror no está disponible en este momento." };
  }
  return { kind: "unknown", message: "No pudimos completar la solicitud. Inténtalo de nuevo." };
}

export function apiErrorMessage(error: unknown): string {
  return describeApiError(error).message;
}
