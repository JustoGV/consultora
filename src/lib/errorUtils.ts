export function extractErrorMessage(error: unknown, fallback = 'Ocurrió un error'): string {
  if (error && typeof error === 'object' && 'response' in error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = (error as any).response;
    if (response?.data?.message) {
      const msg = response.data.message;
      return Array.isArray(msg) ? msg.join(', ') : String(msg);
    }
    if (response?.data?.error) {
      return String(response.data.error);
    }
  }
  return error instanceof Error ? error.message : fallback;
}

/**
 * Mapea los errores de validación de NestJS (ValidationPipe) a campos conocidos del form (RN-16).
 *
 * NestJS devuelve `message: string[]` con formato `"<campo> <regla>"` (ej. "email must be an email").
 * Para cada mensaje: si su primera palabra pertenece a `knownFields` se asigna a `fieldErrors[campo]`;
 * si no, se concatena en `formError`. Si el backend no devolvió un array de mensajes, se usa
 * `extractErrorMessage` como fallback para `formError`.
 *
 * El caller NUNCA debe resetear formData ni cerrar el modal en el catch — solo mergear
 * fieldErrors y setear formError.
 */
export function mapServerErrors(
  error: unknown,
  knownFields: string[]
): { fieldErrors: Record<string, string>; formError: string | null } {
  const fieldErrors: Record<string, string> = {};
  let formError: string | null = null;

  if (error && typeof error === 'object' && 'response' in error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = (error as any).response;
    const message = response?.data?.message;

    if (Array.isArray(message)) {
      const unmatched: string[] = [];
      for (const msg of message) {
        const text = String(msg);
        const firstWord = text.split(' ')[0];
        if (knownFields.includes(firstWord)) {
          fieldErrors[firstWord] = text;
        } else {
          unmatched.push(text);
        }
      }
      if (unmatched.length > 0) {
        formError = unmatched.join(', ');
      }
      return { fieldErrors, formError };
    }
  }

  formError = extractErrorMessage(error);
  return { fieldErrors, formError };
}
