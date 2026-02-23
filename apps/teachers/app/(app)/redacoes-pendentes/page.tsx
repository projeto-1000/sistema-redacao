"use client";

import { PendingEssays } from "@/components/pending-essays";

export default function PendingEssaysView() {

  return (
    <div className="min-h-screen px-4 md:px-10 lg:px-12 py-4 space-4">
      {/* Título da Página */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
          Redações Pendentes
        </h2>
        <p className="text-[#8B8265]">
          Gerencie a fila de correção e priorize os prazos.
        </p>
      </div>

      <PendingEssays />
    </div>
  );
}