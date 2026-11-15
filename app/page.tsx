import Link from "next/link";

const PASSOS = [
  { n: 1, titulo: "Estabelecimento cadastra", texto: "Tipo de alimento, quantidade, validade, janela de retirada e endereço — em menos de um minuto." },
  { n: 2, titulo: "ONG reserva", texto: "ONGs próximas veem as doações num mapa e reservam o que conseguem buscar." },
  { n: 3, titulo: "Rota otimizada", texto: "O sistema agrupa as reservas da ONG e sugere a melhor ordem de retirada." },
  { n: 4, titulo: "Impacto registrado", texto: "Cada coleta confirmada vira kg resgatados, refeições e CO₂ evitado." },
];

export default function Home() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="grid items-center gap-10 pt-6 md:grid-cols-2">
        <div>
          <p className="mb-3 inline-block rounded-full bg-marca-100 px-3 py-1 text-sm font-medium text-marca-700">
            Hack Brasil 2026 · Logística e Automação
          </p>
          <h1 className="text-4xl font-extrabold leading-tight text-stone-900 sm:text-5xl">
            Comida boa não é lixo. <span className="text-marca-600">É refeição.</span>
          </h1>
          <p className="mt-4 text-lg text-stone-600">
            Conectamos mercados, padarias e restaurantes com sobras próprias para consumo a ONGs e
            cozinhas comunitárias — e organizamos a coleta com rotas otimizadas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/doar" className="rounded-xl bg-marca-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-marca-700">
              Sou estabelecimento
            </Link>
            <Link href="/coletas" className="rounded-xl border-2 border-marca-600 px-6 py-3 font-semibold text-marca-700 hover:bg-marca-50">
              Sou ONG
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-marca-100 to-orange-100 p-8">
          <div className="grid grid-cols-2 gap-6">
            <Numero valor="~94 kg" rotulo="de comida desperdiçada por brasileiro ao ano, só em casa¹" />
            <Numero valor="1/3" rotulo="dos alimentos produzidos no mundo se perdem ou são desperdiçados²" />
            <Numero valor="2,5 kg" rotulo="de CO₂e emitidos, em média, por kg de alimento desperdiçado²" />
            <Numero valor="Milhões" rotulo="de brasileiros ainda vivem em insegurança alimentar³" />
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">O problema</h2>
          <p className="mt-3 text-stone-600">
            Todos os dias, estabelecimentos descartam alimentos em perfeito estado: pães do dia, frutas
            com pequenas imperfeições, refeições que sobraram do almoço. Ao mesmo tempo, ONGs e cozinhas
            comunitárias a poucos quilômetros não têm comida suficiente.
          </p>
          <p className="mt-3 text-stone-600">
            O gargalo não é a falta de vontade — é a <strong>logística</strong>: quem tem sobra não sabe
            para quem doar, a janela de retirada é curta e a ONG não tem tempo nem combustível para
            rodar a cidade sem planejamento.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold">A solução</h2>
          <ul className="mt-3 space-y-2 text-stone-600">
            <li>✅ Cadastro rápido de doações com validade e janela de retirada.</li>
            <li>✅ Mapa de doações disponíveis perto de cada ONG.</li>
            <li>✅ Agrupamento das coletas e sugestão de rota.</li>
            <li>✅ Painel de impacto para estabelecimentos, ONGs e parceiros.</li>
          </ul>
        </div>
      </section>

      {/* Como funciona */}
      <section>
        <h2 className="text-2xl font-bold">Como funciona</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((p) => (
            <li key={p.n} className="rounded-2xl border border-stone-200 bg-white p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-marca-600 font-bold text-white">
                {p.n}
              </span>
              <h3 className="mt-3 font-semibold">{p.titulo}</h3>
              <p className="mt-1 text-sm text-stone-600">{p.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA final */}
      <section className="rounded-3xl bg-marca-700 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Pronto para resgatar?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/doar" className="rounded-xl bg-white px-6 py-3 font-semibold text-marca-700 hover:bg-marca-50">
            Sou estabelecimento
          </Link>
          <Link href="/coletas" className="rounded-xl border-2 border-white px-6 py-3 font-semibold hover:bg-marca-600">
            Sou ONG
          </Link>
          <Link href="/impacto" className="rounded-xl px-6 py-3 font-semibold underline">
            Ver impacto
          </Link>
        </div>
      </section>

      <p className="text-xs text-stone-500">
        Fontes (a validar pela equipe de conteúdo): ¹ PNUMA, Food Waste Index Report 2024. ² FAO, Food
        Wastage Footprint (2013). ³ Rede PENSSAN / FAO, relatórios sobre insegurança alimentar no Brasil.
      </p>
    </div>
  );
}

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div>
      <p className="text-3xl font-extrabold text-marca-700">{valor}</p>
      <p className="mt-1 text-sm text-stone-700">{rotulo}</p>
    </div>
  );
}
