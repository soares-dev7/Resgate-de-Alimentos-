"use client";

/**
 * Estado global da demo (em memória + localStorage do navegador).
 *
 * Nesta fase não há banco de dados nem autenticação: a "ONG logada" é escolhida
 * num seletor e as doações vivem no navegador. Quando houver back-end, este
 * provider passa a chamar a API (ou hooks do Convex/Supabase) em vez de
 * manipular o array local.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Doacao } from "@/lib/types";
import { getDoacoesIniciais, getOngs } from "@/lib/data";

const CHAVE_STORAGE = "resgate-alimentos:v1";

interface EstadoApp {
  doacoes: Doacao[];
  ongAtualId: string;
  setOngAtualId: (id: string) => void;
  adicionarDoacao: (d: Omit<Doacao, "id" | "status">) => Doacao;
  reservar: (doacaoId: string) => void;
  cancelarReserva: (doacaoId: string) => void;
  confirmarColeta: (doacaoId: string) => void;
  resetarDemo: () => void;
}

const Contexto = createContext<EstadoApp | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [doacoes, setDoacoes] = useState<Doacao[]>(() => getDoacoesIniciais());
  const [ongAtualId, setOngAtualId] = useState<string>(getOngs()[0].id);
  const [carregado, setCarregado] = useState(false);

  // Carrega o estado salvo depois da montagem (evita divergência de hidratação SSR).
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_STORAGE);
      if (salvo) {
        const dados = JSON.parse(salvo) as { doacoes: Doacao[]; ongAtualId: string };
        setDoacoes(dados.doacoes);
        setOngAtualId(dados.ongAtualId);
      }
    } catch {
      // localStorage indisponível ou corrompido: segue com os mocks.
    }
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify({ doacoes, ongAtualId }));
    } catch {
      /* ignora */
    }
  }, [doacoes, ongAtualId, carregado]);

  const atualizar = useCallback((id: string, mudanca: Partial<Doacao>) => {
    setDoacoes((lista) => lista.map((d) => (d.id === id ? { ...d, ...mudanca } : d)));
  }, []);

  const valor = useMemo<EstadoApp>(
    () => ({
      doacoes,
      ongAtualId,
      setOngAtualId,
      adicionarDoacao: (d) => {
        const nova: Doacao = { ...d, id: `doa-${Date.now()}`, status: "disponivel" };
        setDoacoes((lista) => [nova, ...lista]);
        return nova;
      },
      reservar: (id) =>
        atualizar(id, { status: "reservada", ongId: ongAtualId, reservadaEm: new Date().toISOString() }),
      cancelarReserva: (id) =>
        atualizar(id, { status: "disponivel", ongId: undefined, reservadaEm: undefined }),
      confirmarColeta: (id) =>
        atualizar(id, { status: "coletada", coletadaEm: new Date().toISOString() }),
      resetarDemo: () => {
        setDoacoes(getDoacoesIniciais());
        setOngAtualId(getOngs()[0].id);
      },
    }),
    [doacoes, ongAtualId, atualizar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useApp(): EstadoApp {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useApp precisa estar dentro de <AppProvider>");
  return ctx;
}
