import Link from "next/link";
import BusinessPipelineBadge from "@/components/admin/BusinessPipelineBadge";
import DeleteAgentButton from "@/components/admin/DeleteAgentButton";
import { getAgentById, unassignAgentFromBusiness } from "@/lib/actions/admin";

interface AgentDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

async function unassignAgentAction(
  businessId: string,
  agentId: string,
  _formData: FormData
) {
  "use server";
  await unassignAgentFromBusiness(businessId, agentId);
}

export default async function AdminAgentDetailPage({
  params,
}: AgentDetailPageProps) {
  const { locale, id } = await params;
  const { agent, businesses, error } = await getAgentById(id);

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
          href={`/${locale}/admin/agents`}
          className="text-sm text-neutral-500 hover:text-neutral-900 mb-2 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to agents
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-neutral-900">{agent.full_name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/${locale}/admin/agents/${agent.id}/edit`}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-900"
            >
              Edit
            </Link>
            <DeleteAgentButton
              agentId={agent.id}
              agentName={agent.full_name}
              variant="button"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Agent Details
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Email
              </p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5">
                {agent.email || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Phone
              </p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5">
                {agent.phone || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Role title
              </p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5">
                {agent.role_title || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Member since
              </p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5">
                {new Date(agent.created_at).toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          {agent.notes ? (
            <div className="mt-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                Notes
              </p>
              <p className="text-sm text-neutral-600">{agent.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Assigned Businesses
          </h2>
          {businesses.length ? (
            <div className="space-y-3">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="rounded-lg border border-neutral-200 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                      <Link
                        href={`/${locale}/admin/businesses/${business.id}`}
                        className="text-sm font-semibold text-neutral-900 hover:text-neutral-700"
                      >
                        {business.name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        <span>{business.business_type || "Unknown type"}</span>
                        <span>•</span>
                        <span>{business.city || "Unknown city"}</span>
                      </div>
                    </div>
                    <BusinessPipelineBadge stage={business.pipeline_stage} />
                  </div>
                  <form
                    action={unassignAgentAction.bind(null, business.id, agent.id)}
                    className="mt-3"
                  >
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove assignment
                    </button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No businesses assigned.</p>
          )}
        </div>
      </div>
    </div>
  );
}
