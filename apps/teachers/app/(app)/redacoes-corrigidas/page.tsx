import { FinishedEssays } from "@/components/finished-essays";

export default function FinishedEssaysPage() {

  return (
    <div className="min-h-screen px-4 md:px-10 lg:px-12 py-4 space-4">
      {/* Título da Página */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
          Redações Corrigidas
        </h2>
        <p className="text-[#8B8265]">
          Acompanhe o histórico de correções já realizadas.
        </p>
      </div>

      <FinishedEssays />
    </div>
  );
}