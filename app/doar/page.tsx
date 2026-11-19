import DoacaoForm from "@/components/DoacaoForm";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "Cadastrar doação · Resgate de Alimentos" };

export default function DoarPage() {
  return (
    <>
      <PageHeader
        titulo="Cadastrar doação"
        descricao="Informe o que sobrou, até quando é seguro consumir e quando a ONG pode buscar. Só doe alimentos próprios para consumo."
      />
      <DoacaoForm />
    </>
  );
}
