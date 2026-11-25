/**
 * Repositório de dados: o único ponto que sabe ONDE as doações e coletas ficam.
 *
 * - Modo "supabase": banco compartilhado (todas as pessoas veem os mesmos
 *   dados, com atualização em tempo real). Ativado quando as variáveis
 *   NEXT_PUBLIC_SUPABASE_* estão definidas.
 * - Modo "local": dados mockados salvos no navegador. Usado quando o Supabase
 *   não está configurado, para a demo funcionar sempre.
 *
 * Estabelecimentos e ONGs continuam vindo de lib/data/*.json nos dois modos
 * (o banco tem as mesmas linhas, carregadas por supabase/seed.sql), porque
 * ainda não existe tela de cadastro deles.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { CategoriaAlimento, Coleta, Doacao, StatusDoacao } from "@/lib/types";
import { getColetasHistoricas, getDoacoesIniciais } from "./index";

export type NovaDoacao = Omit<Doacao, "id" | "status" | "ongId" | "reservadaEm" | "coletadaEm">;

export interface Repositorio {
  modo: "local" | "supabase";
  listarDoacoes(): Promise<Doacao[]>;
  /** Coletas concluídas, para o painel de impacto. */
  listarColetas(): Promise<Coleta[]>;
  criarDoacao(d: NovaDoacao): Promise<Doacao>;
  /** Falha se a doação já tiver sido reservada por alguém. */
  reservar(doacaoId: string, ongId: string): Promise<void>;
  cancelarReserva(doacaoId: string, ongId: string): Promise<void>;
  confirmarColeta(doacaoId: string, ongId: string): Promise<void>;
  /** Avisa quando os dados mudarem em outro lugar. Devolve a função para parar. */
  observar(aoMudar: () => void): () => void;
  /** Volta aos dados iniciais (só no modo local). */
  reiniciar?(): Promise<void>;
}

// --- Modo local ------------------------------------------------------------

const CHAVE_LOCAL = "resgate-alimentos:v2:doacoes";

function criarRepositorioLocal(): Repositorio {
  let doacoes: Doacao[] | null = null;

  const carregar = (): Doacao[] => {
    if (doacoes) return doacoes;
    try {
      const salvo = localStorage.getItem(CHAVE_LOCAL);
      doacoes = salvo ? (JSON.parse(salvo) as Doacao[]) : getDoacoesIniciais();
    } catch {
      doacoes = getDoacoesIniciais();
    }
    return doacoes;
  };
  const salvar = (lista: Doacao[]) => {
    doacoes = lista;
    try {
      localStorage.setItem(CHAVE_LOCAL, JSON.stringify(lista));
    } catch {
      /* navegador sem localStorage: segue só em memória */
    }
  };
  const alterar = (id: string, condicao: (d: Doacao) => boolean, mudanca: Partial<Doacao>, erro: string) => {
    const lista = carregar();
    const alvo = lista.find((d) => d.id === id);
    if (!alvo || !condicao(alvo)) throw new Error(erro);
    salvar(lista.map((d) => (d.id === id ? { ...d, ...mudanca } : d)));
  };

  return {
    modo: "local",
    async listarDoacoes() {
      return carregar();
    },
    async listarColetas() {
      // Histórico mockado + coletas confirmadas neste navegador.
      const daSessao: Coleta[] = carregar()
        .filter((d) => d.status === "coletada" && d.ongId)
        .map((d) => ({
          id: `sessao-${d.id}`,
          estabelecimentoId: d.estabelecimentoId,
          ongId: d.ongId!,
          categoria: d.categoria,
          kg: d.quantidadeKg,
          data: (d.coletadaEm ?? new Date().toISOString()).slice(0, 10),
        }));
      return [...getColetasHistoricas(), ...daSessao];
    },
    async criarDoacao(d) {
      const nova: Doacao = { ...d, id: `doa-${Date.now()}`, status: "disponivel" };
      salvar([nova, ...carregar()]);
      return nova;
    },
    async reservar(id, ongId) {
      alterar(id, (d) => d.status === "disponivel", { status: "reservada", ongId, reservadaEm: new Date().toISOString() },
        "Esta doação não está mais disponível.");
    },
    async cancelarReserva(id, ongId) {
      alterar(id, (d) => d.status === "reservada" && d.ongId === ongId,
        { status: "disponivel", ongId: undefined, reservadaEm: undefined }, "Reserva não encontrada para esta ONG.");
    },
    async confirmarColeta(id, ongId) {
      alterar(id, (d) => d.status === "reservada" && d.ongId === ongId,
        { status: "coletada", coletadaEm: new Date().toISOString() }, "Reserva não encontrada para esta ONG.");
    },
    observar() {
      return () => {};
    },
    async reiniciar() {
      salvar(getDoacoesIniciais());
    },
  };
}

