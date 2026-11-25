// Tipos de domínio do Resgate de Alimentos.
// Mantê-los aqui facilita trocar a camada de dados (mock -> Convex/Supabase)
// sem mexer nas telas.

export type Coordenada = { lat: number; lng: number };

export type TipoEstabelecimento = "mercado" | "padaria" | "restaurante" | "hortifruti";

export type CategoriaAlimento =
  | "paes"
  | "hortifruti"
  | "refeicoes_prontas"
  | "laticinios"
  | "graos"
  | "outros";

export type StatusDoacao = "disponivel" | "reservada" | "coletada";

export interface Estabelecimento extends Coordenada {
  id: string;
  nome: string;
  tipo: TipoEstabelecimento;
  endereco: string;
  bairro: string;
}

export interface Ong extends Coordenada {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
}

export interface Doacao extends Coordenada {
  id: string;
  estabelecimentoId: string;
  categoria: CategoriaAlimento;
  descricao: string;
  quantidadeKg: number;
  /** Data de validade (YYYY-MM-DD). */
  validade: string;
  /** Início e fim da janela de retirada (ISO 8601). */
  janelaInicio: string;
  janelaFim: string;
  endereco: string;
  bairro: string;
  status: StatusDoacao;
  /** ONG que reservou (quando status != "disponivel"). */
  ongId?: string;
  /** Data/hora da reserva (usada para comparar a rota sugerida com a ordem das reservas). */
  reservadaEm?: string;
  /** Data/hora em que a coleta foi confirmada. */
  coletadaEm?: string;
}

/** Registro histórico de coleta concluída (alimenta o painel de impacto). */
export interface Coleta {
  id: string;
  estabelecimentoId: string;
  ongId: string;
  categoria: CategoriaAlimento;
  kg: number;
  /** Data da coleta (YYYY-MM-DD). */
  data: string;
}
