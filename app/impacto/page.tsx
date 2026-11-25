"use client";

import BarrasHorizontais from "@/components/BarrasHorizontais";
import PageHeader from "@/components/PageHeader";
import { getEstabelecimento, getOng } from "@/lib/data";
import { fmtDia, fmtKg, fmtNumero } from "@/lib/formato";
import { CO2E_KG_POR_KG_ALIMENTO, KG_POR_REFEICAO, agruparPor, inicioDaSemana, resumir } from "@/lib/impacto";
import { useApp } from "@/lib/store";

export default function ImpactoPage() {
  // Coletas concluídas: histórico + as confirmadas em /rota (ver lib/data/repositorio.ts).
  const { coletas, resetarDemo, carregando } = useApp();

  const total = resumir(coletas);
  const porSemana = agruparPor(coletas, (c) => inicioDaSemana(c.data))
    .sort((a, b) => a.chave.localeCompare(b.chave))
    .slice(-6);
  const porEstabelecimento = agruparPor(coletas, (c) => c.estabelecimentoId);
  const porOng = agruparPor(coletas, (c) => c.ongId);

  return (
    <>
      <PageHeader titulo="Painel de impacto" descricao="Quanto alimento deixou de ir para o lixo e virou refeição. Dados de demonstração.">
        {resetarDemo && (
          <button onClick={() => void resetarDemo()} className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-600 hover:bg-stone-100">
            Reiniciar dados da demo
          </button>
        )}
      </PageHeader>

      {carregando && <p className="mb-4 text-sm text-stone-500">Carregando dados de impacto…</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Destaque rotulo="Alimento resgatado" valor={fmtKg(total.kg)} />
        <Destaque rotulo="Refeições estimadas" valor={fmtNumero(total.refeicoes)} />
        <Destaque rotulo="CO₂e evitado (estimado)" valor={`${fmtNumero(total.co2eKg / 1000)} t`} />
        <Destaque rotulo="Coletas realizadas" valor={fmtNumero(total.coletas)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Bloco titulo="Kg resgatados por semana">
          <BarrasHorizontais
            itens={porSemana.map((s) => ({ rotulo: `Semana de ${fmtDia(s.chave)}`, valor: s.resumo.kg, detalhe: `· ${s.resumo.coletas} coletas` }))}
            formatar={fmtKg}
          />
        </Bloco>

        <Bloco titulo="Por ONG">
          <BarrasHorizontais
            itens={porOng.map((o) => ({ rotulo: getOng(o.chave)?.nome ?? o.chave, valor: o.resumo.kg, detalhe: `· ${fmtNumero(o.resumo.refeicoes)} ref.` }))}
            formatar={fmtKg}
          />
        </Bloco>

        <Bloco titulo="Por estabelecimento" className="lg:col-span-2">
          <BarrasHorizontais
            itens={porEstabelecimento.map((e) => ({ rotulo: getEstabelecimento(e.chave)?.nome ?? e.chave, valor: e.resumo.kg, detalhe: `· ${e.resumo.coletas} coletas` }))}
            formatar={fmtKg}
          />
        </Bloco>
      </div>

      <p className="mt-6 text-xs text-stone-500">
        Estimativas: 1 refeição ≈ {fmtNumero(KG_POR_REFEICAO * 1000)} g de alimento; {fmtNumero(CO2E_KG_POR_KG_ALIMENTO)} kg de
        CO₂e evitados por kg resgatado (ordem de grandeza da FAO). Detalhes em <code>lib/impacto.ts</code>.
      </p>
    </>
  );
}

function Destaque({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-sm text-stone-500">{rotulo}</p>
      <p className="mt-1 text-2xl font-extrabold text-marca-700 sm:text-3xl">{valor}</p>
    </div>
  );
}

function Bloco({ titulo, className = "", children }: { titulo: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border border-stone-200 bg-white p-5 ${className}`}>
      <h2 className="mb-4 font-semibold text-stone-900">{titulo}</h2>
      {children}
    </section>
  );
}
