/**
 * Gráfico de barras horizontais simples, só com HTML/CSS (sem biblioteca).
 * Cada linha mostra o rótulo, a barra proporcional ao maior valor e o valor.
 */
export interface ItemBarra {
  rotulo: string;
  valor: number;
  detalhe?: string;
}

export default function BarrasHorizontais({ itens, formatar }: { itens: ItemBarra[]; formatar: (n: number) => string }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <ul className="space-y-2">
      {itens.map((i) => (
        <li key={i.rotulo} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-stone-700" title={i.rotulo}>{i.rotulo}</span>
          <span className="h-3 rounded-full bg-stone-100">
            <span className="block h-3 rounded-full bg-marca-500" style={{ width: `${(i.valor / max) * 100}%` }} />
          </span>
          <span className="text-right font-medium tabular-nums text-stone-900">
            {formatar(i.valor)}
            {i.detalhe && <span className="ml-1 font-normal text-stone-500">{i.detalhe}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
