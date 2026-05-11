import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import StatsCard from "@/components/admin/StatsCard";
import MarketingStudioClient from "@/components/admin/marketing/MarketingStudioClient";
import { getMarketingStudioData } from "@/lib/actions/marketing";

interface AdminMarketingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AdminMarketingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.marketing" });
  return {
    title: t("metaTitle"),
  };
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09zM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456z"
      />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5A1.5 1.5 0 0 0 21.75 18V6A1.5 1.5 0 0 0 20.25 4.5H3.75A1.5 1.5 0 0 0 2.25 6v12A1.5 1.5 0 0 0 3.75 19.5z"
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5A2.25 2.25 0 0 1 5.25 5.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    </svg>
  );
}

function CampaignIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h16.5m0 0v11.25a2.25 2.25 0 0 1-2.25 2.25h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
      />
    </svg>
  );
}

export default async function AdminMarketingPage({ params }: AdminMarketingPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.marketing" });
  const { data, error } = await getMarketingStudioData();

  const draftCount = data.posts.filter((post) => post.status === "draft").length;
  const scheduledCount = data.posts.filter((post) => post.status === "scheduled").length;
  const libraryCount = data.assets.length;
  const campaignCount = data.campaigns.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t("title")}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700">
          <SparklesIcon className="w-5 h-5 mr-2" />
          {t("aiPowered")}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t("stats.draftPosts")}
          value={draftCount}
          subtitle={t("stats.draftPostsSubtitle")}
          icon={<SparklesIcon className="w-5 h-5" />}
        />
        <StatsCard
          title={t("stats.libraryAssets")}
          value={libraryCount}
          subtitle={t("stats.libraryAssetsSubtitle")}
          icon={<ImageIcon className="w-5 h-5" />}
        />
        <StatsCard
          title={t("stats.scheduledIdeas")}
          value={scheduledCount}
          subtitle={t("stats.scheduledIdeasSubtitle")}
          icon={<CalendarIcon className="w-5 h-5" />}
        />
        <StatsCard
          title={t("stats.campaigns")}
          value={campaignCount}
          subtitle={t("stats.campaignsSubtitle")}
          icon={<CampaignIcon className="w-5 h-5" />}
        />
      </div>

      <MarketingStudioClient initialData={data} />
    </div>
  );
}
