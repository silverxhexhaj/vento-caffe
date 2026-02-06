"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function createAdminClient() {
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

// ============================================
// AUTH HELPERS
// ============================================

export async function verifyAdmin(): Promise<{
  isAdmin: boolean;
  userId: string | null;
  error: string | null;
}> {
  try {
    const supabase = await createAdminClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { isAdmin: false, userId: null, error: "Not authenticated" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { isAdmin: false, userId: user.id, error: "Profile not found" };
    }

    const isAdmin = (profile as { role: string }).role === "admin";
    if (!isAdmin) {
      return { isAdmin: false, userId: user.id, error: "Not authorized" };
    }

    return { isAdmin: true, userId: user.id, error: null };
  } catch {
    return { isAdmin: false, userId: null, error: "Verification failed" };
  }
}

// ============================================
// DASHBOARD
// ============================================

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeClients: number;
  recentOrders: AdminOrder[];
}

export interface AdminOrder {
  id: string;
  user_id: string;
  status: string;
  total: number;
  is_subscription: boolean;
  shipping_address: Record<string, string>;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email?: string;
    phone?: string | null;
  };
  order_items?: AdminOrderItem[];
}

export interface AdminOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  is_free: boolean;
  created_at: string;
  products?: {
    slug: string;
    name_key: string;
    images: string[];
    price: number;
  };
}

