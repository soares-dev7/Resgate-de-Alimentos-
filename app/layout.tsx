import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AppProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Resgate de Alimentos",
  description:
    "Conecta estabelecimentos com sobras de alimentos a ONGs e cozinhas comunitárias, com rotas de coleta otimizadas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col antialiased">
        <AppProvider>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
