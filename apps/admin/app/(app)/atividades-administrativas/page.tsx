import { getAdminAuditActors, getAdminAuditEvents } from "@/app/actions/admin-audit";
import { AdminAuditTable } from "@/components/features/admin-audit/admin-audit-table";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { PageHeader } from "@repo/ui/components/page-header";
import Link from "next/link";

export default async function AdministrativeActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const getValue = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const page = Number(getValue("page")) || 1;
  const filters = {
    search: getValue("search"),
    actorId: getValue("actorId"),
    resourceType: getValue("resourceType"),
    status: getValue("status"),
    from: getValue("from"),
    to: getValue("to"),
  };
  const [result, actors] = await Promise.all([
    getAdminAuditEvents({ filters, page }),
    getAdminAuditActors(),
  ]);

  return (
    <div className="min-h-dvh space-y-6 px-2 py-4 md:px-10 lg:px-12">
      <PageHeader
        title="Atividades administrativas"
        subtitle="Consulte alterações e operações realizadas pelos administradores."
      />

      <form className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_200px_210px_170px_150px_150px_auto]">
        <Input
          name="search"
          defaultValue={filters.search}
          placeholder="Buscar por ação ou referência..."
          className="h-11 rounded-xl"
        />
        <select
          name="actorId"
          defaultValue={filters.actorId ?? "all"}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium"
        >
          <option value="all">Todos os administradores</option>
          {actors.map((actor) => (
            <option key={actor.id} value={actor.id}>
              {actor.full_name || actor.email}
            </option>
          ))}
        </select>
        <select
          name="resourceType"
          defaultValue={filters.resourceType ?? "all"}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium"
        >
          <option value="all">Todas as áreas</option>
          <option value="student_profile">Alunos</option>
          <option value="teacher_invitation">Convites de professores</option>
          <option value="teacher_payment">Pagamentos</option>
          <option value="correction_review">Revisões de correção</option>
          <option value="manual_credit_grant">Créditos</option>
          <option value="subscription_support">Assinaturas</option>
        </select>
        <select
          name="status"
          defaultValue={filters.status ?? "all"}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium"
        >
          <option value="all">Todos os resultados</option>
          <option value="success">Concluído</option>
          <option value="pending">Em andamento</option>
          <option value="failure">Falhou</option>
          <option value="operational_issue">Requer atenção</option>
        </select>
        <Input name="from" type="date" defaultValue={filters.from} className="h-11 rounded-xl" />
        <Input name="to" type="date" defaultValue={filters.to} className="h-11 rounded-xl" />
        <div className="flex gap-2">
          <Button type="submit" className="h-11 flex-1 rounded-xl">
            Filtrar
          </Button>
          <Button asChild type="button" variant="outline" className="h-11 rounded-xl">
            <Link href="/atividades-administrativas">Limpar</Link>
          </Button>
        </div>
      </form>

      {result.error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
          {result.error}
        </div>
      ) : (
        <AdminAuditTable events={result.events} totalPages={result.totalPages} />
      )}
    </div>
  );
}
