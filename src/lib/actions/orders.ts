"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Create an untyped Supabase client for order operations
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

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  productSlug: string;
  quantity: number;
  priceAtPurchase: number;
  isFree: boolean;
}

export interface CreateOrderInput {
  items: OrderItem[];
  total: number;
  isSubscription: boolean;
  shippingAddress: ShippingAddress;
  notes?: string;
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderResult> {
  try {
    const supabase = await createUntypedClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: "You must be logged in to place an order" };
    }

    // Get product IDs from slugs
    const slugs = input.items.map(item => item.productSlug);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, slug")
      .in("slug", slugs);

    if (productsError) {
      return { success: false, error: "Failed to fetch products" };
    }

    const slugToId = new Map((products as Array<{id: string; slug: string}>)?.map(p => [p.slug, p.id]) ?? []);

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total: input.total,
        is_subscription: input.isSubscription,
        shipping_address: input.shippingAddress,
        notes: input.notes || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return { success: false, error: "Failed to create order" };
    }

    const orderId = (order as { id: string }).id;

    // Create order items
    const orderItems = input.items.map(item => ({
      order_id: orderId,
      product_id: slugToId.get(item.productSlug) || null,
      quantity: item.quantity,
      price_at_purchase: item.priceAtPurchase,
      is_free: item.isFree,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      // Rollback: delete the order if items failed
      await supabase.from("orders").delete().eq("id", orderId);
      return { success: false, error: "Failed to create order items" };
    }

    revalidatePath("/orders");
    return { success: true, orderId };

  } catch (error) {
    console.error("Create order error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getOrders() {
  try {
    const supabase = await createUntypedClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { orders: [], error: "Not authenticated" };
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (slug, name_key, images)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ordersError) {
      return { orders: [], error: ordersError.message };
    }

    return { orders: orders ?? [], error: null };

  } catch (error) {
    console.error("Get orders error:", error);
    return { orders: [], error: "An unexpected error occurred" };
  }
}

export async function getOrderById(orderId: string) {
  try {
    const supabase = await createUntypedClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { order: null, error: "Not authenticated" };
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (slug, name_key, images, price)
        )
      `)
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError) {
      return { order: null, error: orderError.message };
    }

    return { order, error: null };

  } catch (error) {
    console.error("Get order error:", error);
    return { order: null, error: "An unexpected error occurred" };
  }
}

export async function cancelOrder(orderId: string): Promise<OrderResult> {
  try {
    const supabase = await createUntypedClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Only allow canceling pending orders
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !order) {
      return { success: false, error: "Order not found" };
    }

    if ((order as { status: string }).status !== "pending") {
      return { success: false, error: "Only pending orders can be cancelled" };
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .eq("user_id", user.id);

    if (updateError) {
      return { success: false, error: "Failed to cancel order" };
    }

    revalidatePath("/orders");
    return { success: true, orderId };

  } catch (error) {
    console.error("Cancel order error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
