"use client";

import { toast } from "sonner";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@repo/ui/components/page-header";
import { CheckCircle2, AlertCircle, Info, TriangleAlert, Rocket } from "lucide-react";

export default function ToastPreviewPage() {
  const triggerAll = () => {
    toast.success("Tema publicado com sucesso!", {
      description: "A proposta de redação agora está visível para todos os alunos.",
    });

    setTimeout(() => {
      toast.error("Falha na conexão com o banco", {
        description: "Não foi possível carregar os perfis. Tente novamente em instantes.",
      });
    }, 200);

    setTimeout(() => {
      toast.info("Novo recurso disponível", {
        description: "Agora você pode exportar as estatísticas em formato PDF.",
      });
    }, 400);

    setTimeout(() => {
      toast.warning("Limite de armazenamento", {
        description: "Seu bucket de imagens está atingindo 90% da capacidade total.",
      });
    }, 600);

    setTimeout(() => {
      toast("Mensagem padrão", {
        description: "Este é um toast neutro sem status definido.",
        icon: <Rocket className="size-4" />,
      });
    }, 800);
  };

  return (
    <div className="p-10 space-y-10">
      <PageHeader
        title="Design System: Toasts"
        subtitle="Área de testes para validar a consistência visual das notificações globais."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card de Controle */}
        <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800">Controles de Estilização</h3>

          <div className="flex flex-col gap-3">
            <Button
              onClick={triggerAll}
              className="w-full bg-slate-900 text-white font-bold h-12 rounded-xl"
            >
              Disparar Todos (Stack View)
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => toast.success("Sucesso!", { description: 'Teste' })} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <CheckCircle2 className="size-4 mr-2" /> Sucesso
              </Button>
              <Button variant="outline" onClick={() => toast.error("Erro!")} className="border-red-200 text-red-700 hover:bg-red-50">
                <AlertCircle className="size-4 mr-2" /> Erro
              </Button>
              <Button variant="outline" onClick={() => toast.info("Info")} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Info className="size-4 mr-2" /> Info
              </Button>
              <Button variant="outline" onClick={() => toast.warning("Alerta")} className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <TriangleAlert className="size-4 mr-2" /> Alerta
              </Button>
            </div>
          </div>
        </div>

        {/* Guia de Referência de Cores */}
        <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50 space-y-4">
          <h3 className="font-bold text-slate-800">Variáveis Ativas</h3>
          <ul className="text-sm space-y-2 text-slate-600">
            <li className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-emerald-500" /> Success: <code>--success-bg</code>
            </li>
            <li className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-red-500" /> Error: <code>--error-bg</code>
            </li>
            <li className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-blue-500" /> Info: <code>--blue-500</code>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}