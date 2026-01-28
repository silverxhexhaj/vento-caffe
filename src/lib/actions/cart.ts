"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CartItem } from "@/lib/cart";

interface CartResult {
  success: boolean;
  error?: string;
}

interface CartData {
  items: CartItem[];
  isSubscription: boolean;
}

// Create an untyped Supabase client for cart operations
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

export async function saveCart(items: CartItem[], isSubscription: boolean): Promise<CartResult> {
  try {
    const supabase = await createUntypedClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      // Not logged in, cart is stored locally only
      return { success: true };
    }

    // Check if cart exists
    const { data: existingCart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingCart) {
      // Update existing cart
      const { error } = await supabase
        .from("carts")
        .update({
          items: items,
          is_subscription: isSubscription,
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Update cart error:", error);
        return { success: false, error: "Failed to save cart" };
      }
    } else {
      // Insert new cart
      const { error } = await supabase
        .from("carts")
        .insert({
          user_id: user.id,
          items: items,
          is_subscription: isSubscription,
        });

      if (error) {
        console.error("Insert cart error:", error);
        return { success: false, error: "Failed to save cart" };
      }
    }

    return { success: true };

  } catch (error) {
    console.error("Save cart error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function loadCart(): Promise<{ data: CartData | null; error: string | null }> {
  try {
    const supabase = await createUntypedClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { data: null, error: null };
    }

    const { data: cart, error } = await supabase
      .from("carts")
      .select("items, is_subscription")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No cart found
        return { data: null, error: null };
      }
      return { data: null, error: error.message };
    }

    return {
      data: {
        items: (cart.items as CartItem[]) || [],
        isSubscription: cart.is_subscription as boolean,
      },
      error: null,
    };

  } catch (error) {
    console.error("Load cart error:", error);
    return { data: null, error: "An unexpected error occurred" };
  }
}

export async function clearServerCart(): Promise<CartResult> {
  try {
    const supabase = await createUntypedClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: true };
    }

    const { error } = await supabase
      .from("carts")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: "Failed to clear cart" };
    }

    return { success: true };

  } catch (error) {
    console.error("Clear cart error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
