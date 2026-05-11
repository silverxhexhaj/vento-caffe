"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
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

const PLATFORM_OPTIONS: Platform[] = ["instagram", "facebook", "tiktok"];
const TONE_OPTIONS = ["confident", "warm", "shortHooks"];
const OUTPUT_OPTIONS = ["captions", "hashtags", "imagePrompts", "storyScripts"];

interface MarketingStudioClientProps {
  initialData: MarketingStudioData;
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

export default function MarketingStudioClient({ initialData }: MarketingStudioClientProps) {
  const t = useTranslations("admin.marketing");
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const visiblePosts = selectedCampaignId
    ? posts.filter((post) => post.campaign_id === selectedCampaignId)
    : posts;

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
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <section className="xl:col-span-5 bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">{t("brief.title")}</h2>
          <p className="text-sm text-neutral-500 mt-0.5">{t("brief.subtitle")}</p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1" htmlFor="marketing-campaign">
              {t("brief.campaignLabel")}
            </label>
            <select
              id="marketing-campaign"
              value={selectedCampaignId ?? "new"}
              onChange={(event) => {
                const next = event.target.value === "new" ? null : event.target.value;
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
                  setOutputs(
                    campaign.outputs.length
                      ? campaign.outputs
                      : ["captions", "hashtags", "imagePrompts"]
                  );
                  setImagePrompt(
                    posts.find((post) => post.campaign_id === campaign.id && post.image_prompt)?.image_prompt ??
                      ""
                  );
                }
              }}
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
            <label className="block text-xs font-medium text-neutral-500 mb-1" htmlFor="marketing-name">
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
            <label className="block text-xs font-medium text-neutral-500 mb-1" htmlFor="marketing-goal">
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
            <label className="block text-xs font-medium text-neutral-500 mb-1" htmlFor="marketing-product">
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
            <p className="block text-xs font-medium text-neutral-500 mb-2">{t("brief.toneLabel")}</p>
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
            <p className="block text-xs font-medium text-neutral-500 mb-2">{t("brief.platformsLabel")}</p>
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
            <p className="block text-xs font-medium text-neutral-500 mb-2">{t("brief.outputLabel")}</p>
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

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : null}
          {notice ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {notice}
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white/95 px-6 py-4">
          <button
            type="button"
            onClick={handleGenerateDrafts}
            disabled={isPending || !goal.trim() || !productFocus.trim()}
            className="inline-flex w-full items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed"
          >
            {isPending ? t("brief.generating") : t("brief.generateSticky")}
          </button>
        </div>
      </section>

      <section className="xl:col-span-7 space-y-6">
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
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

        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">{t("planner.title")}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">{t("planner.subtitle")}</p>
          </div>

          {visiblePosts.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-neutral-800">{t("planner.emptyTitle")}</p>
              <p className="text-sm text-neutral-500 mt-1">{t("planner.emptyHint")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {visiblePosts.map((post) => (
                <li key={post.id} className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        {t(`platforms.${post.platform}`)}
                      </span>
                      <PostStatusPill status={post.status} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCaption(post.caption)}
                        className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        {t("preview.copyCaption")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicatePost(post.id)}
                        className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        {t("planner.rowActions.duplicate")}
                      </button>
                    </div>
                  </div>

                  <input
                    value={post.title}
                    onChange={(event) => handlePostChange(post.id, { title: event.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <textarea
                    value={post.caption}
                    onChange={(event) => handlePostChange(post.id, { caption: event.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <input
                    value={post.hashtags.join(" ")}
                    onChange={(event) =>
                      handlePostChange(post.id, {
                        hashtags: event.target.value.split(/\s+/).filter(Boolean),
                      })
                    }
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <select
                      value={post.status}
                      onChange={(event) =>
                        handlePostChange(post.id, { status: event.target.value as PostStatus })
                      }
                      className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    >
                      <option value="draft">{t("status.draft")}</option>
                      <option value="ready">{t("status.ready")}</option>
                      <option value="scheduled">{t("status.scheduled")}</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={post.scheduled_at ? post.scheduled_at.slice(0, 16) : ""}
                      onChange={(event) =>
                        handlePostChange(post.id, {
                          scheduled_at: event.target.value
                            ? new Date(event.target.value).toISOString()
                            : null,
                          status: event.target.value ? "scheduled" : post.status,
                        })
                      }
                      className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    />
                    <select
                      value={post.linked_asset_id ?? ""}
                      onChange={(event) =>
                        handlePostChange(post.id, { linked_asset_id: event.target.value || null })
                      }
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
                      onClick={() => handleSavePost(post)}
                      disabled={isPending}
                      className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-500"
                    >
                      {t("planner.rowActions.save")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
