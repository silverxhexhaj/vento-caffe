"use server";

import OpenAI, { toFile } from "openai";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";
import { verifyAdmin } from "./admin";

type MarketingPlatform = Database["public"]["Enums"]["marketing_platform"];
type MarketingPostStatus = Database["public"]["Enums"]["marketing_post_status"];
type MarketingCampaign = Database["public"]["Tables"]["marketing_campaigns"]["Row"];
type MarketingAsset = Database["public"]["Tables"]["marketing_assets"]["Row"];
type MarketingPost = Database["public"]["Tables"]["marketing_posts"]["Row"];
type LooseSupabaseClient = Omit<Awaited<ReturnType<typeof createClient>>, "from"> & {
  // Supabase's generated helper types in this repo do not include the new tables until migrations are applied.
  // Keep the action payloads typed locally while allowing the new table names through the client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any;
};

const MARKETING_BUCKET = "marketing-assets";
const MARKETING_CAMPAIGNS_TABLE: string = "marketing_campaigns";
const MARKETING_ASSETS_TABLE: string = "marketing_assets";
const MARKETING_POSTS_TABLE: string = "marketing_posts";
const VALID_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_REFERENCE_IMAGE_SIZE = 8 * 1024 * 1024;
const SUPPORTED_PLATFORMS: MarketingPlatform[] = ["instagram", "facebook", "tiktok"];
const DEFAULT_OUTPUTS = ["captions", "hashtags", "imagePrompts"];

export interface MarketingStudioData {
  campaigns: MarketingCampaign[];
  assets: MarketingAsset[];
  posts: MarketingPost[];
}

export interface MarketingBriefInput {
  campaignId?: string | null;
  name: string;
  goal: string;
  productFocus: string;
  tone: string[];
  platforms: MarketingPlatform[];
  outputs: string[];
  referenceAssetIds: string[];
}

export interface CreateMarketingPostDraftInput extends MarketingBriefInput {
  platform: MarketingPlatform;
  title: string;
  caption: string;
  hashtags: string[];
  scheduledAt: string;
  linkedAssetId?: string | null;
}

export interface GeneratedPostDraft {
  platform: MarketingPlatform;
  title: string;
  caption: string;
  hashtags: string[];
  imagePrompt: string;
}

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

async function createMarketingClient() {
  return (await createClient()) as unknown as LooseSupabaseClient;
}

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePlatforms(platforms: MarketingPlatform[]) {
  const unique = Array.from(new Set(platforms));
  return unique.filter((platform): platform is MarketingPlatform =>
    SUPPORTED_PLATFORMS.includes(platform)
  );
}

