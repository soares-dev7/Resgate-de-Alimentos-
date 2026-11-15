"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/doar", rotulo: "Doar" },
  { href: "/coletas", rotulo: "Coletas" },
  { href: "/rota", rotulo: "Rota" },
  { href: "/impacto", rotulo: "Impacto" },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-[1100] border-b border-stone-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-marca-700">
          <span aria-hidden className="text-xl">🥕</span>
          Resgate de Alimentos
        </Link>
        <ul className="flex gap-1 text-sm">
          {LINKS.map((l) => {
            const ativo = pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={ativo ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 font-medium transition-colors ${
                    ativo ? "bg-marca-100 text-marca-700" : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {l.rotulo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
