"use client";

/**
 * Estado global da aplicação.
 *
 * Os dados vêm do repositório (lib/data/repositorio.ts): Supabase quando
 * configurado, ou o modo local de demonstração. As telas só usam `useApp()` e
 * não sabem de onde os dados vêm.
 *
 * Ainda não há login: a "ONG atual" é escolhida num seletor e fica salva no
 * navegador. TODO: trocar pela ONG do usuário autenticado.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Coleta, Doacao } from "@/lib/types";
import { getOngs } from "@/lib/data";
import { criarRepositorio, type NovaDoacao, type Repositorio } from "@/lib/data/repositorio";

const CHAVE_ONG = "resgate-alimentos:ong";

interface EstadoApp {
  modo: Repositorio["modo"];
  doacoes: Doacao[];
  coletas: Coleta[];
  /** true até a primeira carga terminar. */
  carregando: boolean;
  /** Última mensagem de erro (ex.: doação já reservada por outra ONG). */
  erro: string | null;
  limparErro: () => void;
  /** Ids de doações com uma ação em andamento (para desabilitar botões). */
  processando: ReadonlySet<string>;
  ongAtualId: string;
  setOngAtualId: (id: string) => void;
  /** Lança erro se não conseguir publicar (o formulário mostra a mensagem). */
  adicionarDoacao: (d: NovaDoacao) => Promise<Doacao>;
  reservar: (doacaoId: string) => Promise<void>;
  cancelarReserva: (doacaoId: string) => Promise<void>;
  confirmarColeta: (doacaoId: string) => Promise<void>;
  /** Só existe no modo local. */
  resetarDemo?: () => Promise<void>;
}

const Contexto = createContext<EstadoApp | null>(null);

// Um repositório por aba do navegador.
let repositorio: Repositorio | null = null;
const obterRepositorio = () => (repositorio ??= criarRepositorio());

export function AppProvider({ children }: { children: React.ReactNode }) {
  const repo = obterRepositorio();
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [coletas, setColetas] = useState<Coleta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState<ReadonlySet<string>>(new Set());
  const [ongAtualId, setOngAtual] = useState<string>(getOngs()[0].id);

  const recarregar = useCallback(async () => {
    try {
      const [d, c] = await Promise.all([repo.listarDoacoes(), repo.listarColetas()]);
      setDoacoes(d);
      setColetas(c);
    } catch (e) {
      setErro(mensagem(e));
    } finally {
      setCarregando(false);
    }
  }, [repo]);

  // Primeira carga + atualização em tempo real (modo Supabase).
  useEffect(() => {
    try {
      const ong = localStorage.getItem(CHAVE_ONG);
      if (ong && getOngs().some((o) => o.id === ong)) setOngAtual(ong);
    } catch {
      /* ignora */
    }
    void recarregar();
    return repo.observar(() => void recarregar());
  }, [repo, recarregar]);

  const setOngAtualId = useCallback((id: string) => {
    setOngAtual(id);
    try {
      localStorage.setItem(CHAVE_ONG, id);
    } catch {
      /* ignora */
    }
  }, []);

  /** Executa uma ação sobre uma doação, mostrando erro e recarregando no fim. */
  const executar = useCallback(
    async (doacaoId: string, acao: () => Promise<void>) => {
      setProcessando((p) => new Set(p).add(doacaoId));
      try {
        await acao();
      } catch (e) {
        setErro(mensagem(e));
      } finally {
        await recarregar();
        setProcessando((p) => {
          const novo = new Set(p);
          novo.delete(doacaoId);
          return novo;
        });
      }
    },
    [recarregar],
  );

  const valor = useMemo<EstadoApp>(
    () => ({
      modo: repo.modo,
      doacoes,
      coletas,
      carregando,
      erro,
      limparErro: () => setErro(null),
      processando,
      ongAtualId,
      setOngAtualId,
      adicionarDoacao: async (d) => {
        const nova = await repo.criarDoacao(d);
        await recarregar();
        return nova;
      },
      reservar: (id) => executar(id, () => repo.reservar(id, ongAtualId)),
      cancelarReserva: (id) => executar(id, () => repo.cancelarReserva(id, ongAtualId)),
      confirmarColeta: (id) => executar(id, () => repo.confirmarColeta(id, ongAtualId)),
      resetarDemo: repo.reiniciar
        ? async () => {
            await repo.reiniciar!();
            setOngAtualId(getOngs()[0].id);
            await recarregar();
          }
        : undefined,
    }),
    [repo, doacoes, coletas, carregando, erro, processando, ongAtualId, setOngAtualId, recarregar, executar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

function mensagem(e: unknown): string {
  return e instanceof Error ? e.message : "Algo deu errado. Tente de novo.";
}

export function useApp(): EstadoApp {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useApp precisa estar dentro de <AppProvider>");
  return ctx;
}
