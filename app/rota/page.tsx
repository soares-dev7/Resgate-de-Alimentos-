"use client";

import Link from "next/link";
import { useMemo } from "react";
import Mapa, { COR, type MarcadorMapa } from "@/components/Mapa";
import PageHeader from "@/components/PageHeader";
import SeletorOng from "@/components/SeletorOng";
import { getEstabelecimento, getOng } from "@/lib/data";
import { fmtDiaHora, fmtJanela, fmtKg, fmtNumero } from "@/lib/formato";
import { calcularImpacto } from "@/lib/impacto";
import { type RotaSugerida, VELOCIDADE_MEDIA_KMH, simularTrajeto, sugerirRota } from "@/lib/rota";
import { useApp } from "@/lib/store";

export default function RotaPage() {
  const { doacoes, ongAtualId, confirmarColeta } = useApp();
  const ong = getOng(ongAtualId)!;

  const reservadas = useMemo(
    () => doacoes.filter((d) => d.status === "reservada" && d.ongId === ongAtualId),
    [doacoes, ongAtualId],
  );
  // Rota calculada a partir da sede da ONG (ver lib/rota.ts).
  const rota = useMemo(() => sugerirRota(ong, reservadas), [ong, reservadas]);
  // Referência para medir o ganho: buscar na ordem em que as doações foram reservadas.
  const naOrdemDasReservas = useMemo(
    () =>
      simularTrajeto(
        ong,
        [...reservadas].sort((a, b) => (a.reservadaEm ?? "").localeCompare(b.reservadaEm ?? "")),
      ),
    [ong, reservadas],
  );
  const coletadasHoje = doacoes.filter((d) => d.status === "coletada" && d.ongId === ongAtualId);

  const kgTotal = reservadas.reduce((s, d) => s + d.quantidadeKg, 0);
  const impactoPrevisto = calcularImpacto(kgTotal, reservadas.length);

  const marcadores: MarcadorMapa[] = [
    { id: ong.id, lat: ong.lat, lng: ong.lng, rotulo: "S", cor: COR.ong, popup: <strong>{ong.nome} (início e fim)</strong> },
    ...rota.paradas.map((p) => ({
      id: p.ponto.id,
      lat: p.ponto.lat,
      lng: p.ponto.lng,
      rotulo: String(p.ordem),
      cor: COR.reservadaMinha,
      popup: (
        <span>
          <strong>{p.ordem}. {getEstabelecimento(p.ponto.estabelecimentoId)?.nome}</strong>
          <br />
          {fmtKg(p.ponto.quantidadeKg)} · {fmtJanela(p.ponto.janelaInicio, p.ponto.janelaFim)}
        </span>
      ),
    })),
  ];
  // Sede -> paradas na ordem -> sede.
  const linha: [number, number][] = rota.paradas.length
    ? [[ong.lat, ong.lng], ...rota.paradas.map((p): [number, number] => [p.ponto.lat, p.ponto.lng]), [ong.lat, ong.lng]]
    : [];

  return (
    <>
      <PageHeader titulo="Rota de coleta sugerida" descricao="Ordem de retirada das doações reservadas, partindo e voltando à sede da ONG.">
        <SeletorOng />
      </PageHeader>

      {reservadas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center">
          <p className="text-stone-600">Nenhuma doação reservada para montar a rota.</p>
          {coletadasHoje.length > 0 && (
            <p className="mt-1 text-marca-700">{coletadasHoje.length} coleta(s) confirmada(s). Veja no painel de impacto.</p>
          )}
          <Link href="/coletas" className="mt-4 inline-block rounded-lg bg-marca-600 px-4 py-2 font-semibold text-white">
            Reservar doações
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Resumo rotulo="Paradas" valor={String(rota.paradas.length)} />
            <Resumo rotulo="Distância estimada" valor={`${fmtNumero(rota.distanciaEstimadaKm)} km`} />
            <Resumo rotulo="Tempo estimado" valor={`${rota.tempoEstimadoMin} min`} />
            <Resumo rotulo="A resgatar" valor={`${fmtKg(kgTotal)} · ~${impactoPrevisto.refeicoes} refeições`} />
          </div>

          {rota.paradas.length > 1 && <Comparacao rota={rota} referencia={naOrdemDasReservas} />}

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="h-[360px] lg:col-span-3 lg:h-[560px]">
              <Mapa marcadores={marcadores} linha={linha} />
            </div>

            <ol className="space-y-3 lg:col-span-2">
              {rota.paradas.map((p) => {
                const est = getEstabelecimento(p.ponto.estabelecimentoId);
                return (
                  <li
                    key={p.ponto.id}
                    className={`flex gap-3 rounded-xl border bg-white p-4 ${p.foraDaJanela ? "border-red-300" : "border-stone-200"}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-marca-600 font-bold text-white">{p.ordem}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold">{est?.nome}</h3>
                      <p className="text-sm text-stone-600">{p.ponto.endereco} · {p.ponto.bairro}</p>
                      <p className="text-sm text-stone-600">
                        {fmtKg(p.ponto.quantidadeKg)} · janela {fmtJanela(p.ponto.janelaInicio, p.ponto.janelaFim)}
                      </p>
                      {p.coletaPrevista && (
                        <p className="text-sm font-medium text-stone-800">Coleta prevista: {fmtDiaHora(p.coletaPrevista)}</p>
                      )}
                      {p.foraDaJanela && (
                        <p className="mt-1 rounded-md bg-red-50 px-2 py-1 text-sm text-red-700">
                          Fora da janela: não dá para chegar antes de {p.ponto.janelaFim.slice(11, 16)}.
                        </p>
                      )}
                      <p className="text-xs text-stone-500">+{fmtNumero(p.distanciaDesdeAnteriorKm)} km em linha reta desde a parada anterior</p>
                      <button
                        onClick={() => confirmarColeta(p.ponto.id)}
                        className="mt-2 rounded-lg bg-marca-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-marca-700"
                      >
                        Confirmar coleta
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <p className="mt-4 text-xs text-stone-500">
            Rota calculada pela heurística do vizinho mais próximo respeitando as janelas de retirada, com
            distâncias em linha reta (×1,3 para estimar o trajeto por ruas) e {VELOCIDADE_MEDIA_KMH} km/h de média.
            Ainda não considera trânsito real.
          </p>
        </>
      )}
    </>
  );
}

/** Compara a rota sugerida com a ordem das reservas: km economizados e janelas salvas. */
function Comparacao({ rota, referencia }: { rota: RotaSugerida<unknown>; referencia: RotaSugerida<unknown> }) {
  const economiaKm = referencia.distanciaEstimadaKm - rota.distanciaEstimadaKm;
  const percentual = referencia.distanciaEstimadaKm > 0 ? (economiaKm / referencia.distanciaEstimadaKm) * 100 : 0;
  const janelasSalvas = referencia.coletasForaDaJanela - rota.coletasForaDaJanela;
  // Diferenças abaixo de 100 m são ruído da estimativa.
  const LIMIAR_KM = 0.1;

  let distancia: string;
  if (economiaKm > LIMIAR_KM) {
    distancia = `${fmtNumero(economiaKm)} km a menos (${Math.round(percentual)}%) do que buscar na ordem das reservas.`;
  } else if (economiaKm < -LIMIAR_KM) {
    distancia = `${fmtNumero(-economiaKm)} km a mais do que na ordem das reservas, para chegar dentro das janelas.`;
  } else {
    distancia = "Mesma distância da ordem das reservas: ela já era uma boa sequência.";
  }

  return (
    <div className="mb-6 rounded-xl border border-marca-500 bg-marca-50 p-4 text-sm text-stone-800">
      <p className="font-semibold text-marca-700">Ganho da rota sugerida</p>
      {janelasSalvas > 0 && (
        <p className="mt-1">
          Evita {janelasSalvas} coleta(s) fora da janela: na ordem das reservas, elas chegariam depois do fim da
          janela de retirada.
        </p>
      )}
      <p className="mt-1">{distancia}</p>
      {rota.coletasForaDaJanela > 0 && (
        <p className="mt-2 text-red-700">
          {rota.coletasForaDaJanela} coleta(s) não cabem na janela mesmo na melhor ordem encontrada. Avalie cancelar
          a reserva para liberar a doação a outra ONG.
        </p>
      )}
    </div>
  );
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-xs text-stone-500">{rotulo}</p>
      <p className="text-lg font-bold text-stone-900">{valor}</p>
    </div>
  );
}
