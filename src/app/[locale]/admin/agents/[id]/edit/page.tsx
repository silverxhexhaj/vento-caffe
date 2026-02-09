import Link from "next/link";
import AgentForm from "@/components/admin/AgentForm";
import { getAgentById } from "@/lib/actions/admin";

interface EditAgentPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminEditAgentPage({ params }: EditAgentPageProps) {
  const { locale, id } = await params;
  const { agent, error } = await getAgentById(id);

  if (error || !agent) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Agent not found: {error}</p>
        <Link
          href={`/${locale}/admin/agents`}
          className="text-sm text-neutral-600 hover:text-neutral-900 mt-4 inline-block underline"
        >
          Back to agents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/admin/agents/${agent.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-900 mb-2 inline-flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          Back to agent
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Edit Agent</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Update agent details.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <AgentForm agent={agent} />
      </div>
    </div>
  );
}
