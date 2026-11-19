import { ROTULO_CATEGORIA, getEstabelecimento } from "@/lib/data";
import { fmtDia, fmtJanela, fmtKg } from "@/lib/formato";
import type { Doacao } from "@/lib/types";

interface Props {
  doacao: Doacao;
  distanciaKm?: number;
  selecionada?: boolean;
  onSelecionar?: () => void;
  acao?: React.ReactNode;
}

export default function DoacaoCard({ doacao, distanciaKm, selecionada, onSelecionar, acao }: Props) {
  const est = getEstabelecimento(doacao.estabelecimentoId);
  return (
    <article
      onClick={onSelecionar}
      className={`cursor-pointer rounded-xl border bg-white p-4 transition-shadow hover:shadow-md ${
        selecionada ? "border-marca-500 ring-2 ring-marca-100" : "border-stone-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-destaque">{ROTULO_CATEGORIA[doacao.categoria]}</p>
          <h3 className="font-semibold text-stone-900">{est?.nome ?? "Estabelecimento"}</h3>
          <p className="text-sm text-stone-600">{doacao.descricao}</p>
        </div>
        <p className="shrink-0 text-lg font-bold text-marca-700">{fmtKg(doacao.quantidadeKg)}</p>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-stone-600 sm:grid-cols-3">
        <div><dt className="inline font-medium">Retirada: </dt><dd className="inline">{fmtJanela(doacao.janelaInicio, doacao.janelaFim)}</dd></div>
        <div><dt className="inline font-medium">Validade: </dt><dd className="inline">{fmtDia(doacao.validade)}</dd></div>
        <div>
          <dt className="inline font-medium">Local: </dt>
          <dd className="inline">
            {doacao.bairro}
            {distanciaKm !== undefined && ` · ${distanciaKm.toFixed(1).replace(".", ",")} km`}
          </dd>
        </div>
      </dl>
      {acao && <div className="mt-3" onClick={(e) => e.stopPropagation()}>{acao}</div>}
    </article>
  );
}
