import { redirect } from "next/navigation";
import { CardManagement } from "@/components/admin/CardManagement";
import { getCards } from "@/lib/admin/cards";
import { isAdminAuthenticated } from "@/lib/admin/reports";

export default async function CardsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/morango");
  }

  const cards = await getCards();

  return (
    <div>
      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-red-500">Conteúdo</p>
        <h1 className="text-2xl font-bold text-text-primary">Gerenciamento de Cards</h1>
        <p className="mt-2 max-w-[65ch] text-text-secondary">
          Cadastre e mantenha os murais publicados, com status e ações administrativas rastreáveis.
        </p>
      </div>
      <CardManagement initialCards={cards} />
    </div>
  );
}
