"use client";

/**
 * Mapa genérico com Leaflet + OpenStreetMap (sem chave de API).
 * NÃO importe este arquivo diretamente nas páginas: use `components/Mapa.tsx`,
 * que o carrega só no navegador (Leaflet acessa `window`).
 */
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

export interface MarcadorMapa {
  id: string;
  lat: number;
  lng: number;
  /** Texto curto dentro do pino (ex.: número da parada ou emoji). */
  rotulo: string;
  cor: string;
  popup?: React.ReactNode;
}

export interface MapaProps {
  marcadores: MarcadorMapa[];
  /** Linha ligando pontos (ex.: a rota sugerida). */
  linha?: [number, number][];
  selecionadoId?: string;
  onSelecionar?: (id: string) => void;
}

const CENTRO_SP: [number, number] = [-23.5505, -46.6333];

// Servidor de tiles. O padrão do OpenStreetMap serve para protótipo/demo; para
// produção com tráfego, use um provedor próprio (ver política de uso do OSM).
const URL_TILES =
  process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

// Usamos divIcon (HTML/CSS) em vez das imagens padrão do Leaflet, que quebram
// com bundlers e não permitem número/cor por marcador.
function icone(m: MarcadorMapa, destacado: boolean) {
  const tamanho = destacado ? 36 : 28;
  return L.divIcon({
    className: "",
    iconSize: [tamanho, tamanho],
    iconAnchor: [tamanho / 2, tamanho / 2],
    html: `<div style="width:${tamanho}px;height:${tamanho}px;background:${m.cor};border:3px solid white;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:white;font:700 13px system-ui">${m.rotulo}</div>`,
  });
}

/** Ajusta o zoom para enquadrar todos os marcadores sempre que eles mudam. */
function Enquadrar({ pontos }: { pontos: [number, number][] }) {
  const map = useMap();
  const chave = JSON.stringify(pontos);
  useEffect(() => {
    if (pontos.length === 0) return;
    map.fitBounds(L.latLngBounds(pontos), { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, chave]);
  return null;
}

export default function MapaLeaflet({ marcadores, linha, selecionadoId, onSelecionar }: MapaProps) {
  return (
    <MapContainer center={CENTRO_SP} zoom={12} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={URL_TILES}
      />
      {linha && linha.length > 1 && <Polyline positions={linha} pathOptions={{ color: "#15803d", weight: 4, dashArray: "8 6" }} />}
      {marcadores.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={icone(m, m.id === selecionadoId)}
          zIndexOffset={m.id === selecionadoId ? 1000 : 0}
          eventHandlers={{ click: () => onSelecionar?.(m.id) }}
        >
          {m.popup && <Popup>{m.popup}</Popup>}
        </Marker>
      ))}
      <Enquadrar pontos={marcadores.map((m) => [m.lat, m.lng])} />
    </MapContainer>
  );
}
