"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface NewsletterResult {
  success: boolean;
  error?: string;
}

// Create an untyped Supabase client for newsletter operations
async function createUntypedClient() {
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

export async function subscribeToNewsletter(email: string): Promise<NewsletterResult> {
  try {
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please provide a valid email address" };
    }

    const supabase = await createUntypedClient();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, subscribed")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      if ((existing as { subscribed: boolean }).subscribed) {
        return { success: false, error: "You are already subscribed" };
      }
      
      // Resubscribe
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ subscribed: true })
        .eq("id", (existing as { id: string }).id);

      if (error) {
        return { success: false, error: "Failed to resubscribe" };
      }
      
      return { success: true };
    }

    // New subscription
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.toLowerCase(), subscribed: true });

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "You are already subscribed" };
      }
      return { success: false, error: "Failed to subscribe" };
    }

    return { success: true };

  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function unsubscribeFromNewsletter(email: string): Promise<NewsletterResult> {
  try {
    const supabase = await createUntypedClient();

    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ subscribed: false })
      .eq("email", email.toLowerCase());

    if (error) {
      return { success: false, error: "Failed to unsubscribe" };
    }

    return { success: true };

  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
