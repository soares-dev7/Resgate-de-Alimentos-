import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resgate de Alimentos",
  description:
    "Conecta estabelecimentos com sobras de alimentos a ONGs e cozinhas comunitárias, com rotas de coleta otimizadas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