// --- Modo Supabase -----------------------------------------------------------

/** Linha da tabela `doacoes` (nomes em snake_case, como no banco). */
interface LinhaDoacao {
  id: string;
  estabelecimento_id: string;
  categoria: CategoriaAlimento;
  descricao: string;
  quantidade_kg: number | string;
  validade: string;
  janela_inicio: string;
  janela_fim: string;
  endereco: string;
  bairro: string;
  lat: number;
  lng: number;
  status: StatusDoacao;
  ong_id: string | null;
  reservada_em: string | null;
  coletada_em: string | null;
}

interface LinhaColeta {
  id: string;
  estabelecimento_id: string;
  ong_id: string;
  categoria: CategoriaAlimento;
  kg: number | string;
  data: string;
}

// O banco devolve "2026-11-25T14:30:00"; o app usa "2026-11-25T14:30".
const semSegundos = (t: string) => t.slice(0, 16);

function paraDoacao(l: LinhaDoacao): Doacao {
  return {
    id: l.id,
    estabelecimentoId: l.estabelecimento_id,
    categoria: l.categoria,
    descricao: l.descricao,
    quantidadeKg: Number(l.quantidade_kg),
    validade: l.validade,
    janelaInicio: semSegundos(l.janela_inicio),
    janelaFim: semSegundos(l.janela_fim),
    endereco: l.endereco,
    bairro: l.bairro,
    lat: l.lat,
    lng: l.lng,
    status: l.status,
    ongId: l.ong_id ?? undefined,
    reservadaEm: l.reservada_em ?? undefined,
    coletadaEm: l.coletada_em ?? undefined,
  };
}

function paraColeta(l: LinhaColeta): Coleta {
  return {
    id: l.id,
    estabelecimentoId: l.estabelecimento_id,
    ongId: l.ong_id,
    categoria: l.categoria,
    kg: Number(l.kg),
    data: l.data,
  };
}

/** Lança um erro com mensagem legível a partir da resposta do Supabase. */
function verificar(erro: { message: string } | null, contexto: string) {
  if (erro) throw new Error(`${contexto}: ${erro.message}`);
}

function criarRepositorioSupabase(db: SupabaseClient): Repositorio {
  const chamar = async (funcao: string, doacaoId: string, ongId: string) => {
    const { error } = await db.rpc(funcao, { p_doacao: doacaoId, p_ong: ongId });
    // As funções do banco já devolvem mensagens em português (ver supabase/schema.sql).
    if (error) throw new Error(error.message);
  };

  return {
    modo: "supabase",
    async listarDoacoes() {
      const { data, error } = await db.from("doacoes").select("*").order("criada_em", { ascending: false });
      verificar(error, "Não foi possível carregar as doações");
      return (data as LinhaDoacao[]).map(paraDoacao);
    },
    async listarColetas() {
      const { data, error } = await db.from("coletas").select("*");
      verificar(error, "Não foi possível carregar as coletas");
      return (data as LinhaColeta[]).map(paraColeta);
    },
    async criarDoacao(d) {
      const { data, error } = await db
        .from("doacoes")
        .insert({
          estabelecimento_id: d.estabelecimentoId,
          categoria: d.categoria,
          descricao: d.descricao,
          quantidade_kg: d.quantidadeKg,
          validade: d.validade,
          janela_inicio: d.janelaInicio,
          janela_fim: d.janelaFim,
          endereco: d.endereco,
          bairro: d.bairro,
          lat: d.lat,
          lng: d.lng,
        })
        .select()
        .single();
      verificar(error, "Não foi possível publicar a doação");
      return paraDoacao(data as LinhaDoacao);
    },
    reservar: (id, ongId) => chamar("reservar_doacao", id, ongId),
    cancelarReserva: (id, ongId) => chamar("cancelar_reserva", id, ongId),
    confirmarColeta: (id, ongId) => chamar("confirmar_coleta", id, ongId),
    observar(aoMudar) {
      // Tempo real: qualquer mudança em doações ou coletas recarrega os dados.
      const canal = db
        .channel("resgate-dados")
        .on("postgres_changes", { event: "*", schema: "public", table: "doacoes" }, aoMudar)
        .on("postgres_changes", { event: "*", schema: "public", table: "coletas" }, aoMudar)
        .subscribe();
      return () => {
        void db.removeChannel(canal);
      };
    },
  };
}

/** Escolhe o modo conforme a configuração do ambiente. */
export function criarRepositorio(): Repositorio {
  return supabase ? criarRepositorioSupabase(supabase) : criarRepositorioLocal();
}
