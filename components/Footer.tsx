export default function Footer() {
  return (
    <footer className="mt-16 border-t border-stone-200 py-8 text-center text-sm text-stone-500">
      <p>Resgate de Alimentos · Hack Brasil 2026 · Trilha Logística e Automação</p>
      <p className="mt-1">
        Protótipo com dados fictícios. Mapas ©{" "}
        <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>
        .
      </p>
    </footer>
  );
}
