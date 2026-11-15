/**
 * Sugestão de ordem de coleta.
 *
 * Heurística: VIZINHO MAIS PRÓXIMO com distância em linha reta (Haversine).
 * Parte da sede da ONG, vai sempre para o ponto ainda não visitado mais perto
 * e, ao final, volta para a sede. É simples, rápida e boa o bastante para
 * poucas paradas (< 15), mas NÃO é ótima e ignora ruas, trânsito e janelas
 * de retirada.
 *
 * >>> ONDE TROCAR POR UMA API DE ROTAS REAL <<<
 * Substitua `distanciaKm` por uma matriz de distâncias/tempos vinda de uma API
 * (ex.: OSRM `/table`, OpenRouteService `/matrix`, Google Distance Matrix) e,
 * se quiser otimização de verdade com janelas de tempo, troque `sugerirRota`
 * por um solver de VRP (ex.: OpenRouteService `/optimization` / VROOM).
 * A assinatura de `sugerirRota` pode continuar a mesma para as telas.
 */
import type { Coordenada } from "@/lib/types";

const RAIO_TERRA_KM = 6371;

/**
 * Fator de correção linha reta -> distância por ruas. Em malhas urbanas a
 * distância real costuma ser ~1,3x a linha reta (valor aproximado, usado só
 * para a estimativa exibida ao usuário).
 */
export const FATOR_DESVIO_URBANO = 1.3;

/** Velocidade média estimada de um carro em SP em horário comercial (km/h). */
export const VELOCIDADE_MEDIA_KMH = 20;

/** Tempo médio gasto em cada parada para carregar os alimentos (min). */
export const MINUTOS_POR_PARADA = 10;

/** Distância em linha reta entre dois pontos (fórmula de Haversine), em km. */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(h));
}

export interface ParadaRota<T> {
  ordem: number;
  ponto: T;
  /** Distância em linha reta desde a parada anterior (km). */
  distanciaDesdeAnteriorKm: number;
}

export interface RotaSugerida<T> {
  paradas: ParadaRota<T>[];
  /** Distância em linha reta do trajeto completo (sede -> paradas -> sede). */
  distanciaLinhaRetaKm: number;
  /** Estimativa por ruas, aplicando FATOR_DESVIO_URBANO. */
  distanciaEstimadaKm: number;
  /** Estimativa de tempo total, incluindo as paradas (min). */
  tempoEstimadoMin: number;
}

/**
 * Ordena os pontos de coleta pela heurística do vizinho mais próximo.
 * @param origem sede da ONG (início e fim do trajeto)
 * @param pontos locais de coleta
 */
export function sugerirRota<T extends Coordenada>(origem: Coordenada, pontos: T[]): RotaSugerida<T> {
  const restantes = [...pontos];
  const paradas: ParadaRota<T>[] = [];
  let atual: Coordenada = origem;
  let total = 0;

  while (restantes.length > 0) {
    // Encontra o ponto não visitado mais próximo da posição atual.
    let indiceMaisProximo = 0;
    let menorDistancia = Infinity;
    restantes.forEach((p, i) => {
      const d = distanciaKm(atual, p);
      if (d < menorDistancia) {
        menorDistancia = d;
        indiceMaisProximo = i;
      }
    });

    const [proximo] = restantes.splice(indiceMaisProximo, 1);
    paradas.push({ ordem: paradas.length + 1, ponto: proximo, distanciaDesdeAnteriorKm: menorDistancia });
    total += menorDistancia;
    atual = proximo;
  }

  // Volta para a sede.
  if (paradas.length > 0) total += distanciaKm(atual, origem);

  const distanciaEstimadaKm = total * FATOR_DESVIO_URBANO;
  const tempoEstimadoMin =
    (distanciaEstimadaKm / VELOCIDADE_MEDIA_KMH) * 60 + paradas.length * MINUTOS_POR_PARADA;

  return {
    paradas,
    distanciaLinhaRetaKm: total,
    distanciaEstimadaKm,
    tempoEstimadoMin: Math.round(tempoEstimadoMin),
  };
}
