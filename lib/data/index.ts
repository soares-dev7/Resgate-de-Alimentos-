/**
 * Camada de acesso a dados (MOCK).
 *
 * Todas as telas leem dados por aqui — nunca importam os JSON diretamente.
 * Para trocar por um backend real (Convex, Supabase...), basta reimplementar
 * estas funções mantendo as mesmas assinaturas (provavelmente tornando-as async).
 */
import type { Coleta, Doacao, Estabelecimento, Ong } from "@/lib/types";
import estabelecimentosJson from "./estabelecimentos.json";
import ongsJson from "./ongs.json";
import doacoesJson from "./doacoes.json";
import coletasJson from "./coletas.json";

const estabelecimentos = estabelecimentosJson as Estabelecimento[];
const ongs = ongsJson as Ong[];

export function getEstabelecimentos(): Estabelecimento[] {
  return estabelecimentos;
}

export function getEstabelecimento(id: string): Estabelecimento | undefined {
  return estabelecimentos.find((e) => e.id === id);
}

export function getOngs(): Ong[] {
  return ongs;
}

export function getOng(id: string): Ong | undefined {
  return ongs.find((o) => o.id === id);
}

/** Histórico de coletas concluídas (usado no painel de impacto). */
export function getColetasHistoricas(): Coleta[] {
  return coletasJson as Coleta[];
}

// --- Doações -------------------------------------------------------------

/** Formato do JSON: datas relativas a "hoje" para a demo nunca ficar vencida. */
type DoacaoMock = {
  id: string;
  estabelecimentoId: string;
  categoria: Doacao["categoria"];
  descricao: string;
  quantidadeKg: number;
  validadeEmDias: number;
  janela: { emDias: number; inicio: string; fim: string };
};

/** Data local no formato YYYY-MM-DD, deslocada em `dias` a partir de `base`. */
export function dataISO(base: Date, dias = 0): string {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Doações iniciais da demo, já com datas absolutas calculadas a partir de hoje. */
export function getDoacoesIniciais(hoje: Date = new Date()): Doacao[] {
  return (doacoesJson as DoacaoMock[]).map((m) => {
    const est = getEstabelecimento(m.estabelecimentoId)!;
    const diaJanela = dataISO(hoje, m.janela.emDias);
    return {
      id: m.id,
      estabelecimentoId: m.estabelecimentoId,
      categoria: m.categoria,
      descricao: m.descricao,
      quantidadeKg: m.quantidadeKg,
      validade: dataISO(hoje, m.validadeEmDias),
      janelaInicio: `${diaJanela}T${m.janela.inicio}`,
      janelaFim: `${diaJanela}T${m.janela.fim}`,
      endereco: est.endereco,
      bairro: est.bairro,
      lat: est.lat,
      lng: est.lng,
      status: "disponivel",
    };
  });
}

// --- Rótulos para exibição ----------------------------------------------

export const ROTULO_CATEGORIA: Record<Doacao["categoria"], string> = {
  paes: "Pães e panificados",
  hortifruti: "Hortifrúti",
  refeicoes_prontas: "Refeições prontas",
  laticinios: "Laticínios",
  graos: "Grãos e secos",
  outros: "Outros",
};

/**
 * Bairros de São Paulo com coordenadas aproximadas do centro.
 * Enquanto não há geocodificação, o formulário de doação usa esta lista
 * para posicionar a doação no mapa.
 * TODO: substituir por geocodificação do endereço (ex.: Nominatim/OSM).
 */
export const BAIRROS_SP: Record<string, { lat: number; lng: number }> = {
  "Bela Vista": { lat: -23.5614, lng: -46.6497 },
  Brás: { lat: -23.5436, lng: -46.6155 },
  Butantã: { lat: -23.5719, lng: -46.7083 },
  Lapa: { lat: -23.5269, lng: -46.7036 },
  Liberdade: { lat: -23.5587, lng: -46.6353 },
  Moema: { lat: -23.6006, lng: -46.6656 },
  Mooca: { lat: -23.5587, lng: -46.5996 },
  Pinheiros: { lat: -23.5666, lng: -46.6922 },
  Santana: { lat: -23.5025, lng: -46.6253 },
  Sé: { lat: -23.5505, lng: -46.6333 },
  Tatuapé: { lat: -23.5404, lng: -46.5763 },
  "Vila Madalena": { lat: -23.553, lng: -46.6912 },
  "Vila Mariana": { lat: -23.5893, lng: -46.6346 },
};
