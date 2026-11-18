export default function PageHeader({ titulo, descricao, children }: { titulo: string; descricao?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">{titulo}</h1>
        {descricao && <p className="mt-1 max-w-2xl text-stone-600">{descricao}</p>}
      </div>
      {children}
    </div>
  );
}
