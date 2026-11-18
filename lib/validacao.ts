/**
 * Validação do formulário de doação. Função pura para ser reaproveitada
 * no back-end quando ele existir (mesmas regras dos dois lados).
 */
import { BAIRROS_SP } from "@/lib/data";

export interface DadosDoacaoForm {
  estabelecimentoId: string;
  categoria: string;
  descricao: string;
  quantidadeKg: string;
  validade: string; // YYYY-MM-DD
  dataRetirada: string; // YYYY-MM-DD
  horaInicio: string; // HH:MM
  horaFim: string; // HH:MM
  endereco: string;
  bairro: string;
}

export type ErrosDoacao = Partial<Record<keyof DadosDoacaoForm, string>>;

export const LIMITE_KG = 1000;

export function validarDoacao(d: DadosDoacaoForm, hojeISO: string): ErrosDoacao {
  const erros: ErrosDoacao = {};

  if (!d.estabelecimentoId) erros.estabelecimentoId = "Selecione o estabelecimento.";
  if (!d.categoria) erros.categoria = "Selecione o tipo de alimento.";
  if (d.descricao.trim().length < 5) erros.descricao = "Descreva o alimento (mín. 5 caracteres).";

  const kg = Number(d.quantidadeKg.replace(",", "."));
  if (!d.quantidadeKg || Number.isNaN(kg) || kg <= 0) {
    erros.quantidadeKg = "Informe uma quantidade maior que zero.";
  } else if (kg > LIMITE_KG) {
    erros.quantidadeKg = `Para mais de ${LIMITE_KG} kg, fale com a equipe.`;
  }

  // Datas no formato YYYY-MM-DD podem ser comparadas como texto.
  if (!d.validade) erros.validade = "Informe a validade.";
  else if (d.validade < hojeISO) erros.validade = "Alimento vencido não pode ser doado.";

  if (!d.dataRetirada) erros.dataRetirada = "Informe o dia da retirada.";
  else if (d.dataRetirada < hojeISO) erros.dataRetirada = "A retirada não pode ser no passado.";
  else if (d.validade && d.dataRetirada > d.validade)
    erros.dataRetirada = "A retirada precisa ser até a data de validade.";

  if (!d.horaInicio) erros.horaInicio = "Informe o início da janela.";
  if (!d.horaFim) erros.horaFim = "Informe o fim da janela.";
  else if (d.horaInicio && d.horaFim <= d.horaInicio)
    erros.horaFim = "O fim precisa ser depois do início.";

  if (d.endereco.trim().length < 5) erros.endereco = "Informe o endereço de retirada.";
  if (!BAIRROS_SP[d.bairro]) erros.bairro = "Selecione o bairro.";

  return erros;
}
