"use client";

import { useApp } from "@/lib/store";

/** Faixa com a última mensagem de erro (ex.: doação já reservada por outra ONG). */
export default function AvisoErro() {
  const { erro, limparErro } = useApp();
  if (!erro) return null;
  return (
    <div role="alert" className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <p>{erro}</p>
      <button onClick={limparErro} className="shrink-0 font-semibold underline">
        Fechar
      </button>
    </div>
  );
}
