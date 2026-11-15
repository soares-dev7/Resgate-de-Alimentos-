"use client";

import dynamic from "next/dynamic";
export type { MarcadorMapa } from "./MapaLeaflet";

/** Mapa carregado apenas no cliente (Leaflet não funciona no servidor). */
const Mapa = dynamic(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl bg-stone-100 text-stone-500">Carregando mapa…</div>
  ),
});

export default Mapa;

/** Cores dos marcadores por situação. */
export const COR = {
  disponivel: "#ea580c",
  reservadaMinha: "#15803d",
  reservadaOutra: "#a8a29e",
  ong: "#1d4ed8",
} as const;
