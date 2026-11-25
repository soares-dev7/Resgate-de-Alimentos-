/**
 * Sugestão de ordem de coleta.
 *
 * Duas heurísticas simples, ambas com distância em linha reta (Haversine):
 *
 * 1. VIZINHO MAIS PRÓXIMO (pontos sem janela de retirada): parte da sede da
 *    ONG e vai sempre para o ponto ainda não visitado mais perto.
 *
 * 2. VIZINHO MAIS PRÓXIMO COM JANELAS (pontos com janela de retirada): simula o
 *    relógio da viagem e, a cada passo, escolhe a parada em que a coleta pode
 *    COMEÇAR mais cedo (chegada ou abertura da janela, o que vier depois),
 *    descartando as que já fechariam. Assim uma padaria que só libera às 20h
 *    não passa na frente de um restaurante que fecha às 16h.
 *
 * Nenhuma das duas é ótima: são rápidas e boas o bastante para poucas paradas
 * (< 15), mas ignoram ruas e trânsito.
 *
 * >>> ONDE TROCAR POR UMA API DE ROTAS REAL <<<
 * Substitua `minutosDeViagem`/`distanciaKm` por uma matriz de distâncias/tempos
 * vinda de uma API (ex.: OSRM `/table`, OpenRouteService `/matrix`, Google
 * Distance Matrix) e, para otimização de verdade com janelas de tempo, troque
 * `ordenarComJanelas` por um solver de VRP (ex.: OpenRouteService
 * `/optimization` / VROOM). A assinatura de `sugerirRota` pode continuar a
 * mesma para as telas.
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

const MS_POR_MINUTO = 60_000;

/** Janela de retirada no formato usado pelas doações ("YYYY-MM-DDTHH:MM", hora local). */
export interface JanelaRetirada {
  janelaInicio: string;
  janelaFim: string;
}

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

/** Tempo estimado de carro entre dois pontos (min), já com o desvio urbano. */
export function minutosDeViagem(a: Coordenada, b: Coordenada): number {
  return ((distanciaKm(a, b) * FATOR_DESVIO_URBANO) / VELOCIDADE_MEDIA_KMH) * 60;
}

export interface ParadaRota<T> {
  ordem: number;
  ponto: T;
  /** Distância em linha reta desde a parada anterior (km). */
  distanciaDesdeAnteriorKm: number;
  /** Horário previsto de chegada (só quando os pontos têm janela de retirada). */
  chegadaPrevista?: Date;
  /** Quando a coleta começa: a chegada ou a abertura da janela, o que vier depois. */
  coletaPrevista?: Date;
  /** true se a coleta começaria depois do fim da janela de retirada. */
  foraDaJanela: boolean;
}

export interface RotaSugerida<T> {
  paradas: ParadaRota<T>[];
  /** Distância em linha reta do trajeto completo (sede -> paradas -> sede). */
  distanciaLinhaRetaKm: number;
  /** Estimativa por ruas, aplicando FATOR_DESVIO_URBANO. */
  distanciaEstimadaKm: number;
  /** Tempo em deslocamento e paradas (min). Não inclui espera pela abertura das janelas. */
  tempoEstimadoMin: number;
  /** Quantas coletas chegariam depois do fim da janela de retirada. */
  coletasForaDaJanela: number;
}

function temJanela(p: object): p is JanelaRetirada {
  return (
    typeof (p as Partial<JanelaRetirada>).janelaInicio === "string" &&
    typeof (p as Partial<JanelaRetirada>).janelaFim === "string"
  );
}

// "YYYY-MM-DDTHH:MM" sem fuso é interpretado como hora local pelo navegador.
const abre = (p: JanelaRetirada) => new Date(p.janelaInicio).getTime();
const fecha = (p: JanelaRetirada) => new Date(p.janelaFim).getTime();

/** Ordem pelo vizinho mais próximo, sem considerar horários. */
export function ordenarPorProximidade<T extends Coordenada>(origem: Coordenada, pontos: T[]): T[] {
  const restantes = [...pontos];
  const ordem: T[] = [];
  let atual: Coordenada = origem;
  while (restantes.length > 0) {
    let melhor = 0;
    restantes.forEach((p, i) => {
      if (distanciaKm(atual, p) < distanciaKm(atual, restantes[melhor])) melhor = i;
    });
    const [proximo] = restantes.splice(melhor, 1);
    ordem.push(proximo);
    atual = proximo;
  }
  return ordem;
}

/**
 * Ordem pelo vizinho mais próximo "no tempo": a cada passo, a parada em que a
 * coleta pode começar mais cedo, entre as que ainda estariam com a janela aberta.
 * Se nenhuma estiver, vai para a que fecha primeiro (será marcada como fora da janela).
 */
