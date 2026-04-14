// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractErrorMessage(error: unknown, fallback = 'Ocurrió un error'): string {
  if (error && typeof error === 'object' && 'response' in error) {
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
