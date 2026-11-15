/**
 * Cálculo de impacto do resgate.
 *
 * ATENÇÃO: todos os fatores abaixo são ESTIMATIVAS aproximadas para fins de
 * demonstração. Antes de divulgar números publicamente, valide os fatores com
 * as ONGs parceiras e cite as fontes oficiais.
 */
import type { Coleta } from "@/lib/types";

/**
 * Quilos de alimento por refeição.
 * Uma refeição completa (arroz, feijão, proteína, legumes) pesa em torno de
 * 400 g. Logo: refeições ≈ kg / 0,4. Pães e itens leves rendem mais refeições
 * por kg na prática, mas usamos um fator único para simplificar.
 */
export const KG_POR_REFEICAO = 0.4;

/**
 * kg de CO2 equivalente evitados por kg de alimento que deixa de ir ao lixo.
 * Ordem de grandeza baseada no relatório da FAO "Food Wastage Footprint"
 * (2013): ~3,3 Gt CO2e para ~1,3 Gt de alimentos desperdiçados ≈ 2,5 kg CO2e/kg.
 * Considera produção, transporte e decomposição em aterro.
 */
export const CO2E_KG_POR_KG_ALIMENTO = 2.5;

export interface ResumoImpacto {
  kg: number;
  refeicoes: number;
  co2eKg: number;
  coletas: number;
}

export function calcularImpacto(kg: number, coletas = 1): ResumoImpacto {
  return {
    kg,
    refeicoes: Math.floor(kg / KG_POR_REFEICAO),
    co2eKg: Math.round(kg * CO2E_KG_POR_KG_ALIMENTO),
    coletas,
  };
}

export function resumir(coletas: Coleta[]): ResumoImpacto {
  const kg = coletas.reduce((s, c) => s + c.kg, 0);
  return calcularImpacto(kg, coletas.length);
}

/** Segunda-feira (YYYY-MM-DD) da semana de uma data YYYY-MM-DD. */
export function inicioDaSemana(dataISO: string): string {
  const d = new Date(`${dataISO}T12:00:00`); // meio-dia evita problemas de fuso
  const diaSemana = (d.getDay() + 6) % 7; // 0 = segunda
  d.setDate(d.getDate() - diaSemana);
  return d.toISOString().slice(0, 10);
}

/** Agrupa coletas por uma chave e devolve o resumo de cada grupo, maior primeiro. */
export function agruparPor(
  coletas: Coleta[],
  chave: (c: Coleta) => string,
): { chave: string; resumo: ResumoImpacto }[] {
  const grupos = new Map<string, Coleta[]>();
  for (const c of coletas) {
    const k = chave(c);
    grupos.set(k, [...(grupos.get(k) ?? []), c]);
  }
  return [...grupos.entries()]
    .map(([k, lista]) => ({ chave: k, resumo: resumir(lista) }))
    .sort((a, b) => b.resumo.kg - a.resumo.kg);
}
