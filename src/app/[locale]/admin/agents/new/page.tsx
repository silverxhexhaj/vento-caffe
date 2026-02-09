import Link from "next/link";
import AgentForm from "@/components/admin/AgentForm";

interface NewAgentPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminNewAgentPage({ params }: NewAgentPageProps) {
  const { locale } = await params;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/admin/agents`}
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
          Back to agents
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Create Agent</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Add a new internal team member.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <AgentForm />
      </div>
    </div>
  );
}