export function ordenarComJanelas<T extends Coordenada & JanelaRetirada>(
  origem: Coordenada,
  pontos: T[],
): T[] {
  const restantes = [...pontos];
  const ordem: T[] = [];
  let atual: Coordenada = origem;
  // O relógio começa na abertura da primeira janela do dia.
  let relogio = Math.min(...pontos.map(abre));

  while (restantes.length > 0) {
    let melhor = -1;
    let melhorInicio = Infinity;
    restantes.forEach((p, i) => {
      const chegada = relogio + minutosDeViagem(atual, p) * MS_POR_MINUTO;
      const inicio = Math.max(chegada, abre(p));
      if (inicio > fecha(p)) return; // já perderia esta janela
      const empate = inicio === melhorInicio && distanciaKm(atual, p) < distanciaKm(atual, restantes[melhor]);
      if (inicio < melhorInicio || empate) {
        melhor = i;
        melhorInicio = inicio;
      }
    });

    if (melhor === -1) {
      // Nenhuma janela viável: prioriza a que fecha primeiro.
      melhor = restantes.reduce((m, p, i) => (fecha(p) < fecha(restantes[m]) ? i : m), 0);
      melhorInicio = relogio + minutosDeViagem(atual, restantes[melhor]) * MS_POR_MINUTO;
    }

    const [proximo] = restantes.splice(melhor, 1);
    ordem.push(proximo);
    relogio = melhorInicio + MINUTOS_POR_PARADA * MS_POR_MINUTO;
    atual = proximo;
  }
  return ordem;
}

/**
 * Calcula distâncias e, se houver janelas, horários de um trajeto numa ORDEM DADA
 * (sede -> pontos -> sede). Serve tanto para a rota sugerida quanto para
 * comparar com outra ordem (ex.: a ordem em que as doações foram reservadas).
 */
export function simularTrajeto<T extends Coordenada>(origem: Coordenada, ordem: T[]): RotaSugerida<T> {
  const comJanela = ordem.length > 0 && ordem.every(temJanela);
  const paradas: ParadaRota<T>[] = [];
  let atual: Coordenada = origem;
  let total = 0;
  let minutosRodando = 0;

  // A ONG sai a tempo de chegar à primeira parada quando a janela dela abre.
  let relogio =
    comJanela ? abre(ordem[0] as unknown as JanelaRetirada) - minutosDeViagem(origem, ordem[0]) * MS_POR_MINUTO : 0;

  ordem.forEach((ponto, i) => {
    const km = distanciaKm(atual, ponto);
    const viagem = minutosDeViagem(atual, ponto);
    total += km;
    minutosRodando += viagem + MINUTOS_POR_PARADA;

    let chegadaPrevista: Date | undefined;
    let coletaPrevista: Date | undefined;
    let foraDaJanela = false;
    if (comJanela) {
      const janela = ponto as unknown as JanelaRetirada;
      const chegada = relogio + viagem * MS_POR_MINUTO;
      const inicio = Math.max(chegada, abre(janela));
      chegadaPrevista = new Date(chegada);
      coletaPrevista = new Date(inicio);
      foraDaJanela = inicio > fecha(janela);
      relogio = inicio + MINUTOS_POR_PARADA * MS_POR_MINUTO;
    }

    paradas.push({ ordem: i + 1, ponto, distanciaDesdeAnteriorKm: km, chegadaPrevista, coletaPrevista, foraDaJanela });
    atual = ponto;
  });

  // Volta para a sede.
  if (ordem.length > 0) {
    total += distanciaKm(atual, origem);
    minutosRodando += minutosDeViagem(atual, origem);
  }

  return {
    paradas,
    distanciaLinhaRetaKm: total,
    distanciaEstimadaKm: total * FATOR_DESVIO_URBANO,
    tempoEstimadoMin: Math.round(minutosRodando),
    coletasForaDaJanela: paradas.filter((p) => p.foraDaJanela).length,
  };
}

/**
 * Sugere a ordem de coleta a partir da sede da ONG. Usa as janelas de retirada
 * quando todos os pontos as têm; senão, só a proximidade.
 * @param origem sede da ONG (início e fim do trajeto)
 * @param pontos locais de coleta
 */
export function sugerirRota<T extends Coordenada>(origem: Coordenada, pontos: T[]): RotaSugerida<T> {
  const ordem =
    pontos.length > 0 && pontos.every(temJanela)
      ? (ordenarComJanelas(origem, pontos as (T & JanelaRetirada)[]) as T[])
      : ordenarPorProximidade(origem, pontos);
  return simularTrajeto(origem, ordem);
}
