/**
 * Cliente do Supabase.
 *
 * Só é criado quando as duas variáveis abaixo estão definidas (.env.local ou
 * Vercel). Sem elas, `supabase` é null e o app usa o modo local de demonstração
 * (dados mockados no navegador) — ver lib/data/repositorio.ts.
 *
 * Use apenas a chave pública "anon"/"publishable". NUNCA coloque a chave
 * service_role em variáveis NEXT_PUBLIC_: ela iria para o navegador.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chavePublica = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && chavePublica ? createClient(url, chavePublica, { auth: { persistSession: false } }) : null;
