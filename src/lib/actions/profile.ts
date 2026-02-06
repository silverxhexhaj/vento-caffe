"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors from Server Components
          }
        },
      },
    }
  );
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  default_shipping_address: ShippingAddress | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileResult {
  success: boolean;
  error?: string;
}

export async function getProfile(): Promise<{
  profile: ProfileData | null;
  email: string | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { profile: null, email: null, error: "Not authenticated" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return { profile: null, email: user.email ?? null, error: profileError.message };
    }

    return {
      profile: profile as ProfileData,
      email: user.email ?? null,
      error: null,
    };
  } catch (error) {
    console.error("Get profile error:", error);
    return { profile: null, email: null, error: "An unexpected error occurred" };
  }
}

export async function updateProfile(data: {
  full_name?: string;
  phone?: string;
  default_shipping_address?: ShippingAddress | null;
}): Promise<ProfileResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone,
        default_shipping_address: data.default_shipping_address,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Update profile error:", updateError);
      return { success: false, error: "Failed to update profile" };
    }

    // Also update user metadata for full_name
    if (data.full_name !== undefined) {
      await supabase.auth.updateUser({
        data: { full_name: data.full_name },
      });
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updatePassword(
  newPassword: string
): Promise<ProfileResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("Update password error:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Update password error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
