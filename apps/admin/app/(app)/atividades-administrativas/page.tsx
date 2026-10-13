import { getAdminAuditActors, getAdminAuditEvents } from "@/app/actions/admin-audit";
import { AdminAuditFiltersBar } from "@/components/features/admin-audit/admin-audit-filters-bar";
import { AdminAuditTable } from "@/components/features/admin-audit/admin-audit-table";
import { PageHeader } from "@repo/ui/components/page-header";

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
    from: getValue("from"),
    to: getValue("to"),
  };
  const [result, actors] = await Promise.all([
    getAdminAuditEvents({ filters, page }),
    getAdminAuditActors(),
  ]);

  return (
    <div className="min-h-dvh space-y-8 px-4 py-4 md:px-10 lg:px-12">
      <PageHeader
        title="Atividades administrativas"
        subtitle="Consulte alterações e operações realizadas pelos administradores."
      />

      <AdminAuditFiltersBar actors={actors} />

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
