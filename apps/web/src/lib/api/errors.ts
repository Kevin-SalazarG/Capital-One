export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly requestId: string | null = null,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

const MESSAGES: Record<string, string> = {
  PLAN_STALE:
    "Tus datos cambiaron. Actualiza la proyección y vuelve a comparar antes de guardar.",
  PLAN_UNAVAILABLE:
    "Este plan ya no es viable con los datos actuales. Actualiza la proyección.",
  VALIDATION_ERROR:
    "Revisa las fechas, los montos y las condiciones del acuerdo.",
  INVALID_TIME_ZONE: "Revisa la zona horaria de tu empresa en Configuración.",
  EXTERNAL_PROVIDER_UNAVAILABLE:
    "El proveedor no está disponible. Intenta sincronizar de nuevo en un momento.",
  EXTERNAL_PROVIDER_ERROR:
    "El proveedor no pudo completar la consulta. Revisa el identificador de tu conexión e intenta de nuevo.",
  EMAIL_DELIVERY_ERROR:
    "El correo no pudo enviarse. Revisa el destinatario e intenta de nuevo.",
  EMAIL_DELIVERY_UNAVAILABLE:
    "El servicio de correo no está disponible. Intenta de nuevo en un momento.",
  AUTH_INVALID_CREDENTIALS: "Revisa tu correo y contraseña e intenta de nuevo.",
  AUTH_SESSION_INVALID: "Tu sesión terminó. Inicia sesión para continuar.",
  UNAUTHENTICATED: "Inicia sesión para continuar.",
  ORG_ACCESS_DENIED: "Tu acceso no permite realizar esta acción.",
  FORBIDDEN: "No pudimos completar esta acción con tu acceso actual.",
  FORECAST_INPUTS_INCOMPLETE:
    "Conecta una cuenta de débito o ahorro en la misma moneda de tu empresa y sincroniza sus saldos.",
  VALIDATION_FAILED: "Revisa los campos e intenta de nuevo.",
  CONFLICT:
    "No pudimos guardar el cambio. Actualiza la información y vuelve a intentarlo.",
  NETWORK_ERROR: "No pudimos conectar. Revisa tu conexión e intenta de nuevo.",
  RESPONSE_INVALID:
    "La respuesta no tiene el formato esperado. Intenta actualizar.",
  DUPLICATE_IMPORT: "Este lote ya fue importado.",
  DEMO_READ_ONLY:
    "Esta vista es un ejemplo. Usa tu empresa para guardar cambios.",
  RESOURCE_NOT_FOUND:
    "El registro ya no está disponible. Actualiza esta vista.",
  UPSTREAM_NOT_FOUND:
    "No se encontró el cliente de Nessie. Revisa su identificador en Conexiones.",
  UPSTREAM_UNAVAILABLE:
    "El proveedor no está disponible. Intenta sincronizar de nuevo en un momento.",
  CONNECTION_REVOKED:
    "Esta conexión está desconectada. Agrega otra fuente para sincronizar.",
  FORECAST_CURRENCY_MISMATCH:
    "Las monedas de tus fuentes no coinciden. Revisa la moneda de la empresa, cuentas y facturas.",
};

export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return "No pudimos completar la acción. Intenta de nuevo.";
  if (error.status === 429)
    return "Hay demasiadas solicitudes. Espera un momento e intenta de nuevo.";
  if (error.status === 504 || error.code === "UPSTREAM_TIMEOUT")
    return "La conexión bancaria está tardando. Intenta de nuevo en un momento.";
  if (error.status === 403)
    return MESSAGES[error.code] ?? "No tienes permiso para esta acción.";
  return (
    MESSAGES[error.code] ??
    "No pudimos cargar la información. Intenta de nuevo."
  );
}
