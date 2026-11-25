// Helpers de formatação pt-BR usados nas telas.

const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export const fmtNumero = (n: number) => numero.format(n);
export const fmtKg = (n: number) => `${numero.format(n)} kg`;

/** "15/11" a partir de YYYY-MM-DD. */
export function fmtDia(dataISO: string): string {
  const [, m, d] = dataISO.slice(0, 10).split("-");
  return `${d}/${m}`;
}

/** "15/11, 18:00–20:00" a partir de duas datas ISO locais. */
export function fmtJanela(inicio: string, fim: string): string {
  return `${fmtDia(inicio)}, ${inicio.slice(11, 16)}–${fim.slice(11, 16)}`;
}

/** "18:05" a partir de uma data. */
export function fmtHora(data: Date): string {
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
