import { getAdminClients } from "@/lib/actions/admin";
import ClientsTable from "@/components/admin/ClientsTable";
import SearchInput from "@/components/admin/SearchInput";

interface ClientsPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function AdminClientsPage({ searchParams }: ClientsPageProps) {
  const sp = await searchParams;
  const search = sp.search || "";

  const { clients, error } = await getAdminClients(search || undefined);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Clients</h1>
        <p className="text-sm text-neutral-500 mt-1">
          View and manage your customer base
        </p>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <SearchInput placeholder="Search by name..." paramName="search" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200">
        {error ? (
          <div className="p-8 text-center text-red-500 text-sm">
            Failed to load clients: {error}
          </div>
        ) : (
          <ClientsTable clients={clients} />
        )}
      </div>
    </div>
  );
}