export async function getAdminDashboardStats(): Promise<{
  stats: DashboardStats | null;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { stats: null, error: authError };

  try {
    const supabase = await createAdminClient();

    // Get total orders count
    const { count: totalOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    // Get pending orders count
    const { count: pendingOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Get total revenue
    const { data: revenueData } = await supabase
      .from("orders")
      .select("total")
      .not("status", "eq", "cancelled");

    const totalRevenue =
      (revenueData as Array<{ total: number }>)?.reduce(
        (sum, order) => sum + Number(order.total),
        0
      ) ?? 0;

    // Get active clients count (users who have placed at least one order)
    const { data: clientData } = await supabase
      .from("orders")
      .select("user_id")
      .not("status", "eq", "cancelled");

    const uniqueClients = new Set(
      (clientData as Array<{ user_id: string }>)?.map((o) => o.user_id)
    );

    // Get recent orders (last 10)
    const { data: recentOrders } = await supabase
      .from("orders")
      .select(
        `
        *,
        profiles (full_name, phone),
        order_items (
          *,
          products (slug, name_key, images, price)
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(10);

    return {
      stats: {
        totalOrders: totalOrders ?? 0,
        pendingOrders: pendingOrders ?? 0,
        totalRevenue,
        activeClients: uniqueClients.size,
        recentOrders: (recentOrders as unknown as AdminOrder[]) ?? [],
      },
      error: null,
    };
  } catch {
    return { stats: null, error: "Failed to fetch dashboard stats" };
  }
}

// ============================================
// ORDERS
// ============================================

export interface OrderFilters {
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getAdminOrders(filters: OrderFilters = {}): Promise<{
  orders: AdminOrder[];
  total: number;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { orders: [], total: 0, error: authError };

  try {
    const supabase = await createAdminClient();
    const {
      status,
      page = 1,
      perPage = 20,
      sortBy = "created_at",
      sortOrder = "desc",
    } = filters;

    let query = supabase.from("orders").select(
      `
        *,
        profiles (full_name, phone),
        order_items (
          *,
          products (slug, name_key, images, price)
        )
      `,
      { count: "exact" }
    );

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const validSortColumns = ["created_at", "total", "status", "updated_at"];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "created_at";

    query = query
      .order(sortColumn, { ascending: sortOrder === "asc" })
      .range((page - 1) * perPage, page * perPage - 1);

    const { data: orders, count, error } = await query;

    if (error) {
      return { orders: [], total: 0, error: error.message };
    }

    return {
      orders: (orders as unknown as AdminOrder[]) ?? [],
      total: count ?? 0,
      error: null,
    };
  } catch {
    return { orders: [], total: 0, error: "Failed to fetch orders" };
  }
}

export async function getAdminOrderById(orderId: string): Promise<{
  order: AdminOrder | null;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { order: null, error: authError };

  try {
    const supabase = await createAdminClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        profiles (full_name, phone),
        order_items (
          *,
          products (slug, name_key, images, price)
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (error) {
      return { order: null, error: error.message };
    }

    return { order: order as unknown as AdminOrder, error: null };
  } catch {
    return { order: null, error: "Failed to fetch order" };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  const validStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Invalid status" };
  }

  try {
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to update order status" };
  }
}

// ============================================
// CLIENTS
// ============================================

export interface AdminClient {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  email?: string;
  orders_count?: number;
  total_spent?: number;
}

export async function getAdminClients(search?: string): Promise<{
  clients: AdminClient[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { clients: [], error: authError };

  try {
    const supabase = await createAdminClient();

    let query = supabase
      .from("profiles")
      .select("*")
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("full_name", `%${search}%`);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      return { clients: [], error: profilesError.message };
    }

    // Get order counts and totals per user
    const { data: orderStats } = await supabase
      .from("orders")
      .select("user_id, total, status");

    const statsMap = new Map<
      string,
      { orders_count: number; total_spent: number }
    >();

    if (orderStats) {
      for (const order of orderStats as Array<{
        user_id: string;
        total: number;
        status: string;
      }>) {
        const existing = statsMap.get(order.user_id) || {
          orders_count: 0,
          total_spent: 0,
        };
        existing.orders_count += 1;
        if (order.status !== "cancelled") {
          existing.total_spent += Number(order.total);
        }
        statsMap.set(order.user_id, existing);
      }
    }

    const clients = (
      profiles as Array<{
        id: string;
        full_name: string | null;
        phone: string | null;
        role: string;
        created_at: string;
        updated_at: string;
      }>
    ).map((profile) => {
      const stats = statsMap.get(profile.id) || {
        orders_count: 0,
        total_spent: 0,
      };
      return {
        ...profile,
        orders_count: stats.orders_count,
        total_spent: stats.total_spent,
      };
    });

    return { clients, error: null };
  } catch {
    return { clients: [], error: "Failed to fetch clients" };
  }
}

export async function getAdminClientById(clientId: string): Promise<{
  client: AdminClient | null;
  orders: AdminOrder[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { client: null, orders: [], error: authError };

  try {
    const supabase = await createAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", clientId)
      .single();

    if (profileError || !profile) {
      return { client: null, orders: [], error: "Client not found" };
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          products (slug, name_key, images, price)
        )
      `
      )
      .eq("user_id", clientId)
      .order("created_at", { ascending: false });

    if (ordersError) {
      return {
        client: profile as unknown as AdminClient,
        orders: [],
        error: ordersError.message,
      };
    }

    const totalSpent =
      (orders as Array<{ total: number; status: string }>)
        ?.filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

    return {
      client: {
        ...(profile as unknown as AdminClient),
        orders_count: orders?.length ?? 0,
        total_spent: totalSpent,
      },
      orders: (orders as unknown as AdminOrder[]) ?? [],
      error: null,
    };
  } catch {
    return { client: null, orders: [], error: "Failed to fetch client" };
  }
}

// ============================================
// SAMPLE BOOKINGS
// ============================================

export interface AdminSampleBooking {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  business_type: string;
  address: string;
  city: string;
  booking_date: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export async function getAdminSampleBookings(statusFilter?: string): Promise<{
  bookings: AdminSampleBooking[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { bookings: [], error: authError };

  try {
    const supabase = await createAdminClient();

    let query = supabase
      .from("sample_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: bookings, error } = await query;

    if (error) {
      return { bookings: [], error: error.message };
    }

    return {
      bookings: (bookings as unknown as AdminSampleBooking[]) ?? [],
      error: null,
    };
  } catch {
    return { bookings: [], error: "Failed to fetch sample bookings" };
  }
}

export async function updateSampleBookingStatus(
  bookingId: string,
  status: string
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  const validStatuses = ["pending", "confirmed", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Invalid status" };
  }

  try {
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("sample_bookings")
      .update({ status })
      .eq("id", bookingId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/sample-bookings");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to update booking status" };
  }
}
