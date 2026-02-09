import Link from "next/link";
import { getAgents } from "@/lib/actions/admin";
import AgentsTable from "@/components/admin/AgentsTable";
import SearchInput from "@/components/admin/SearchInput";

interface AgentsPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
  params: Promise<{ locale: string }>;
}

export default async function AdminAgentsPage({
  searchParams,
  params,
}: AgentsPageProps) {
  const sp = await searchParams;
  const { locale } = await params;
  const search = sp.search || "";

  const { agents, error } = await getAgents(search || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Agents</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage internal team members and their assignments.
          </p>
        </div>
        <Link
          href={`/${locale}/admin/agents/new`}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          New Agent
        </Link>
      </div>

      <div className="max-w-sm">
        <SearchInput placeholder="Search by name or email..." paramName="search" />
      </div>

      <div className="bg-white rounded-xl border border-neutral-200">
        {error ? (
          <div className="p-8 text-center text-red-500 text-sm">
            Failed to load agents: {error}
          </div>
        ) : (
          <AgentsTable agents={agents} />
        )}
      </div>
    </div>
  );
}
