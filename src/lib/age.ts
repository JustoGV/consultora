/**
 * calcularEdad — misma lógica que `calcularEdad()` del backend
 * (`src/common/utils/date-utils.ts`), portada al front para mostrar la edad
 * calculada en listados/fichas de personas sin persistirla (RN-03: `edad`
 * SIEMPRE se calcula, nunca se persiste).
 */
export function calcularEdad(fechaNacimiento: string, referencia = new Date()): number {
  const nacimiento = new Date(fechaNacimiento);
  const ref = new Date(referencia);
  let edad = ref.getFullYear() - nacimiento.getFullYear();
  const mesDiff = ref.getMonth() - nacimiento.getMonth();
  if (mesDiff < 0 || (mesDiff === 0 && ref.getDate() < nacimiento.getDate())) {
    edad -= 1;
  }
  return edad;
}