function sanitizeHashtags(hashtags: unknown): string[] {
  if (!Array.isArray(hashtags)) return [];
  return hashtags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag.replace(/^#+/, "")}`))
    .slice(0, 12);
}

function validateGeneratedPosts(value: unknown, platforms: MarketingPlatform[]): GeneratedPostDraft[] {
  const posts = Array.isArray(value) ? value : [];

  return posts
    .map((post) => {
      if (!post || typeof post !== "object") return null;
      const item = post as Record<string, unknown>;
      const platform = item.platform;
      const title = typeof item.title === "string" ? item.title.trim() : "";
      const caption = typeof item.caption === "string" ? item.caption.trim() : "";
      const imagePrompt = typeof item.imagePrompt === "string" ? item.imagePrompt.trim() : "";

      if (
        !SUPPORTED_PLATFORMS.includes(platform as MarketingPlatform) ||
        !platforms.includes(platform as MarketingPlatform) ||
        title.length < 3 ||
        caption.length < 20
      ) {
        return null;
      }

      return {
        platform: platform as MarketingPlatform,
        title: title.slice(0, 140),
        caption: caption.slice(0, 2200),
        hashtags: sanitizeHashtags(item.hashtags),
        imagePrompt: imagePrompt.slice(0, 1200),
      };
    })
    .filter((post): post is GeneratedPostDraft => Boolean(post));
}

async function ensureAdmin() {
  const auth = await verifyAdmin();
  if (!auth.isAdmin || !auth.userId) {
    return { userId: null, error: auth.error ?? "Not authorized" };
  }

  return { userId: auth.userId, error: null };
}

async function saveCampaign(
  input: MarketingBriefInput,
  userId: string,
  status: Database["public"]["Enums"]["marketing_campaign_status"] = "generating"
) {
  const supabase = await createMarketingClient();
  const payload = {
    name: input.name.trim(),
    goal: input.goal.trim(),
    product_focus: input.productFocus.trim(),
    tone: input.tone.filter(Boolean),
    platforms: normalizePlatforms(input.platforms),
    outputs: input.outputs.length > 0 ? input.outputs : DEFAULT_OUTPUTS,
    status,
    error_message: null,
    created_by: userId,
  };

  if (input.campaignId) {
    const { data, error } = await supabase
      .from(MARKETING_CAMPAIGNS_TABLE)
      .update(payload)
      .eq("id", input.campaignId)
      .select("*")
      .single();

    return { campaign: data as MarketingCampaign | null, error };
  }

  const { data, error } = await supabase
    .from(MARKETING_CAMPAIGNS_TABLE)
    .insert(payload)
    .select("*")
    .single();

  return { campaign: data as MarketingCampaign | null, error };
}

export async function getMarketingStudioData(): Promise<{
  data: MarketingStudioData;
  error: string | null;
}> {
  const auth = await ensureAdmin();
  if (auth.error) {
    return {
      data: { campaigns: [], assets: [], posts: [] },
      error: auth.error,
    };
  }

  try {
    const supabase = await createMarketingClient();
    const [campaignsResult, assetsResult, postsResult] = await Promise.all([
      supabase.from(MARKETING_CAMPAIGNS_TABLE).select("*").order("created_at", { ascending: false }),
      supabase.from(MARKETING_ASSETS_TABLE).select("*").order("created_at", { ascending: false }),
      supabase.from(MARKETING_POSTS_TABLE).select("*").order("created_at", { ascending: false }),
    ]);

    const error = campaignsResult.error ?? assetsResult.error ?? postsResult.error;
    if (error) {
      return {
        data: { campaigns: [], assets: [], posts: [] },
        error: error.message,
      };
    }

    return {
      data: {
        campaigns: (campaignsResult.data as MarketingCampaign[]) ?? [],
        assets: (assetsResult.data as MarketingAsset[]) ?? [],
        posts: (postsResult.data as MarketingPost[]) ?? [],
      },
      error: null,
    };
  } catch {
    return {
      data: { campaigns: [], assets: [], posts: [] },
      error: "Failed to load marketing studio data",
    };
  }
}

export async function uploadMarketingReferenceAsset(
  formData: FormData
): Promise<{ asset: MarketingAsset | null; error: string | null }> {
  const auth = await ensureAdmin();
  if (auth.error || !auth.userId) return { asset: null, error: auth.error };

  try {
    const file = formData.get("file") as File | null;
    const label = asString(formData.get("label")) || file?.name || "Reference image";
    const campaignId = asString(formData.get("campaignId")) || null;

    if (!file) return { asset: null, error: "No file provided" };
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      return { asset: null, error: "Upload a JPEG, PNG, or WebP image." };
    }
    if (file.size > MAX_REFERENCE_IMAGE_SIZE) {
      return { asset: null, error: "Reference image must be 8MB or smaller." };
    }

    const supabase = await createMarketingClient();
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `references/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(MARKETING_BUCKET)
      .upload(filename, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) return { asset: null, error: uploadError.message };

    const { data: urlData } = supabase.storage
      .from(MARKETING_BUCKET)
      .getPublicUrl(uploadData.path);

    const { data, error } = await supabase
      .from(MARKETING_ASSETS_TABLE)
      .insert({
        campaign_id: campaignId,
        kind: "reference",
        source: "upload",
        label,
        url: urlData.publicUrl,
        storage_path: uploadData.path,
        content_type: file.type,
        metadata: { originalName: file.name, size: file.size },
        created_by: auth.userId,
      })
      .select("*")
      .single();

    if (error) return { asset: null, error: error.message };
    revalidatePath("/admin/marketing");
    return { asset: data as MarketingAsset, error: null };
  } catch {
    return { asset: null, error: "Failed to upload reference image" };
  }
}

export async function generateMarketingDrafts(
  input: MarketingBriefInput
): Promise<{
  campaign: MarketingCampaign | null;
  posts: MarketingPost[];
  error: string | null;
}> {
  const auth = await ensureAdmin();
  if (auth.error || !auth.userId) return { campaign: null, posts: [], error: auth.error };

  const platforms = normalizePlatforms(input.platforms);
  if (platforms.length === 0) {
    return { campaign: null, posts: [], error: "Choose at least one platform." };
  }
  if (!input.goal.trim() || !input.productFocus.trim()) {
    return { campaign: null, posts: [], error: "Goal and product focus are required." };
  }

  const { campaign, error: campaignError } = await saveCampaign(
    { ...input, platforms },
    auth.userId
  );
  if (campaignError || !campaign) {
    return {
      campaign: null,
      posts: [],
      error: campaignError?.message ?? "Failed to save campaign",
    };
  }

  const supabase = await createMarketingClient();

  try {
    const client = createOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.75,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior Albanian social media copywriter for Vento Caffè. Return strict JSON only. All post copy must be in natural Albanian. Do not invent discounts beyond the provided offer.",
        },
        {
          role: "user",
          content: JSON.stringify({
            requiredShape: {
              posts: [
                {
                  platform: "instagram | facebook | tiktok",
                  title: "short internal title in Albanian",
                  caption: "ready-to-post Albanian caption",
                  hashtags: ["#VentoCaffe"],
                  imagePrompt: "English prompt for GPT Image, brand-safe and based on the brief",
                },
              ],
            },
            brandContext: {
              brand: "Vento Caffè",
              language: "Albanian",
              offer:
                "Premium Italian ESE cialde, monthly delivery, and a free espresso machine with monthly cialde subscription.",
              cta: "Encourage WhatsApp/order conversation when relevant.",
            },
            campaignBrief: {
              goal: input.goal,
              productFocus: input.productFocus,
              tone: input.tone,
              platforms,
              outputs: input.outputs,
              draftCountPerPlatform: 2,
            },
          }),
        },
      ],
    });

    const raw = response.choices[0]?.message.content;
    const parsed = raw ? JSON.parse(raw) : null;
    const drafts = validateGeneratedPosts(parsed?.posts, platforms);

    if (drafts.length === 0) {
      throw new Error("AI response did not include valid Albanian post drafts.");
    }

    await supabase.from(MARKETING_POSTS_TABLE).delete().eq("campaign_id", campaign.id);

    const { data, error } = await supabase
      .from(MARKETING_POSTS_TABLE)
      .insert(
        drafts.map((draft) => ({
          campaign_id: campaign.id,
          platform: draft.platform,
          title: draft.title,
          caption: draft.caption,
          hashtags: draft.hashtags,
          image_prompt: draft.imagePrompt,
          status: "draft" as const,
          metadata: { model: "gpt-4.1-mini" },
          created_by: auth.userId,
        }))
      )
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const { data: updatedCampaign } = await supabase
      .from(MARKETING_CAMPAIGNS_TABLE)
      .update({ status: "ready", error_message: null })
      .eq("id", campaign.id)
      .select("*")
      .single();

    revalidatePath("/admin/marketing");
    return {
      campaign: (updatedCampaign as MarketingCampaign | null) ?? campaign,
      posts: (data as MarketingPost[]) ?? [],
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate post drafts";
    await supabase
      .from(MARKETING_CAMPAIGNS_TABLE)
      .update({ status: "failed", error_message: message })
      .eq("id", campaign.id);

    return { campaign, posts: [], error: message };
  }
}

export async function createMarketingPostDraft(
  input: CreateMarketingPostDraftInput
): Promise<{
  campaign: MarketingCampaign | null;
  post: MarketingPost | null;
  error: string | null;
}> {
  const auth = await ensureAdmin();
  if (auth.error || !auth.userId) return { campaign: null, post: null, error: auth.error };

  const platforms = normalizePlatforms(input.platforms);
  if (!SUPPORTED_PLATFORMS.includes(input.platform)) {
    return { campaign: null, post: null, error: "Choose a supported platform." };
  }
  if (platforms.length === 0) {
    return { campaign: null, post: null, error: "Choose at least one platform." };
  }
  if (!input.goal.trim() || !input.productFocus.trim()) {
    return { campaign: null, post: null, error: "Goal and product focus are required." };
  }
  if (!input.title.trim() || !input.caption.trim()) {
    return { campaign: null, post: null, error: "Title and caption are required." };
  }
  if (!input.scheduledAt || Number.isNaN(new Date(input.scheduledAt).getTime())) {
    return { campaign: null, post: null, error: "Choose a valid schedule date." };
  }

  const { campaign, error: campaignError } = await saveCampaign(
    { ...input, platforms: platforms.includes(input.platform) ? platforms : [...platforms, input.platform] },
    auth.userId,
    "ready"
  );
  if (campaignError || !campaign) {
    return {
      campaign: null,
      post: null,
      error: campaignError?.message ?? "Failed to save campaign",
    };
  }

  try {
    const supabase = await createMarketingClient();
    const { data, error } = await supabase
      .from(MARKETING_POSTS_TABLE)
      .insert({
        campaign_id: campaign.id,
        linked_asset_id: input.linkedAssetId || null,
        platform: input.platform,
        title: input.title.trim().slice(0, 140),
        caption: input.caption.trim().slice(0, 2200),
        hashtags: sanitizeHashtags(input.hashtags),
        status: "scheduled",
        scheduled_at: input.scheduledAt,
        metadata: { source: "manual" },
        created_by: auth.userId,
      })
      .select("*")
      .single();

    if (error) return { campaign, post: null, error: error.message };
    revalidatePath("/admin/marketing");
    return { campaign, post: data as MarketingPost, error: null };
  } catch {
    return { campaign, post: null, error: "Failed to create post draft" };
  }
}

export async function generateMarketingImage(input: {
  campaignId?: string | null;
  referenceAssetIds: string[];
  prompt: string;
  label?: string;
}): Promise<{ asset: MarketingAsset | null; error: string | null }> {
  const auth = await ensureAdmin();
  if (auth.error || !auth.userId) return { asset: null, error: auth.error };

  if (!input.prompt.trim()) return { asset: null, error: "Image prompt is required." };
  if (input.referenceAssetIds.length === 0) {
    return { asset: null, error: "Select at least one uploaded reference image." };
  }

  try {
    const supabase = await createMarketingClient();
    const { data: references, error: refError } = await supabase
      .from(MARKETING_ASSETS_TABLE)
      .select("*")
      .in("id", input.referenceAssetIds)
      .eq("kind", "reference");

    if (refError) return { asset: null, error: refError.message };
    if (!references || references.length === 0) {
      return { asset: null, error: "No matching reference images found." };
    }

    const referenceFiles = await Promise.all(
      (references as MarketingAsset[]).slice(0, 4).map(async (asset, index) => {
        const response = await fetch(asset.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch reference image ${index + 1}.`);
        }
        const contentType = response.headers.get("content-type") ?? asset.content_type ?? "image/png";
        const buffer = Buffer.from(await response.arrayBuffer());
        return toFile(buffer, `reference-${index + 1}.png`, { type: contentType });
      })
    );

    const client = createOpenAIClient();
    const result = await client.images.edit({
      model: "gpt-image-1",
      image: referenceFiles,
      prompt:
        `${input.prompt.trim()}\n\nCreate a polished social media asset for Vento Caffè. ` +
        "Preserve the real product cues from the reference images. Avoid fake logos, fake prices, or unreadable text.",
      size: "1024x1024",
    });

    const imageBase64 = result.data?.[0]?.b64_json;
    if (!imageBase64) throw new Error("GPT Image did not return image data.");

    const imageBuffer = Buffer.from(imageBase64, "base64");
    const filename = `generated/${Date.now()}-${crypto.randomUUID()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(MARKETING_BUCKET)
      .upload(filename, imageBuffer, {
        cacheControl: "3600",
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) return { asset: null, error: uploadError.message };

    const { data: urlData } = supabase.storage
      .from(MARKETING_BUCKET)
      .getPublicUrl(uploadData.path);

    const { data, error } = await supabase
      .from(MARKETING_ASSETS_TABLE)
      .insert({
        campaign_id: input.campaignId || null,
        kind: "generated",
        source: "gpt_image",
        label: input.label?.trim() || "Generated campaign asset",
        url: urlData.publicUrl,
        storage_path: uploadData.path,
        content_type: "image/png",
        prompt: input.prompt.trim(),
        metadata: {
          model: "gpt-image-1",
          referenceAssetIds: input.referenceAssetIds,
        },
        created_by: auth.userId,
      })
      .select("*")
      .single();

    if (error) return { asset: null, error: error.message };
    revalidatePath("/admin/marketing");
    return { asset: data as MarketingAsset, error: null };
  } catch (error) {
    return {
      asset: null,
      error: error instanceof Error ? error.message : "Failed to generate image asset",
    };
  }
}

export async function updateMarketingPost(payload: {
  postId: string;
  title?: string;
  caption?: string;
  hashtags?: string[];
  status?: MarketingPostStatus;
  scheduledAt?: string | null;
  linkedAssetId?: string | null;
}): Promise<{ post: MarketingPost | null; error: string | null }> {
  const auth = await ensureAdmin();
  if (auth.error) return { post: null, error: auth.error };

  const updates: Database["public"]["Tables"]["marketing_posts"]["Update"] = {};
  if (payload.title !== undefined) updates.title = payload.title.trim();
  if (payload.caption !== undefined) updates.caption = payload.caption.trim();
  if (payload.hashtags !== undefined) updates.hashtags = payload.hashtags;
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.scheduledAt !== undefined) updates.scheduled_at = payload.scheduledAt;
  if (payload.linkedAssetId !== undefined) updates.linked_asset_id = payload.linkedAssetId;

  if (updates.status !== "scheduled") {
    updates.scheduled_at = null;
  }

  try {
    const supabase = await createMarketingClient();
    const { data, error } = await supabase
      .from(MARKETING_POSTS_TABLE)
      .update(updates)
      .eq("id", payload.postId)
      .select("*")
      .single();

    if (error) return { post: null, error: error.message };
    revalidatePath("/admin/marketing");
    return { post: data as MarketingPost, error: null };
  } catch {
    return { post: null, error: "Failed to update post draft" };
  }
}

export async function duplicateMarketingPost(
  postId: string
): Promise<{ post: MarketingPost | null; error: string | null }> {
  const auth = await ensureAdmin();
  if (auth.error || !auth.userId) return { post: null, error: auth.error };

  try {
    const supabase = await createMarketingClient();
    const { data: original, error: readError } = await supabase
      .from(MARKETING_POSTS_TABLE)
      .select("*")
      .eq("id", postId)
      .single();

    if (readError || !original) {
      return { post: null, error: readError?.message ?? "Post not found" };
    }

    const { data, error } = await supabase
      .from(MARKETING_POSTS_TABLE)
      .insert({
        campaign_id: original.campaign_id,
        linked_asset_id: original.linked_asset_id,
        platform: original.platform,
        title: `${original.title} (copy)`,
        caption: original.caption,
        hashtags: original.hashtags,
        status: "draft",
        image_prompt: original.image_prompt,
        metadata: { ...((original.metadata as Record<string, Json>) ?? {}), duplicatedFrom: postId },
        created_by: auth.userId,
      })
      .select("*")
      .single();

    if (error) return { post: null, error: error.message };
    revalidatePath("/admin/marketing");
    return { post: data as MarketingPost, error: null };
  } catch {
    return { post: null, error: "Failed to duplicate post draft" };
  }
}
