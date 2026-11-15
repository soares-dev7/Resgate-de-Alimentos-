"use client";

import { getOngs } from "@/lib/data";
import { useApp } from "@/lib/store";

/**
 * Sem autenticação nesta fase: a ONG "logada" é escolhida aqui.
 * TODO: substituir pela ONG do usuário autenticado.
 */
export default function SeletorOng() {
  const { ongAtualId, setOngAtualId } = useApp();
  return (
    <label className="flex flex-col text-sm text-stone-600">
      Você está como
      <select
        value={ongAtualId}
        onChange={(e) => setOngAtualId(e.target.value)}
        className="mt-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900"
      >
        {getOngs().map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
