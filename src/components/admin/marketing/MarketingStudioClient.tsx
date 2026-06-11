"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  createMarketingPostDraft,
  duplicateMarketingPost,
  generateMarketingDrafts,
  generateMarketingImage,
  updateMarketingPost,
  uploadMarketingReferenceAsset,
  type MarketingStudioData,
} from "@/lib/actions/marketing";

type Campaign = MarketingStudioData["campaigns"][number];
type Post = MarketingStudioData["posts"][number];
type Platform = Post["platform"];
type PostStatus = Post["status"];
type PlatformFilter = Platform | "all";
type StatusFilter = PostStatus | "all";

const PLATFORM_OPTIONS: Platform[] = ["instagram", "facebook", "tiktok"];
const STATUS_OPTIONS: PostStatus[] = ["draft", "ready", "scheduled"];
const TONE_OPTIONS = ["confident", "warm", "shortHooks"];
const OUTPUT_OPTIONS = ["captions", "hashtags", "imagePrompts", "storyScripts"];

interface MarketingStudioClientProps {
  initialData: MarketingStudioData;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function localYmd(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseYmd(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function localDatetimeValue(date: Date) {
  return `${localYmd(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function isoToLocalDatetimeValue(value: string | null) {
  return value ? localDatetimeValue(new Date(value)) : "";
}

function selectedDateTimeIso(ymd: string, time: string) {
  return new Date(`${ymd}T${time || "09:00"}`).toISOString();
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("sq-AL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(parseYmd(value));
}

function PostStatusPill({ status }: { status: PostStatus }) {
  const t = useTranslations("admin.marketing");
  const styles =
    status === "draft"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : status === "ready"
        ? "border-green-200 bg-green-50 text-green-800"
        : "border-blue-200 bg-blue-50 text-blue-800";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {t(`status.${status}`)}
    </span>
  );
}

function MarketingMonthCalendar({
  viewYear,
  viewMonth,
  selectedYmd,
  dayCounts,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: {
  viewYear: number;
  viewMonth: number;
  selectedYmd: string;
  dayCounts: Map<string, { total: number; scheduled: number; ready: number }>;
  onSelectDay: (ymd: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const t = useTranslations("admin.marketing");
  const firstDay = new Date(viewYear, viewMonth - 1, 1);
  const monthLabel = firstDay.toLocaleString(undefined, { month: "long", year: "numeric" });
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let index = 0; index < startOffset; index += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(viewYear, viewMonth - 1, day));

  const weekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 lg:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{t("calendar.title")}</h2>
          <p className="text-sm text-neutral-500">{t("calendar.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            aria-label={t("calendar.prevMonth")}
          >
            ‹
          </button>
          <span className="min-w-36 text-center text-sm font-semibold capitalize text-neutral-900">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={onNextMonth}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            aria-label={t("calendar.nextMonth")}
          >
            ›
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {weekdays.map((day) => (
          <div key={day} className="py-1 text-center text-[11px] font-semibold text-neutral-400">
            {t(`weekdaysShort.${day}`)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="min-h-20 rounded-lg bg-neutral-50/60" />;

          const ymd = localYmd(date);
          const selected = selectedYmd === ymd;
          const counts = dayCounts.get(ymd);

          return (
            <button
              key={ymd}
              type="button"
              onClick={() => onSelectDay(ymd)}
              className={`min-h-20 rounded-lg border p-2 text-left transition-colors ${
                selected
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-100 bg-white text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              <span className="text-xs font-semibold">{date.getDate()}</span>
              {counts ? (
                <div className="mt-2 space-y-1">
                  <span
                    className={`block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      selected ? "bg-white/15 text-white" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {t("calendar.postCount", { count: counts.total })}
                  </span>
                  <div className="flex gap-1">
                    {counts.scheduled > 0 ? (
                      <span className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-blue-200" : "bg-blue-500"}`} />
                    ) : null}
                    {counts.ready > 0 ? (
                      <span className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-green-200" : "bg-green-500"}`} />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          {t("calendar.legendScheduled")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {t("calendar.legendReady")}
        </span>
      </div>
    </section>
  );
}

function PostEditor({
  post,
  assets,
  isPending,
  onChange,
  onSave,
  onDuplicate,
  onCopyCaption,
}: {
  post: Post;
  assets: MarketingStudioData["assets"];
  isPending: boolean;
  onChange: (postId: string, updates: Partial<Post>) => void;
  onSave: (post: Post) => void;
  onDuplicate: (postId: string) => void;
  onCopyCaption: (caption: string) => void;
}) {
  const t = useTranslations("admin.marketing");

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {t(`platforms.${post.platform}`)}
          </span>
          <PostStatusPill status={post.status} />
          {post.scheduled_at ? (
            <span className="text-xs text-neutral-500">{formatDate(post.scheduled_at)}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCopyCaption(post.caption)}
            className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {t("preview.copyCaption")}
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(post.id)}
            className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {t("planner.rowActions.duplicate")}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <input
          value={post.title}
          onChange={(event) => onChange(post.id, { title: event.target.value })}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
        <textarea
          value={post.caption}
          onChange={(event) => onChange(post.id, { caption: event.target.value })}
          rows={4}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
        <input
          value={post.hashtags.join(" ")}
          onChange={(event) =>
            onChange(post.id, {
              hashtags: event.target.value.split(/\s+/).filter(Boolean),
            })
          }
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={post.status}
            onChange={(event) => onChange(post.id, { status: event.target.value as PostStatus })}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={isoToLocalDatetimeValue(post.scheduled_at)}
            onChange={(event) =>
              onChange(post.id, {
                scheduled_at: event.target.value ? new Date(event.target.value).toISOString() : null,
                status: event.target.value ? "scheduled" : post.status,
              })
            }
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
          <select
            value={post.linked_asset_id ?? ""}
            onChange={(event) => onChange(post.id, { linked_asset_id: event.target.value || null })}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="">{t("planner.noAsset")}</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSave(post)}
            disabled={isPending}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            {t("planner.rowActions.save")}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MarketingStudioClient({ initialData }: MarketingStudioClientProps) {
  const t = useTranslations("admin.marketing");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = localYmd(new Date());
  const initialCampaign = initialData.campaigns[0] ?? null;
  const initialCampaignId = initialCampaign?.id ?? null;
  const initialImagePrompt =
    initialData.posts.find(
      (post) => post.campaign_id === initialCampaignId && post.image_prompt
    )?.image_prompt ?? "";
  const [campaigns, setCampaigns] = useState(initialData.campaigns);
  const [assets, setAssets] = useState(initialData.assets);
  const [posts, setPosts] = useState(initialData.posts);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialCampaignId);
  const [selectedYmd, setSelectedYmd] = useState(
    initialData.posts.find((post) => post.scheduled_at)?.scheduled_at
      ? localYmd(new Date(initialData.posts.find((post) => post.scheduled_at)!.scheduled_at!))
      : today
  );
  const [viewYear, setViewYear] = useState(parseYmd(selectedYmd).getFullYear());
  const [viewMonth, setViewMonth] = useState(parseYmd(selectedYmd).getMonth() + 1);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [schedulePostId, setSchedulePostId] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCaption, setQuickCaption] = useState("");
  const [quickHashtags, setQuickHashtags] = useState("#VentoCaffe");
  const [quickPlatform, setQuickPlatform] = useState<Platform>("instagram");
  const [quickTime, setQuickTime] = useState("09:00");
  const [name, setName] = useState(initialCampaign?.name ?? t("brief.defaultCampaignName"));
  const [goal, setGoal] = useState(initialCampaign?.goal ?? t("brief.goalSample"));
  const [productFocus, setProductFocus] = useState(
    initialCampaign?.product_focus ?? t("brief.productSample")
  );
  const [tone, setTone] = useState<string[]>(
    initialCampaign?.tone.length ? initialCampaign.tone : ["confident", "warm", "shortHooks"]
  );
  const [platforms, setPlatforms] = useState<Platform[]>(
    initialCampaign?.platforms.length ? initialCampaign.platforms : ["instagram", "facebook"]
  );
  const [outputs, setOutputs] = useState<string[]>(
    initialCampaign?.outputs.length
      ? initialCampaign.outputs
      : ["captions", "hashtags", "imagePrompts"]
  );
  const [selectedReferenceAssetIds, setSelectedReferenceAssetIds] = useState<string[]>([]);
  const [imagePrompt, setImagePrompt] = useState(initialImagePrompt);
  const [uploadLabel, setUploadLabel] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const referenceAssets = assets.filter((asset) => asset.kind === "reference");
  const generatedAssets = assets.filter((asset) => asset.kind === "generated");
  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        if (selectedCampaignId && post.campaign_id !== selectedCampaignId) return false;
        if (platformFilter !== "all" && post.platform !== platformFilter) return false;
        if (statusFilter !== "all" && post.status !== statusFilter) return false;
        return true;
      }),
    [platformFilter, posts, selectedCampaignId, statusFilter]
  );
  const dayCounts = useMemo(() => {
    const counts = new Map<string, { total: number; scheduled: number; ready: number }>();
    filteredPosts.forEach((post) => {
      if (!post.scheduled_at) return;
      const ymd = localYmd(new Date(post.scheduled_at));
      const next = counts.get(ymd) ?? { total: 0, scheduled: 0, ready: 0 };
      next.total += 1;
      if (post.status === "scheduled") next.scheduled += 1;
      if (post.status === "ready") next.ready += 1;
      counts.set(ymd, next);
    });
    return counts;
  }, [filteredPosts]);
  const selectedDayPosts = filteredPosts
    .filter((post) => post.scheduled_at && localYmd(new Date(post.scheduled_at)) === selectedYmd)
    .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));
  const unscheduledPosts = filteredPosts.filter((post) => post.status !== "scheduled" || !post.scheduled_at);
  const campaignLabel =
    campaigns.find((campaign) => campaign.id === selectedCampaignId)?.name ?? t("filters.all");

  const toggleValue = <T extends string,>(
    value: T,
    values: T[],
    setter: (next: T[]) => void,
    minimum = 0
  ) => {
    if (values.includes(value)) {
      if (values.length <= minimum) return;
      setter(values.filter((item) => item !== value));
      return;
    }
    setter([...values, value]);
  };

  const updateCampaignState = (campaign: Campaign) => {
    setCampaigns((current) => {
      const exists = current.some((item) => item.id === campaign.id);
      return exists
        ? current.map((item) => (item.id === campaign.id ? campaign : item))
        : [campaign, ...current];
    });
    setSelectedCampaignId(campaign.id);
  };

  const handleSelectCampaign = (next: string | null) => {
    setSelectedCampaignId(next);
    if (!next) {
      setName(t("brief.defaultCampaignName"));
      setGoal(t("brief.goalSample"));
      setProductFocus(t("brief.productSample"));
      setTone(["confident", "warm", "shortHooks"]);
      setPlatforms(["instagram", "facebook"]);
      setOutputs(["captions", "hashtags", "imagePrompts"]);
      setImagePrompt("");
      return;
    }

    const campaign = campaigns.find((item) => item.id === next);
    if (campaign) {
      setName(campaign.name);
      setGoal(campaign.goal);
      setProductFocus(campaign.product_focus);
      setTone(campaign.tone.length ? campaign.tone : ["confident", "warm", "shortHooks"]);
      setPlatforms(campaign.platforms.length ? campaign.platforms : ["instagram", "facebook"]);
      setOutputs(campaign.outputs.length ? campaign.outputs : ["captions", "hashtags", "imagePrompts"]);
      setImagePrompt(posts.find((post) => post.campaign_id === campaign.id && post.image_prompt)?.image_prompt ?? "");
    }
  };

  const handlePrevMonth = () => {
    const next = new Date(viewYear, viewMonth - 2, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
  };

  const handleNextMonth = () => {
    const next = new Date(viewYear, viewMonth, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
  };

  const handleSelectDay = (ymd: string) => {
    const next = parseYmd(ymd);
    setSelectedYmd(ymd);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
  };

  const handleGenerateDrafts = () => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await generateMarketingDrafts({
        campaignId: selectedCampaignId,
        name,
        goal,
        productFocus,
        tone,
        platforms,
        outputs,
        referenceAssetIds: selectedReferenceAssetIds,
      });

      if (result.error || !result.campaign) {
        setError(result.error ?? t("errors.generateDrafts"));
        return;
      }

      updateCampaignState(result.campaign);
      setPosts((current) => [
        ...result.posts,
        ...current.filter((post) => post.campaign_id !== result.campaign?.id),
      ]);
      setImagePrompt(result.posts.find((post) => post.image_prompt)?.image_prompt ?? imagePrompt);
      setNotice(t("notices.draftsGenerated"));
    });
  };

  const handleCreateQuickDraft = () => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await createMarketingPostDraft({
        campaignId: selectedCampaignId,
        name,
        goal,
        productFocus,
        tone,
        platforms: platforms.includes(quickPlatform) ? platforms : [...platforms, quickPlatform],
        outputs,
        referenceAssetIds: selectedReferenceAssetIds,
        platform: quickPlatform,
        title: quickTitle,
        caption: quickCaption,
        hashtags: quickHashtags.split(/\s+/).filter(Boolean),
        scheduledAt: selectedDateTimeIso(selectedYmd, quickTime),
      });

      if (result.error || !result.campaign || !result.post) {
        setError(result.error ?? t("errors.createDraft"));
        return;
      }

      updateCampaignState(result.campaign);
      setPosts((current) => [result.post!, ...current]);
      setQuickTitle("");
      setQuickCaption("");
      setQuickHashtags("#VentoCaffe");
      setNotice(t("notices.postCreated"));
    });
  };

  const handleScheduleExisting = () => {
    const post = posts.find((item) => item.id === schedulePostId) ?? unscheduledPosts[0];
    if (!post) return;

    const scheduledAt = selectedDateTimeIso(selectedYmd, scheduleTime);
    const nextPost = { ...post, scheduled_at: scheduledAt, status: "scheduled" as const };
    handlePostChange(post.id, nextPost);
    handleSavePost(nextPost);
    setSchedulePostId("");
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setNotice(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("label", uploadLabel || file.name);
      if (selectedCampaignId) formData.append("campaignId", selectedCampaignId);

      const result = await uploadMarketingReferenceAsset(formData);
      if (result.error || !result.asset) {
        setError(result.error ?? t("errors.upload"));
        return;
      }

      setAssets((current) => [result.asset!, ...current]);
      setSelectedReferenceAssetIds((current) => [...current, result.asset!.id]);
      setUploadLabel("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setNotice(t("notices.assetUploaded"));
    });
  };

  const handleGenerateImage = () => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await generateMarketingImage({
        campaignId: selectedCampaignId,
        referenceAssetIds: selectedReferenceAssetIds,
        prompt: imagePrompt,
        label: name ? `${name} - ${t("assetLibrary.generatedLabel")}` : t("assetLibrary.generatedLabel"),
      });

      if (result.error || !result.asset) {
        setError(result.error ?? t("errors.generateImage"));
        return;
      }

      setAssets((current) => [result.asset!, ...current]);
      setNotice(t("notices.imageGenerated"));
    });
  };

  const handlePostChange = (postId: string, updates: Partial<Post>) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, ...updates } : post))
    );
  };

  const handleSavePost = (post: Post) => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await updateMarketingPost({
        postId: post.id,
        title: post.title,
        caption: post.caption,
        hashtags: post.hashtags,
        status: post.status,
        scheduledAt: post.scheduled_at,
        linkedAssetId: post.linked_asset_id,
      });

      if (result.error || !result.post) {
        setError(result.error ?? t("errors.savePost"));
        return;
      }

      handlePostChange(post.id, result.post);
      setNotice(t("notices.postSaved"));
    });
  };

  const handleDuplicatePost = (postId: string) => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await duplicateMarketingPost(postId);
      if (result.error || !result.post) {
        setError(result.error ?? t("errors.duplicatePost"));
        return;
      }

      setPosts((current) => [result.post!, ...current]);
      setNotice(t("notices.postDuplicated"));
    });
  };

  const handleCopyCaption = async (caption: string) => {
    await navigator.clipboard.writeText(caption);
    setNotice(t("notices.captionCopied"));
  };

  return (
    <div className="space-y-6">
      {(error || notice) ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : null}
          {notice ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {notice}
            </div>
          ) : null}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <MarketingMonthCalendar
            viewYear={viewYear}
            viewMonth={viewMonth}
            selectedYmd={selectedYmd}
            dayCounts={dayCounts}
            onSelectDay={handleSelectDay}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        </div>

        <aside className="rounded-xl border border-neutral-200 bg-white p-5 xl:col-span-4">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              {t("agenda.selectedDay")}
            </p>
            <h2 className="mt-1 text-lg font-semibold capitalize text-neutral-900">{formatDay(selectedYmd)}</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {t("agenda.context", { campaign: campaignLabel })}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <select
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value as PlatformFilter)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="all">{t("filters.all")}</option>
              {PLATFORM_OPTIONS.map((platform) => (
                <option key={platform} value={platform}>
                  {t(`platforms.${platform}`)}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="all">{t("filters.allStatuses")}</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {selectedDayPosts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-5 text-center">
                <p className="text-sm font-medium text-neutral-800">{t("agenda.emptyTitle")}</p>
                <p className="mt-1 text-sm text-neutral-500">{t("agenda.emptyHint")}</p>
              </div>
            ) : (
              selectedDayPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => handleSelectCampaign(post.campaign_id)}
                  className="w-full rounded-lg border border-neutral-200 p-3 text-left hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      {t(`platforms.${post.platform}`)}
                    </span>
                    <PostStatusPill status={post.status} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-neutral-900">{post.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">{formatDate(post.scheduled_at)}</p>
                </button>
              ))
            )}
          </div>

          <div className="mt-5 rounded-lg border border-neutral-200 p-4">
            <h3 className="text-sm font-semibold text-neutral-900">{t("agenda.scheduleExistingTitle")}</h3>
            <p className="mt-1 text-xs text-neutral-500">{t("agenda.scheduleExistingHint")}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
              <select
                value={schedulePostId || unscheduledPosts[0]?.id || ""}
                onChange={(event) => setSchedulePostId(event.target.value)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                disabled={unscheduledPosts.length === 0}
              >
                {unscheduledPosts.length === 0 ? (
                  <option value="">{t("agenda.noDrafts")}</option>
                ) : (
                  unscheduledPosts.map((post) => (
                    <option key={post.id} value={post.id}>
                      {post.title}
                    </option>
                  ))
                )}
              </select>
              <input
                type="time"
                value={scheduleTime}
                onChange={(event) => setScheduleTime(event.target.value)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleScheduleExisting}
              disabled={isPending || unscheduledPosts.length === 0}
              className="mt-3 w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
            >
              {t("agenda.scheduleCta")}
            </button>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-4">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900">{t("brief.title")}</h2>
              <p className="mt-0.5 text-sm text-neutral-500">{t("brief.subtitle")}</p>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500" htmlFor="marketing-campaign">
                  {t("brief.campaignLabel")}
                </label>
                <select
                  id="marketing-campaign"
                  value={selectedCampaignId ?? "new"}
                  onChange={(event) => handleSelectCampaign(event.target.value === "new" ? null : event.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="new">{t("brief.newCampaign")}</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500" htmlFor="marketing-name">
                  {t("brief.nameLabel")}
                </label>
                <input
                  id="marketing-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500" htmlFor="marketing-goal">
                  {t("brief.goalLabel")}
                </label>
                <textarea
                  id="marketing-goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500" htmlFor="marketing-product">
                  {t("brief.productLabel")}
                </label>
                <textarea
                  id="marketing-product"
                  value={productFocus}
                  onChange={(event) => setProductFocus(event.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <p className="mb-2 block text-xs font-medium text-neutral-500">{t("brief.toneLabel")}</p>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleValue(option, tone, setTone)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                        tone.includes(option)
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {t(`brief.tones.${option}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 block text-xs font-medium text-neutral-500">{t("brief.platformsLabel")}</p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => toggleValue(platform, platforms, setPlatforms, 1)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                        platforms.includes(platform)
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {t(`platforms.${platform}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 block text-xs font-medium text-neutral-500">{t("brief.outputLabel")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {OUTPUT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleValue(option, outputs, setOutputs, 1)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                        outputs.includes(option)
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                      }`}
                    >
                      {t(`brief.output.${option}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 bg-white/95 px-6 py-4">
              <button
                type="button"
                onClick={handleGenerateDrafts}
                disabled={isPending || !goal.trim() || !productFocus.trim()}
                className="inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
              >
                {isPending ? t("brief.generating") : t("brief.generateSticky")}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900">{t("quickDraft.title")}</h2>
              <p className="mt-0.5 text-sm text-neutral-500">{t("quickDraft.subtitle")}</p>
            </div>
            <div className="space-y-3 p-6">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={quickPlatform}
                  onChange={(event) => setQuickPlatform(event.target.value as Platform)}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                >
                  {PLATFORM_OPTIONS.map((platform) => (
                    <option key={platform} value={platform}>
                      {t(`platforms.${platform}`)}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={quickTime}
                  onChange={(event) => setQuickTime(event.target.value)}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <input
                value={quickTitle}
                onChange={(event) => setQuickTitle(event.target.value)}
                placeholder={t("quickDraft.titlePlaceholder")}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
              <textarea
                value={quickCaption}
                onChange={(event) => setQuickCaption(event.target.value)}
                placeholder={t("quickDraft.captionPlaceholder")}
                rows={4}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
              <input
                value={quickHashtags}
                onChange={(event) => setQuickHashtags(event.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-600"
              />
              <button
                type="button"
                onClick={handleCreateQuickDraft}
                disabled={isPending || !quickTitle.trim() || !quickCaption.trim() || !goal.trim() || !productFocus.trim()}
                className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
              >
                {t("quickDraft.createCta", { day: formatDay(selectedYmd) })}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-8">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">{t("assetLibrary.title")}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">{t("assetLibrary.subtitle")}</p>
          </div>

          <div className="p-6 space-y-5">
            <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
              <label className="block text-xs font-medium text-neutral-500 mb-2" htmlFor="marketing-upload-label">
                {t("assetLibrary.uploadLabel")}
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="marketing-upload-label"
                  value={uploadLabel}
                  onChange={(event) => setUploadLabel(event.target.value)}
                  placeholder={t("assetLibrary.uploadPlaceholder")}
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleUpload}
                  className="hidden"
                  id="marketing-reference-upload"
                />
                <label
                  htmlFor="marketing-reference-upload"
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  {t("assetLibrary.upload")}
                </label>
              </div>
            </div>

            {referenceAssets.length === 0 ? (
              <div className="rounded-lg border border-neutral-200 p-6 text-center">
                <p className="text-sm font-medium text-neutral-800">{t("assetLibrary.emptyTitle")}</p>
                <p className="text-sm text-neutral-500 mt-1">{t("assetLibrary.emptyHint")}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-neutral-500 mb-2">{t("assetLibrary.referenceTitle")}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {referenceAssets.map((asset) => {
                    const selected = selectedReferenceAssetIds.includes(asset.id);
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() =>
                          toggleValue(asset.id, selectedReferenceAssetIds, setSelectedReferenceAssetIds)
                        }
                        className={`text-left rounded-lg border overflow-hidden bg-white ${
                          selected ? "border-neutral-900 ring-2 ring-neutral-900/15" : "border-neutral-200"
                        }`}
                      >
                        <img src={asset.url} alt={asset.label} className="aspect-square w-full object-cover" />
                        <span className="block px-2.5 py-2 text-xs font-medium text-neutral-800 line-clamp-2">
                          {asset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-neutral-200 p-4">
              <label className="block text-xs font-medium text-neutral-500 mb-2" htmlFor="marketing-image-prompt">
                {t("preview.imagePromptLabel")}
              </label>
              <textarea
                id="marketing-image-prompt"
                value={imagePrompt}
                onChange={(event) => setImagePrompt(event.target.value)}
                rows={4}
                placeholder={t("preview.imagePromptSample")}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={isPending || selectedReferenceAssetIds.length === 0 || !imagePrompt.trim()}
                className="mt-3 inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed"
              >
                {isPending ? t("preview.generatingImage") : t("preview.generateImage")}
              </button>
            </div>

            {generatedAssets.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-neutral-500 mb-2">{t("assetLibrary.generatedTitle")}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {generatedAssets.map((asset) => (
                    <div key={asset.id} className="rounded-lg border border-neutral-200 overflow-hidden bg-white">
                      <img src={asset.url} alt={asset.label} className="aspect-square w-full object-cover" />
                      <div className="p-2.5">
                        <p className="text-xs font-medium text-neutral-900 line-clamp-2">{asset.label}</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{formatDate(asset.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">{t("planner.title")}</h2>
                <p className="text-sm text-neutral-500">{t("planner.subtitle")}</p>
              </div>
              <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600">
                {t("planner.filteredCount", { count: filteredPosts.length })}
              </span>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
                <p className="text-sm font-medium text-neutral-800">{t("planner.emptyTitle")}</p>
                <p className="mt-1 text-sm text-neutral-500">{t("planner.emptyHint")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <PostEditor
                    key={post.id}
                    post={post}
                    assets={assets}
                    isPending={isPending}
                    onChange={handlePostChange}
                    onSave={handleSavePost}
                    onDuplicate={handleDuplicatePost}
                    onCopyCaption={handleCopyCaption}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
