"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DoacaoCard from "@/components/DoacaoCard";
import Mapa, { COR, type MarcadorMapa } from "@/components/Mapa";
import PageHeader from "@/components/PageHeader";
import SeletorOng from "@/components/SeletorOng";
import { getEstabelecimento, getOng } from "@/lib/data";
import { fmtKg } from "@/lib/formato";
import { distanciaKm } from "@/lib/rota";
import { useApp } from "@/lib/store";

type Filtro = "disponiveis" | "minhas";

export default function ColetasPage() {
  const { doacoes, ongAtualId, reservar, cancelarReserva, processando, carregando } = useApp();
  const [filtro, setFiltro] = useState<Filtro>("disponiveis");
  const [selecionadaId, setSelecionadaId] = useState<string>();
  const ong = getOng(ongAtualId)!;

  // Lista ordenada pela distância até a sede da ONG (mais perto primeiro).
  const lista = useMemo(() => {
    return doacoes
      .filter((d) => (filtro === "disponiveis" ? d.status === "disponivel" : d.status === "reservada" && d.ongId === ongAtualId))
      .map((d) => ({ doacao: d, distancia: distanciaKm(ong, d) }))
      .sort((a, b) => a.distancia - b.distancia);
  }, [doacoes, filtro, ongAtualId, ong]);

  const minhasReservas = doacoes.filter((d) => d.status === "reservada" && d.ongId === ongAtualId);
  const kgReservados = minhasReservas.reduce((s, d) => s + d.quantidadeKg, 0);

  const marcadores: MarcadorMapa[] = [
    { id: ong.id, lat: ong.lat, lng: ong.lng, rotulo: "S", cor: COR.ong, popup: <strong>{ong.nome} (sua sede)</strong> },
    ...lista.map(({ doacao: d }) => ({
      id: d.id,
      lat: d.lat,
      lng: d.lng,
      rotulo: `${Math.round(d.quantidadeKg)}`,
      cor: d.status === "disponivel" ? COR.disponivel : COR.reservadaMinha,
      popup: (
        <span>
          <strong>{getEstabelecimento(d.estabelecimentoId)?.nome}</strong>
          <br />
          {d.descricao} — {fmtKg(d.quantidadeKg)}
        </span>
      ),
    })),
  ];

  return (
    <>
      <PageHeader titulo="Doações perto de você" descricao="Reserve as doações que sua ONG consegue buscar dentro da janela de retirada.">
        <SeletorOng />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="inline-flex rounded-lg bg-stone-200 p-1 text-sm">
          {(["disponiveis", "minhas"] as Filtro[]).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filtro === f}
              onClick={() => setFiltro(f)}
              className={`rounded-md px-4 py-1.5 font-medium ${filtro === f ? "bg-white shadow-sm" : "text-stone-600"}`}
            >
              {f === "disponiveis" ? "Disponíveis" : `Minhas reservas (${minhasReservas.length})`}
            </button>
          ))}
        </div>
        {minhasReservas.length > 0 && (
          <Link href="/rota" className="rounded-lg bg-marca-600 px-4 py-2 text-sm font-semibold text-white hover:bg-marca-700">
            Ver rota de coleta · {fmtKg(kgReservados)} →
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-[360px] lg:sticky lg:top-20 lg:order-2 lg:col-span-3 lg:h-[600px]">
          <Mapa marcadores={marcadores} selecionadoId={selecionadaId} onSelecionar={setSelecionadaId} />
        </div>

        <div className="space-y-3 lg:order-1 lg:col-span-2">
          {lista.length === 0 && (
            <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-stone-500">
              {carregando
                ? "Carregando doações…"
                : filtro === "disponiveis"
                  ? "Nenhuma doação disponível agora."
                  : "Você ainda não reservou nenhuma doação."}
            </p>
          )}
          {lista.map(({ doacao, distancia }) => (
            <DoacaoCard
              key={doacao.id}
              doacao={doacao}
              distanciaKm={distancia}
              selecionada={doacao.id === selecionadaId}
              onSelecionar={() => setSelecionadaId(doacao.id)}
              acao={
                doacao.status === "disponivel" ? (
                  <button
                    onClick={() => void reservar(doacao.id)}
                    disabled={processando.has(doacao.id)}
                    className="rounded-lg bg-destaque px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    Reservar
                  </button>
                ) : (
                  <button
                    onClick={() => void cancelarReserva(doacao.id)}
                    disabled={processando.has(doacao.id)}
                    className="rounded-lg border border-stone-300 px-4 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-60"
                  >
                    Cancelar reserva
                  </button>
                )
              }
            />
          ))}
        </div>
      </div>
    </>
  );
}
