"use client";

import Link from "next/link";
import { useState } from "react";
import { BAIRROS_SP, ROTULO_CATEGORIA, dataISO, getEstabelecimento, getEstabelecimentos } from "@/lib/data";
import { useApp } from "@/lib/store";
import type { CategoriaAlimento, Doacao } from "@/lib/types";
import { type DadosDoacaoForm, type ErrosDoacao, validarDoacao } from "@/lib/validacao";
import { fmtJanela, fmtKg } from "@/lib/formato";

const VAZIO: DadosDoacaoForm = {
  estabelecimentoId: "",
  categoria: "",
  descricao: "",
  quantidadeKg: "",
  validade: "",
  dataRetirada: "",
  horaInicio: "",
  horaFim: "",
  endereco: "",
  bairro: "",
};

export default function DoacaoForm() {
  const { adicionarDoacao } = useApp();
  const [dados, setDados] = useState<DadosDoacaoForm>(VAZIO);
  const [erros, setErros] = useState<ErrosDoacao>({});
  const [criada, setCriada] = useState<Doacao | null>(null);

  const hoje = dataISO(new Date());

  function alterar<K extends keyof DadosDoacaoForm>(campo: K, valor: string) {
    setDados((d) => {
      const novo = { ...d, [campo]: valor };
      // Ao escolher um estabelecimento cadastrado, preenche o endereço dele.
      if (campo === "estabelecimentoId") {
        const est = getEstabelecimento(valor);
        if (est) {
          novo.endereco = est.endereco;
          novo.bairro = est.bairro;
        }
      }
      return novo;
    });
    // Limpa o erro do campo assim que o usuário mexe nele.
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const encontrados = validarDoacao(dados, hoje);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    const est = getEstabelecimento(dados.estabelecimentoId);
    // Sem geocodificação ainda: usa o endereço do estabelecimento se não mudou,
    // senão o centro do bairro escolhido.
    const coord =
      est && est.endereco === dados.endereco.trim() ? { lat: est.lat, lng: est.lng } : BAIRROS_SP[dados.bairro];

    const nova = adicionarDoacao({
      estabelecimentoId: dados.estabelecimentoId,
      categoria: dados.categoria as CategoriaAlimento,
      descricao: dados.descricao.trim(),
      quantidadeKg: Number(dados.quantidadeKg.replace(",", ".")),
      validade: dados.validade,
      janelaInicio: `${dados.dataRetirada}T${dados.horaInicio}`,
      janelaFim: `${dados.dataRetirada}T${dados.horaFim}`,
      endereco: dados.endereco.trim(),
      bairro: dados.bairro,
      ...coord,
    });
    setCriada(nova);
    setDados(VAZIO);
  }

  if (criada) {
    return (
      <div role="status" className="rounded-2xl border border-marca-500 bg-marca-50 p-6">
        <h2 className="text-xl font-bold text-marca-700">Doação publicada!</h2>
        <p className="mt-2 text-stone-700">
          {fmtKg(criada.quantidadeKg)} de {ROTULO_CATEGORIA[criada.categoria].toLowerCase()} — retirada em{" "}
          {fmtJanela(criada.janelaInicio, criada.janelaFim)}. ONGs próximas já podem reservar.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => setCriada(null)} className="rounded-lg bg-marca-600 px-4 py-2 font-semibold text-white hover:bg-marca-700">
            Cadastrar outra
          </button>
          <Link href="/coletas" className="rounded-lg border border-marca-600 px-4 py-2 font-semibold text-marca-700">
            Ver no mapa
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="grid gap-5 rounded-2xl border border-stone-200 bg-white p-6 sm:grid-cols-2">
      <Campo rotulo="Estabelecimento" erro={erros.estabelecimentoId} id="estabelecimentoId" className="sm:col-span-2">
        <select id="estabelecimentoId" value={dados.estabelecimentoId} onChange={(e) => alterar("estabelecimentoId", e.target.value)} className={entrada(erros.estabelecimentoId)}>
          <option value="">Selecione…</option>
          {getEstabelecimentos().map((e) => (
            <option key={e.id} value={e.id}>{e.nome} ({e.bairro})</option>
          ))}
        </select>
      </Campo>

      <Campo rotulo="Tipo de alimento" erro={erros.categoria} id="categoria">
        <select id="categoria" value={dados.categoria} onChange={(e) => alterar("categoria", e.target.value)} className={entrada(erros.categoria)}>
          <option value="">Selecione…</option>
          {Object.entries(ROTULO_CATEGORIA).map(([v, r]) => (
            <option key={v} value={v}>{r}</option>
          ))}
        </select>
      </Campo>

      <Campo rotulo="Quantidade (kg)" erro={erros.quantidadeKg} id="quantidadeKg">
        <input id="quantidadeKg" inputMode="decimal" placeholder="ex.: 12,5" value={dados.quantidadeKg} onChange={(e) => alterar("quantidadeKg", e.target.value)} className={entrada(erros.quantidadeKg)} />
      </Campo>

      <Campo rotulo="Descrição" erro={erros.descricao} id="descricao" className="sm:col-span-2">
        <input id="descricao" placeholder="ex.: pães franceses do dia, embalados" value={dados.descricao} onChange={(e) => alterar("descricao", e.target.value)} className={entrada(erros.descricao)} />
      </Campo>

      <Campo rotulo="Validade" erro={erros.validade} id="validade">
        <input id="validade" type="date" min={hoje} value={dados.validade} onChange={(e) => alterar("validade", e.target.value)} className={entrada(erros.validade)} />
      </Campo>

      <Campo rotulo="Dia da retirada" erro={erros.dataRetirada} id="dataRetirada">
        <input id="dataRetirada" type="date" min={hoje} value={dados.dataRetirada} onChange={(e) => alterar("dataRetirada", e.target.value)} className={entrada(erros.dataRetirada)} />
      </Campo>

      <Campo rotulo="Retirada a partir de" erro={erros.horaInicio} id="horaInicio">
        <input id="horaInicio" type="time" value={dados.horaInicio} onChange={(e) => alterar("horaInicio", e.target.value)} className={entrada(erros.horaInicio)} />
      </Campo>

      <Campo rotulo="Retirada até" erro={erros.horaFim} id="horaFim">
        <input id="horaFim" type="time" value={dados.horaFim} onChange={(e) => alterar("horaFim", e.target.value)} className={entrada(erros.horaFim)} />
      </Campo>

      <Campo rotulo="Endereço de retirada" erro={erros.endereco} id="endereco">
        <input id="endereco" placeholder="Rua, número" value={dados.endereco} onChange={(e) => alterar("endereco", e.target.value)} className={entrada(erros.endereco)} />
      </Campo>

      <Campo rotulo="Bairro (São Paulo)" erro={erros.bairro} id="bairro">
        <select id="bairro" value={dados.bairro} onChange={(e) => alterar("bairro", e.target.value)} className={entrada(erros.bairro)}>
          <option value="">Selecione…</option>
          {Object.keys(BAIRROS_SP).map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </Campo>

      <div className="sm:col-span-2">
        <button type="submit" className="w-full rounded-xl bg-marca-600 px-6 py-3 font-semibold text-white hover:bg-marca-700 sm:w-auto">
          Publicar doação
        </button>
        <p className="mt-2 text-xs text-stone-500">
          Protótipo: a doação fica salva apenas neste navegador.
        </p>
      </div>
    </form>
  );
}

function entrada(erro?: string) {
  return `mt-1 w-full rounded-lg border bg-white px-3 py-2 text-stone-900 ${
    erro ? "border-red-500 focus:outline-red-500" : "border-stone-300"
  }`;
}

function Campo({ rotulo, erro, id, className = "", children }: { rotulo: string; erro?: string; id: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-stone-700">{rotulo}</label>
      {children}
      {erro && <p className="mt-1 text-sm text-red-600" role="alert">{erro}</p>}
    </div>
  );
}
