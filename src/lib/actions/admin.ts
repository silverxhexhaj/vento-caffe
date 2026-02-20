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

export interface AdminNotificationEnrichedOrder {
  customerName: string;
  customerType: "profile" | "business";
  items: { name_key: string; quantity: number; price_at_purchase: number; is_free: boolean }[];
  total: number;
  status: string;
  order_id: string;
}

export interface AdminNotificationEnrichedSignup {
  businessName: string;
  contactName: string | null;
  business_id: string;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  enriched?: AdminNotificationEnrichedOrder | AdminNotificationEnrichedSignup;
}

export async function getAdminNotifications(input?: {
  page?: number;
  perPage?: number;
  unreadOnly?: boolean;
  type?: "all" | "orders" | "signups";
}): Promise<{
  notifications: AdminNotification[];
  total: number;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { notifications: [], total: 0, error: authError };

  try {
    const page = Math.max(1, input?.page ?? 1);
    const perPage = Math.min(100, Math.max(1, input?.perPage ?? 20));
    const unreadOnly = Boolean(input?.unreadOnly);
    const typeFilter = input?.type ?? "all";
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const supabase = await createAdminClient();
    let query = supabase
      .from("admin_notifications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }
    if (typeFilter === "orders") {
      query = query.eq("type", "new_order");
    } else if (typeFilter === "signups") {
      query = query.eq("type", "new_business_signup");
    }

    const { data, count, error } = await query;
    if (error) {
      return { notifications: [], total: 0, error: error.message };
    }

    const notifications = (data as AdminNotification[]) ?? [];

    // Enrich notifications with order and business details
    const orderIds = notifications
      .filter((n) => n.type === "new_order")
      .map((n) => (n.payload?.order_id as string)?.trim())
      .filter(Boolean) as string[];

    const signupBusinessIds = notifications
      .filter((n) => n.type === "new_business_signup")
      .map((n) => (n.payload?.business_id as string)?.trim())
      .filter(Boolean) as string[];

    const orderMap = new Map<
      string,
      {
        customerName: string;
        customerType: "profile" | "business";
        items: { name_key: string; quantity: number; price_at_purchase: number; is_free: boolean }[];
        total: number;
        status: string;
      }
    >();

    if (orderIds.length > 0) {
      const { data: orders } = await supabase
        .from("orders")
        .select(
          `
          id,
          total,
          status,
          profiles (full_name),
          businesses (name, contact_name),
          order_items (
            quantity,
            price_at_purchase,
            is_free,
            products (name_key)
          )
        `
        )
        .in("id", orderIds);

      type OrderRow = {
        id: string;
        total: number;
        status: string;
        profiles?: { full_name?: string | null } | { full_name?: string | null }[] | null;
        businesses?: { name: string; contact_name: string | null } | Array<{ name: string; contact_name: string | null }> | null;
        order_items?: Array<{
          quantity: number;
          price_at_purchase: number;
          is_free: boolean;
          products?: { name_key?: string } | { name_key?: string }[] | null;
        }>;
      };
      const orderRows = (orders ?? []) as OrderRow[];
      for (const o of orderRows) {
        const profile = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
        const business = Array.isArray(o.businesses) ? o.businesses[0] : o.businesses;
        const customerName =
          business?.name ||
          business?.contact_name ||
          profile?.full_name ||
          "Unknown";
        const customerType = business ? "business" : "profile";
        const items = (o.order_items ?? []).map((item) => {
          const product = Array.isArray(item.products) ? item.products[0] : item.products;
          return {
            name_key: product?.name_key ?? "Unknown",
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase,
            is_free: item.is_free ?? false,
          };
        });
        orderMap.set(o.id, {
          customerName,
          customerType,
          items,
          total: Number(o.total),
          status: o.status,
        });
      }
    }

    const signupMap = new Map<
      string,
      { businessName: string; contactName: string | null }
    >();

    if (signupBusinessIds.length > 0) {
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, name, contact_name")
        .in("id", signupBusinessIds);

      for (const b of (businesses ?? []) as Array<{
        id: string;
        name: string;
        contact_name: string | null;
      }>) {
        signupMap.set(b.id, {
          businessName: b.name,
          contactName: b.contact_name,
        });
      }
    }

    const enrichedNotifications: AdminNotification[] = notifications.map((n) => {
      if (n.type === "new_order") {
        const orderId = n.payload?.order_id as string;
        const enriched = orderMap.get(orderId);
        if (enriched) {
          return {
            ...n,
            enriched: {
              ...enriched,
              order_id: orderId,
            } as AdminNotificationEnrichedOrder,
          };
        }
        return n;
      }
      if (n.type === "new_business_signup") {
        const businessId = n.payload?.business_id as string;
        const enriched = signupMap.get(businessId);
        if (enriched) {
          return {
            ...n,
            enriched: {
              ...enriched,
              business_id: businessId,
            } as AdminNotificationEnrichedSignup,
          };
        }
        return n;
      }
      return n;
    });

    return {
      notifications: enrichedNotifications,
      total: count ?? 0,
      error: null,
    };
  } catch {
    return { notifications: [], total: 0, error: "Failed to fetch notifications" };
  }
}

export async function getAdminUnreadNotificationCount(): Promise<{
  count: number;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { count: 0, error: authError };

  try {
    const supabase = await createAdminClient();
    const { count, error } = await supabase
      .from("admin_notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: count ?? 0, error: null };
  } catch {
    return { count: 0, error: "Failed to fetch unread notification count" };
  }
}

export async function markAdminNotificationRead(
  notificationId: string
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/notifications");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to mark notification as read" };
  }
}

export async function markAllAdminNotificationsRead(): Promise<{
  success: boolean;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/notifications");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to mark all notifications as read" };
  }
}

// ============================================
// DASHBOARD
// ============================================

export interface DashboardStats {
  espressoOrders: number;
  cialdeOrders: number;
  totalRevenue: number;
  activeClients: number;
  recentOrders: AdminOrder[];
}

export interface AdminOrder {
  id: string;
  user_id: string | null;
  business_id: string | null;
  status: string;
  total: number;
  total_override?: number | null;
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
  businesses?: {
    id: string;
    name: string;
    contact_name: string | null;
    address: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
  } | null;
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

    // Get order counts by product type (Espresso = machine, Cialde = cialde)
    const { data: orderItemsData } = await supabase
      .from("order_items")
      .select(`
        order_id,
        products (type),
        orders (status)
      `);

    const espressoOrderIds = new Set<string>();
    const cialdeOrderIds = new Set<string>();
    const items = (orderItemsData ?? []) as unknown as Array<{
      order_id: string;
      products?: { type: string } | null;
      orders?: { status: string } | null;
    }>;
    for (const item of items) {
      if (item.orders?.status === "cancelled") continue;
      const type = item.products?.type;
      if (type === "machine") espressoOrderIds.add(item.order_id);
      if (type === "cialde") cialdeOrderIds.add(item.order_id);
    }

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

    // Get active clients count (distinct users or businesses with at least one non-cancelled order)
    const { data: clientData } = await supabase
      .from("orders")
      .select("user_id, business_id")
      .not("status", "eq", "cancelled");

    const uniqueClients = new Set<string>();
    for (const o of (clientData as Array<{ user_id: string | null; business_id: string | null }>) ?? []) {
      const id = o.user_id ?? o.business_id;
      if (id) uniqueClients.add(id);
    }

    // Get recent orders (last 10)
    const { data: recentOrders } = await supabase
      .from("orders")
      .select(
        `
        *,
        profiles (full_name, phone),
        businesses (id, name, contact_name, phone),
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
        espressoOrders: espressoOrderIds.size,
        cialdeOrders: cialdeOrderIds.size,
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

export interface OrdersChartDataPoint {
  date: string;
  orders: number;
  revenue: number;
}

export async function getOrdersChartData(days: number): Promise<{
  data: OrdersChartDataPoint[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { data: [], error: authError };

  try {
    const supabase = await createAdminClient();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    fromDate.setHours(0, 0, 0, 0);

    const { data: orders, error } = await supabase
      .from("orders")
      .select("created_at, total, status")
      .gte("created_at", fromDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) return { data: [], error: error.message };

    const byDate = new Map<string, { orders: number; revenue: number }>();

    for (let i = 0; i < days; i++) {
      const d = new Date(fromDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDate.set(key, { orders: 0, revenue: 0 });
    }

    for (const order of orders ?? []) {
      const key = (order.created_at as string).slice(0, 10);
      const entry = byDate.get(key) ?? { orders: 0, revenue: 0 };
      entry.orders += 1;
      if ((order.status as string) !== "cancelled") {
        entry.revenue += Number(order.total ?? 0);
      }
      byDate.set(key, entry);
    }

    const data: OrdersChartDataPoint[] = Array.from(byDate.entries())
      .map(([date, { orders: orderCount, revenue }]) => ({
        date,
        orders: orderCount,
        revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { data, error: null };
  } catch {
    return { data: [], error: "Failed to fetch chart data" };
  }
}

// ============================================
// PROJECTIONS
// ============================================

export interface FirstMonthData {
  monthLabel: string;
  year: number;
  month: number;
  revenue: number;
  orders: number;
  espressoOrders: number;
  cialdeOrders: number;
  activeClients: number;
  costOfGoodsSold: number;
}

export async function getFirstMonthData(): Promise<{
  data: FirstMonthData | null;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { data: null, error: authError };

  try {
    const supabase = await createAdminClient();

    const { data: firstOrder, error: firstError } = await supabase
      .from("orders")
      .select("created_at")
      .not("status", "eq", "cancelled")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (firstError || !firstOrder) {
      return { data: null, error: null };
    }

    const firstDate = new Date((firstOrder.created_at as string));
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const monthLabel = startOfMonth.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });

    const { data: ordersInMonth } = await supabase
      .from("orders")
      .select("id, total, total_override, status, user_id, business_id, created_at")
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString());

    const orders = (ordersInMonth ?? []) as Array<{
      id: string;
      total: number;
      total_override?: number | null;
      status: string;
      user_id: string | null;
      business_id: string | null;
    }>;

    const nonCancelled = orders.filter((o) => o.status !== "cancelled");
    const revenue = nonCancelled.reduce((sum, o) => {
      const effectiveTotal =
        o.total_override != null ? o.total_override : o.total;
      return sum + Number(effectiveTotal);
    }, 0);
    const orderIds = new Set(nonCancelled.map((o) => o.id));

    const uniqueClients = new Set<string>();
    for (const o of nonCancelled) {
      const id = o.user_id ?? o.business_id;
      if (id) uniqueClients.add(id);
    }

    const { data: orderItemsData } = await supabase
      .from("order_items")
      .select(`
        order_id,
        quantity,
        products (type, cost_price),
        orders (status)
      `);

    const espressoOrderIds = new Set<string>();
    const cialdeOrderIds = new Set<string>();
    let costOfGoodsSold = 0;
    const items = (orderItemsData ?? []) as unknown as Array<{
      order_id: string;
      quantity: number;
      products?: { type: string; cost_price: number } | null;
      orders?: { status: string } | null;
    }>;
    for (const item of items) {
      if (item.orders?.status === "cancelled") continue;
      if (!orderIds.has(item.order_id)) continue;
      const type = item.products?.type;
      if (type === "machine") espressoOrderIds.add(item.order_id);
      if (type === "cialde") cialdeOrderIds.add(item.order_id);
      const cost = item.products?.cost_price ?? 0;
      costOfGoodsSold += (item.quantity ?? 0) * cost;
    }

    return {
      data: {
        monthLabel,
        year,
        month,
        revenue,
        orders: nonCancelled.length,
        espressoOrders: espressoOrderIds.size,
        cialdeOrders: cialdeOrderIds.size,
        activeClients: uniqueClients.size,
        costOfGoodsSold,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "Failed to fetch first month data" };
  }
}

export interface ProjectionMonth {
  month: string;
  monthIndex: number;
  revenue: number;
  orders: number;
  activeClients: number;
  costOfGoodsSold: number;
}

export type ClientGrowthMode = "compound" | "progressive";

export async function getProjectionData(params: {
  growthRate: number;
  months: number;
  clientGrowthMode?: ClientGrowthMode;
  monthlyNewClients?: number;
}): Promise<{
  data: ProjectionMonth[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { data: [], error: authError };

  const { data: firstMonth, error } = await getFirstMonthData();
  if (error || !firstMonth) {
    return { data: [], error: error ?? "No first month data" };
  }

  const {
    growthRate,
    months,
    clientGrowthMode = "compound",
    monthlyNewClients = 2,
  } = params;
  const baseline = {
    revenue: firstMonth.revenue,
    orders: firstMonth.orders,
    activeClients: firstMonth.activeClients,
  };

  const result: ProjectionMonth[] = [];
  const startDate = new Date(firstMonth.year, firstMonth.month + 1, 1);

  const clientRatio =
    baseline.activeClients > 0 ? 1 / baseline.activeClients : 0;
  const cogsRatio =
    firstMonth.revenue > 0 ? firstMonth.costOfGoodsSold / firstMonth.revenue : 0;

  for (let i = 0; i < months; i++) {
    const factor = Math.pow(1 + growthRate, i);
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    const monthLabel = d.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });

    let activeClients: number;
    if (clientGrowthMode === "progressive") {
      activeClients = Math.round(
        baseline.activeClients + monthlyNewClients * (i + 1)
      );
    } else {
      activeClients = Math.round(baseline.activeClients * factor);
    }

    let orders: number;
    let revenue: number;
    if (clientGrowthMode === "progressive" && clientRatio > 0) {
      const scale = activeClients * clientRatio;
      orders = Math.round(baseline.orders * scale);
      revenue = Math.round(baseline.revenue * scale);
    } else {
      orders = Math.round(baseline.orders * factor);
      revenue = Math.round(baseline.revenue * factor);
    }

    const costOfGoodsSold = Math.round(revenue * cogsRatio);

    result.push({
      month: monthLabel,
      monthIndex: i + 1,
      revenue,
      orders,
      activeClients,
      costOfGoodsSold,
    });
  }

  return { data: result, error: null };
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
        businesses (id, name, contact_name, phone),
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
        businesses (id, name, contact_name, address, city, phone, email),
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

export async function updateOrderTotalOverride(
  orderId: string,
  value: number | null
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  if (value != null && value < 0) {
    return { success: false, error: "Total cannot be negative" };
  }

  try {
    const supabase = await createAdminClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return { success: false, error: orderError?.message ?? "Order not found" };
    }

    const orderStatus = (order as { status: string }).status;
    if (["delivered", "cancelled"].includes(orderStatus)) {
      return {
        success: false,
        error: `Cannot edit order with status: ${orderStatus}`,
      };
    }

    if (value === null) {
      const { data: items } = await supabase
        .from("order_items")
        .select("quantity, price_at_purchase, is_free")
        .eq("order_id", orderId);

      const calculatedTotal = (items ?? []).reduce(
        (sum: number, i: { quantity: number; price_at_purchase: number; is_free: boolean }) =>
          i.is_free ? sum : sum + i.quantity * i.price_at_purchase,
        0
      );

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          total: calculatedTotal,
          total_override: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } else {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          total: value,
          total_override: value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to update order total" };
  }
}

// ============================================
// ORDER ITEMS EDITING
// ============================================

export interface AdminProductOption {
  id: string;
  name_key: string;
  price: number;
  images: string[];
  stock_quantity: number;
  sold_out: boolean;
}

export async function getAllProducts(): Promise<{
  products: AdminProductOption[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { products: [], error: authError };

  try {
    const supabase = await createAdminClient();

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name_key, price, images, stock_quantity, sold_out")
      .order("name_key", { ascending: true });

    if (error) {
      return { products: [], error: error.message };
    }

    return {
      products: (products as AdminProductOption[]) ?? [],
      error: null,
    };
  } catch {
    return { products: [], error: "Failed to fetch products" };
  }
}

export interface SaveOrderItemsInput {
  updates: { itemId: string; quantity: number; price_at_purchase?: number }[];
  adds: { productId: string; quantity: number; price_at_purchase?: number }[];
  removes: string[];
}

export async function saveOrderItems(
  orderId: string,
  input: SaveOrderItemsInput
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, userId, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  try {
    const supabase = await createAdminClient();

    // 1. Fetch order and validate editable
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, total_override")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return { success: false, error: orderError?.message ?? "Order not found" };
    }

    const orderStatus = (order as { status: string }).status;
    if (["delivered", "cancelled"].includes(orderStatus)) {
      return {
        success: false,
        error: `Cannot edit order with status: ${orderStatus}`,
      };
    }

    // 2. Validate quantities and prices
    for (const u of input.updates) {
      if (u.quantity < 1) {
        return { success: false, error: "Quantity must be at least 1" };
      }
      if (u.price_at_purchase !== undefined && u.price_at_purchase < 0) {
        return { success: false, error: "Item price must be 0 or greater" };
      }
    }
    for (const a of input.adds) {
      if (a.quantity < 1) {
        return { success: false, error: "Quantity must be at least 1" };
      }
      if (a.price_at_purchase !== undefined && a.price_at_purchase < 0) {
        return { success: false, error: "Item price must be 0 or greater" };
      }
    }

    // 3. Fetch current order items for stock movement tracking and price preservation
    const { data: currentItems } = await supabase
      .from("order_items")
      .select("id, product_id, quantity, price_at_purchase")
      .eq("order_id", orderId);

    const currentItemsMap = new Map(
      (currentItems ?? []).map((i: { id: string; product_id: string; quantity: number; price_at_purchase: number }) => [i.id, i])
    );

    // 4. Fetch product prices for new/changed items
    const productIds = [
      ...input.adds.map((a) => a.productId),
      ...input.updates.map((u) => {
        const item = currentItemsMap.get(u.itemId);
        return item?.product_id;
      }).filter(Boolean) as string[],
    ];
    const uniqueProductIds = [...new Set(productIds)];

    let productPrices: Map<string, { price: number; stock_quantity: number }> = new Map();
    if (uniqueProductIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, price, stock_quantity")
        .in("id", uniqueProductIds);
      productPrices = new Map(
        (products ?? []).map((p: { id: string; price: number; stock_quantity: number }) => [
          p.id,
          { price: p.price, stock_quantity: p.stock_quantity },
        ])
      );
    }

    // 5. Validate stock for adds and updates
    for (const add of input.adds) {
      const prod = productPrices.get(add.productId);
      if (prod && add.quantity > prod.stock_quantity) {
        return {
          success: false,
          error: `Insufficient stock for selected product (available: ${prod.stock_quantity})`,
        };
      }
    }
    for (const upd of input.updates) {
      const item = currentItemsMap.get(upd.itemId);
      if (item) {
        const prod = productPrices.get(item.product_id);
        const delta = upd.quantity - item.quantity;
        if (delta > 0 && prod && prod.stock_quantity < delta) {
          return {
            success: false,
            error: `Insufficient stock for updated quantity (available: ${prod.stock_quantity})`,
          };
        }
      }
    }

    // 6. Apply updates
    for (const u of input.updates) {
      const item = currentItemsMap.get(u.itemId) as { id: string; product_id: string; quantity: number; price_at_purchase: number } | undefined;
      if (!item) continue;
      const prod = productPrices.get(item.product_id);
      const newPrice = u.price_at_purchase !== undefined
        ? u.price_at_purchase
        : (prod?.price ?? item.price_at_purchase);

      const { error: updateError } = await supabase
        .from("order_items")
        .update({
          quantity: u.quantity,
          price_at_purchase: newPrice,
        })
        .eq("id", u.itemId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Stock movement and product stock update for quantity change
      const qtyDelta = u.quantity - item.quantity;
      if (qtyDelta !== 0) {
        await supabase.from("stock_movements").insert({
          product_id: item.product_id,
          type: qtyDelta > 0 ? "sale" : "return",
          quantity: Math.abs(qtyDelta),
          reference: `Order ${orderId} admin edit`,
          notes: `Admin order edit: quantity ${item.quantity} -> ${u.quantity}`,
          created_by: userId ?? undefined,
        });
        const { data: prodRow } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .single();
        if (prodRow) {
          const newStock = (prodRow as { stock_quantity: number }).stock_quantity - qtyDelta;
          await supabase
            .from("products")
            .update({ stock_quantity: Math.max(0, newStock) })
            .eq("id", item.product_id);
        }
      }
    }

    // 7. Apply removes
    for (const itemId of input.removes) {
      const item = currentItemsMap.get(itemId);
      if (!item) continue;

      const { error: deleteError } = await supabase
        .from("order_items")
        .delete()
        .eq("id", itemId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      // Stock movement and product stock update for return
      await supabase.from("stock_movements").insert({
        product_id: item.product_id,
        type: "return",
        quantity: item.quantity,
        reference: `Order ${orderId} admin edit`,
        notes: `Admin order edit: item removed`,
        created_by: userId ?? undefined,
      });
      const { data: prodReturn } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();
      if (prodReturn) {
        const newStock = (prodReturn as { stock_quantity: number }).stock_quantity + item.quantity;
        await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", item.product_id);
      }
    }

    // 8. Apply adds
    for (const add of input.adds) {
      const prod = productPrices.get(add.productId);
      const price = add.price_at_purchase !== undefined
        ? add.price_at_purchase
        : (prod?.price ?? 0);

      const { error: insertError } = await supabase.from("order_items").insert({
        order_id: orderId,
        product_id: add.productId,
        quantity: add.quantity,
        price_at_purchase: price,
        is_free: false,
      });

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      // Stock movement and product stock update for sale
      await supabase.from("stock_movements").insert({
        product_id: add.productId,
        type: "sale",
        quantity: add.quantity,
        reference: `Order ${orderId} admin edit`,
        notes: `Admin order edit: item added`,
        created_by: userId ?? undefined,
      });
      const { data: prodAdd } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", add.productId)
        .single();
      if (prodAdd) {
        const newStock = (prodAdd as { stock_quantity: number }).stock_quantity - add.quantity;
        await supabase
          .from("products")
          .update({ stock_quantity: Math.max(0, newStock) })
          .eq("id", add.productId);
      }
    }

    // 9. Recalculate and update order total
    const { data: items } = await supabase
      .from("order_items")
      .select("quantity, price_at_purchase, is_free")
      .eq("order_id", orderId);

    const calculatedTotal = (items ?? []).reduce(
      (sum: number, i: { quantity: number; price_at_purchase: number; is_free: boolean }) =>
        i.is_free ? sum : sum + i.quantity * i.price_at_purchase,
      0
    );

    const orderWithOverride = order as { total_override?: number | null };
    const total = orderWithOverride.total_override != null
      ? orderWithOverride.total_override
      : calculatedTotal;

    const { error: totalError } = await supabase
      .from("orders")
      .update({ total, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (totalError) {
      return { success: false, error: totalError.message };
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, error: null };
  } catch (e) {
    console.error("saveOrderItems error:", e);
    return { success: false, error: "Failed to save order items" };
  }
}

// ============================================
// ADMIN CREATE ORDER FOR BUSINESS
// ============================================

export interface CreateAdminOrderInput {
  business_id: string;
  items: { product_id: string; quantity: number }[];
  shipping_address: {
    fullName: string;
    email?: string;
    phone?: string;
    address: string;
    city: string;
    postalCode?: string;
    country?: string;
  };
  notes?: string;
  is_subscription?: boolean;
}

export async function createAdminOrder(
  input: CreateAdminOrderInput
): Promise<{ orderId: string | null; error: string | null }> {
  const { isAdmin, userId, error: authError } = await verifyAdmin();
  if (!isAdmin) return { orderId: null, error: authError };

  if (!input.items.length) {
    return { orderId: null, error: "At least one item is required" };
  }

  try {
    const supabase = await createAdminClient();

    // Validate business exists
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, linked_profile_id")
      .eq("id", input.business_id)
      .single();

    if (businessError || !business) {
      return { orderId: null, error: "Business not found" };
    }

    // Validate products and get prices
    const productIds = input.items.map((i) => i.product_id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, price, stock_quantity")
      .in("id", productIds);

    if (productsError || !products?.length) {
      return { orderId: null, error: "Invalid products" };
    }

    const productMap = new Map(
      (products as Array<{ id: string; price: number; stock_quantity: number }>).map(
        (p) => [p.id, p]
      )
    );

    let total = 0;
    for (const item of input.items) {
      const p = productMap.get(item.product_id);
      if (!p) return { orderId: null, error: `Product not found: ${item.product_id}` };
      if (item.quantity < 1) return { orderId: null, error: "Quantity must be at least 1" };
      if (p.stock_quantity < item.quantity) {
        return {
          orderId: null,
          error: `Insufficient stock for product (available: ${p.stock_quantity})`,
        };
      }
      total += item.quantity * p.price;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: (business as { linked_profile_id: string | null }).linked_profile_id
          ?? null,
        business_id: input.business_id,
        total,
        is_subscription: input.is_subscription ?? false,
        shipping_address: input.shipping_address,
        notes: input.notes ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return { orderId: null, error: orderError?.message ?? "Failed to create order" };
    }

    const orderId = (order as { id: string }).id;

    for (const item of input.items) {
      const p = productMap.get(item.product_id);
      if (!p) continue;

      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: p.price,
        is_free: false,
      });

      if (itemError) {
        await supabase.from("orders").delete().eq("id", orderId);
        return { orderId: null, error: itemError.message };
      }

      // Stock movement
      await supabase.from("stock_movements").insert({
        product_id: item.product_id,
        type: "sale",
        quantity: item.quantity,
        reference: `Order ${orderId} (admin for business)`,
        notes: `Admin created order for business ${input.business_id}`,
        created_by: userId ?? undefined,
      });

      const { data: prodRow } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();
      if (prodRow) {
        const newStock =
          (prodRow as { stock_quantity: number }).stock_quantity - item.quantity;
        await supabase
          .from("products")
          .update({ stock_quantity: Math.max(0, newStock) })
          .eq("id", item.product_id);
      }
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/businesses/${input.business_id}`);
    revalidatePath(`/admin/orders/${orderId}`);
    return { orderId, error: null };
  } catch (e) {
    console.error("createAdminOrder error:", e);
    return { orderId: null, error: "Failed to create order" };
  }
}

export async function getOrdersForBusiness(businessId: string): Promise<{
  orders: AdminOrder[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { orders: [], error: authError };

  try {
    const supabase = await createAdminClient();

    const { data: business } = await supabase
      .from("businesses")
      .select("linked_profile_id")
      .eq("id", businessId)
      .single();

    const linkedProfileId = (business as { linked_profile_id: string | null } | null)
      ?.linked_profile_id ?? null;

    let query = supabase.from("orders").select(
      `
        *,
        profiles (full_name, phone),
        businesses (id, name, contact_name, address, city, phone, email),
        order_items (
          *,
          products (slug, name_key, images, price)
        )
      `
    );

    if (linkedProfileId) {
      query = query.or(
        `business_id.eq.${businessId},user_id.eq.${linkedProfileId}`
      );
    } else {
      query = query.eq("business_id", businessId);
    }

    const { data: orders, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      return { orders: [], error: error.message };
    }

    return {
      orders: (orders as unknown as AdminOrder[]) ?? [],
      error: null,
    };
  } catch {
    return { orders: [], error: "Failed to fetch orders" };
  }
}

export async function getBusinessIdByLinkedProfile(userId: string): Promise<{
  businessId: string | null;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { businessId: null, error: authError };

  try {
    const supabase = await createAdminClient();
    const { data: business, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("linked_profile_id", userId)
      .limit(1)
      .maybeSingle();

    if (error) return { businessId: null, error: error.message };
    return { businessId: (business as { id: string } | null)?.id ?? null, error: null };
  } catch {
    return { businessId: null, error: "Failed to find business" };
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

// ============================================
// BUSINESSES (CRM)
// ============================================

export interface AdminBusiness {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  business_type: string | null;
  address: string | null;
  city: string | null;
  website: string | null;
  pipeline_stage: string;
  source: string;
  tags: string[];
  notes: string | null;
  linked_profile_id: string | null;
  linked_booking_id: string | null;
  created_at: string;
  updated_at: string;
  agents?: { id: string; full_name: string }[];
  profiles?: {
    full_name: string | null;
    phone: string | null;
    role: string;
    created_at: string;
  } | null;
  sample_bookings?: {
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
  } | null;
  orders_count?: number;
  orders_preview?: {
    id: string;
    created_at: string;
    status: string;
    items: { product_name: string; quantity: number }[];
  }[];
}

export interface AdminBusinessActivity {
  id: string;
  business_id: string;
  type: string;
  description: string;
  created_at: string;
}

export interface BusinessFilters {
  stage?: string;
  businessType?: string;
  source?: string;
  agentId?: string;
  tag?: string;
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const businessStageOptions = [
  "lead",
  "contacted",
  "sample_sent",
  "negotiating",
  "active_client",
  "churned",
];

export async function getAdminBusinesses(filters: BusinessFilters = {}): Promise<{
  businesses: AdminBusiness[];
  total: number;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { businesses: [], total: 0, error: authError };

  try {
    const supabase = await createAdminClient();
    const {
      stage,
      businessType,
      source,
      agentId,
      tag,
      search,
      page = 1,
      perPage = 20,
      sortBy = "created_at",
      sortOrder = "desc",
    } = filters;

    let query = supabase.from("businesses").select(
      `
        *,
        business_agents (
          agents (
            id,
            full_name
          )
        )
      `,
      { count: "exact" }
    );

    if (stage && stage !== "all") {
      query = query.eq("pipeline_stage", stage);
    }

    if (businessType && businessType !== "all") {
      query = query.eq("business_type", businessType);
    }

    if (source && source !== "all") {
      query = query.eq("source", source);
    }

    if (agentId && agentId !== "all") {
      const { data: agentBusinesses } = await supabase
        .from("business_agents")
        .select("business_id")
        .eq("agent_id", agentId);
      const businessIds = (agentBusinesses ?? []).map(
        (row: { business_id: string }) => row.business_id
      );
      query = query.in("id", businessIds.length > 0 ? businessIds : ["__none__"]);
    }

    if (tag && tag !== "all") {
      query = query.contains("tags", [tag]);
    }

    if (search) {
      const safeSearch = search.replace(/,/g, " ");
      query = query.or(
        `name.ilike.%${safeSearch}%,contact_name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`
      );
    }

    const validSortColumns = ["created_at", "updated_at", "name", "pipeline_stage"];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "created_at";

    query = query
      .order(sortColumn, { ascending: sortOrder === "asc" })
      .range((page - 1) * perPage, page * perPage - 1);

    const { data: businesses, count, error } = await query;
    if (error) {
      return { businesses: [], total: 0, error: error.message };
    }

    const businessesWithAgents = (businesses ?? []).map((business) => {
      const agentAssignments = (business as {
        business_agents?: Array<{ agents: { id: string; full_name: string } | null }>;
      }).business_agents ?? [];
      const agents = agentAssignments
        .map((assignment) => assignment.agents)
        .filter(
          (agent): agent is { id: string; full_name: string } => Boolean(agent)
        );
      const { business_agents: _businessAgents, ...rest } = business;
      return { ...rest, agents };
    });

    const businessIds = businessesWithAgents.map((b) => b.id);
    const linkedProfileIds = [...new Set(
      businessesWithAgents
        .map((b) => b.linked_profile_id)
        .filter((id): id is string => Boolean(id))
    )];

    const countByBusinessId = new Map<string, number>();
    const countByUserId = new Map<string, number>();

    if (businessIds.length > 0) {
      const { data: ordersByBusiness } = await supabase
        .from("orders")
        .select("business_id")
        .in("business_id", businessIds);
      for (const row of (ordersByBusiness ?? []) as { business_id: string }[]) {
        if (row.business_id) {
          countByBusinessId.set(
            row.business_id,
            (countByBusinessId.get(row.business_id) ?? 0) + 1
          );
        }
      }
    }

    if (linkedProfileIds.length > 0) {
      const { data: ordersByUser } = await supabase
        .from("orders")
        .select("user_id, business_id")
        .in("user_id", linkedProfileIds);
      for (const row of (ordersByUser ?? []) as { user_id: string; business_id: string | null }[]) {
        if (row.user_id && (!row.business_id || !businessIds.includes(row.business_id))) {
          countByUserId.set(
            row.user_id,
            (countByUserId.get(row.user_id) ?? 0) + 1
          );
        }
      }
    }

    const businessesWithCounts = businessesWithAgents.map((b) => {
      const byBusiness = countByBusinessId.get(b.id) ?? 0;
      const byUser = b.linked_profile_id
        ? countByUserId.get(b.linked_profile_id) ?? 0
        : 0;
      return { ...b, orders_count: byBusiness + byUser };
    });

    const linkedProfileToBusiness = new Map<string, string>();
    for (const b of businessesWithCounts) {
      if (b.linked_profile_id) {
        linkedProfileToBusiness.set(b.linked_profile_id, b.id);
      }
    }

    const PREVIEW_ORDERS_PER_BUSINESS = 5;
    const PREVIEW_ITEMS_PER_ORDER = 5;

    type OrderRow = {
      id: string;
      business_id: string | null;
      user_id: string | null;
      created_at: string;
      status: string;
      order_items?: Array<{
        quantity: number;
        products?: { slug: string; name_key: string } | { slug: string; name_key: string }[] | null;
      }>;
    };
    const ordersForPreview: OrderRow[] = [];

    if (businessIds.length > 0 || linkedProfileIds.length > 0) {
      const orParts: string[] = [];
      if (businessIds.length > 0) {
        orParts.push(`business_id.in.(${businessIds.join(",")})`);
      }
      if (linkedProfileIds.length > 0) {
        orParts.push(`user_id.in.(${linkedProfileIds.join(",")})`);
      }
      const { data: ordersData } = await supabase
        .from("orders")
        .select(
          `
          id,
          business_id,
          user_id,
          created_at,
          status,
          order_items (
            quantity,
            products (slug, name_key)
          )
        `
        )
        .or(orParts.join(","))
        .order("created_at", { ascending: false })
        .limit(100);

      if (ordersData) {
        ordersForPreview.push(
          ...(ordersData as unknown as typeof ordersForPreview)
        );
      }
    }

    const previewByBusinessId = new Map<
      string,
      {
        id: string;
        created_at: string;
        status: string;
        items: { product_name: string; quantity: number }[];
      }[]
    >();

    const formatProductName = (slug: string | undefined, nameKey: string | undefined): string => {
      if (slug) {
        return slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
      if (nameKey) {
        const parts = nameKey.split(".");
        return parts[parts.length - 1] || nameKey;
      }
      return "Product";
    };

    for (const order of ordersForPreview) {
      const businessId =
        order.business_id && businessIds.includes(order.business_id)
          ? order.business_id
          : order.user_id
            ? linkedProfileToBusiness.get(order.user_id) ?? null
            : null;
      if (!businessId) continue;

      const existing = previewByBusinessId.get(businessId) ?? [];
      if (existing.length >= PREVIEW_ORDERS_PER_BUSINESS) continue;

      const items = (order.order_items ?? [])
        .slice(0, PREVIEW_ITEMS_PER_ORDER)
        .map((oi) => {
          const p = oi.products;
          const slug = Array.isArray(p) ? p[0]?.slug : p?.slug;
          const nameKey = Array.isArray(p) ? p[0]?.name_key : p?.name_key;
          return {
            product_name: formatProductName(slug, nameKey),
            quantity: oi.quantity,
          };
        });

      existing.push({
        id: order.id,
        created_at: order.created_at,
        status: order.status,
        items,
      });
      previewByBusinessId.set(businessId, existing);
    }

    const businessesWithPreview = businessesWithCounts.map((b) => ({
      ...b,
      orders_preview: previewByBusinessId.get(b.id) ?? [],
    }));

    return {
      businesses: (businessesWithPreview as unknown as AdminBusiness[]) ?? [],
      total: count ?? 0,
      error: null,
    };
  } catch {
    return { businesses: [], total: 0, error: "Failed to fetch businesses" };
  }
}

export async function getAdminBusinessStats(): Promise<{
  total: number;
  leadsThisMonth: number;
  activeClients: number;
  conversionRate: number;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) {
    return {
      total: 0,
      leadsThisMonth: 0,
      activeClients: 0,
      conversionRate: 0,
      error: authError,
    };
  }

  try {
    const supabase = await createAdminClient();
    const { count: total } = await supabase
      .from("businesses")
      .select("*", { count: "exact", head: true });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: leadsThisMonth } = await supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString());

    const { count: activeClients } = await supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("pipeline_stage", "active_client");

    const totalCount = total ?? 0;
    const activeCount = activeClients ?? 0;
    const conversionRate = totalCount ? (activeCount / totalCount) * 100 : 0;

    return {
      total: totalCount,
      leadsThisMonth: leadsThisMonth ?? 0,
      activeClients: activeCount,
      conversionRate,
      error: null,
    };
  } catch {
    return {
      total: 0,
      leadsThisMonth: 0,
      activeClients: 0,
      conversionRate: 0,
      error: "Failed to fetch business stats",
    };
  }
}

export async function getAdminBusinessById(businessId: string): Promise<{
  business: AdminBusiness | null;
  activities: AdminBusinessActivity[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { business: null, activities: [], error: authError };

  try {
    const supabase = await createAdminClient();
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select(
        `
        *,
        profiles (full_name, phone, role, created_at),
        sample_bookings (*)
      `
      )
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return { business: null, activities: [], error: "Business not found" };
    }

    const { data: activities, error: activitiesError } = await supabase
      .from("business_activities")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (activitiesError) {
      return {
        business: business as unknown as AdminBusiness,
        activities: [],
        error: activitiesError.message,
      };
    }

    return {
      business: business as unknown as AdminBusiness,
      activities: (activities as unknown as AdminBusinessActivity[]) ?? [],
      error: null,
    };
  } catch {
    return { business: null, activities: [], error: "Failed to fetch business" };
  }
}

export async function createBusiness(
  data: Omit<
    AdminBusiness,
    "id" | "created_at" | "updated_at" | "profiles" | "sample_bookings"
  >
): Promise<{ business: AdminBusiness | null; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { business: null, error: authError };

  try {
    const supabase = await createAdminClient();
    const { data: business, error } = await supabase
      .from("businesses")
      .insert(data)
      .select("*")
      .single();

    if (error) {
      return { business: null, error: error.message };
    }

    revalidatePath("/admin/businesses");
    return { business: business as unknown as AdminBusiness, error: null };
  } catch {
    return { business: null, error: "Failed to create business" };
  }
}

export async function updateBusiness(
  businessId: string,
  data: Partial<
    Omit<
      AdminBusiness,
      "id" | "created_at" | "updated_at" | "profiles" | "sample_bookings"
    >
  >
): Promise<{ business: AdminBusiness | null; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { business: null, error: authError };

  try {
    const supabase = await createAdminClient();
    const { data: business, error } = await supabase
      .from("businesses")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", businessId)
      .select("*")
      .single();

    if (error) {
      return { business: null, error: error.message };
    }

    revalidatePath("/admin/businesses");
    revalidatePath(`/admin/businesses/${businessId}`);
    return { business: business as unknown as AdminBusiness, error: null };
  } catch {
    return { business: null, error: "Failed to update business" };
  }
}

export async function updateBusinessStage(
  businessId: string,
  stage: string
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  if (!businessStageOptions.includes(stage)) {
    return { success: false, error: "Invalid stage" };
  }

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("businesses")
      .update({ pipeline_stage: stage, updated_at: new Date().toISOString() })
      .eq("id", businessId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/businesses");
    revalidatePath(`/admin/businesses/${businessId}`);
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to update stage" };
  }
}

export async function deleteBusiness(
  businessId: string
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", businessId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/businesses");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to delete business" };
  }
}

export async function addBusinessActivity(
  businessId: string,
  type: string,
  description: string
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.from("business_activities").insert({
      business_id: businessId,
      type,
      description,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/admin/businesses/${businessId}`);
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to add activity" };
  }
}

// ============================================
// AGENTS
// ============================================

export interface AdminAgent {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role_title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_count?: number;
}

export interface AdminAgentBusiness {
  id: string;
  name: string;
  pipeline_stage: string;
  city: string | null;
  business_type: string | null;
}

export async function getAgents(search?: string): Promise<{
  agents: AdminAgent[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { agents: [], error: authError };

  try {
    const supabase = await createAdminClient();

    let query = supabase.from("agents").select("*").order("created_at", {
      ascending: false,
    });

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data: agents, error } = await query;
    if (error) {
      return { agents: [], error: error.message };
    }

    const { data: assignments } = await supabase
      .from("business_agents")
      .select("agent_id");

    const assignmentCounts = new Map<string, number>();
    if (assignments) {
      for (const row of assignments as Array<{ agent_id: string }>) {
        assignmentCounts.set(
          row.agent_id,
          (assignmentCounts.get(row.agent_id) ?? 0) + 1
        );
      }
    }

    const agentsWithCounts = (agents as AdminAgent[]).map((agent) => ({
      ...agent,
      assigned_count: assignmentCounts.get(agent.id) ?? 0,
    }));

    return { agents: agentsWithCounts, error: null };
  } catch {
    return { agents: [], error: "Failed to fetch agents" };
  }
}

export async function getAgentById(agentId: string): Promise<{
  agent: AdminAgent | null;
  businesses: AdminAgentBusiness[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { agent: null, businesses: [], error: authError };

  try {
    const supabase = await createAdminClient();
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      return { agent: null, businesses: [], error: "Agent not found" };
    }

    const { data: assignments, error: assignmentsError } = await supabase
      .from("business_agents")
      .select(
        `
        business_id,
        businesses (
          id,
          name,
          pipeline_stage,
          city,
          business_type
        )
      `
      )
      .eq("agent_id", agentId)
      .order("assigned_at", { ascending: false });

    if (assignmentsError) {
      return {
        agent: agent as AdminAgent,
        businesses: [],
        error: assignmentsError.message,
      };
    }

    const businesses = (
      assignments as Array<{
        businesses: AdminAgentBusiness | AdminAgentBusiness[] | null;
      }>
    )
      .flatMap((row) => {
        if (!row.businesses) {
          return [];
        }
        return Array.isArray(row.businesses) ? row.businesses : [row.businesses];
      })
      .filter((business): business is AdminAgentBusiness => Boolean(business));

    return {
      agent: agent as AdminAgent,
      businesses,
      error: null,
    };
  } catch {
    return { agent: null, businesses: [], error: "Failed to fetch agent" };
  }
}

export async function createAgent(
  data: Omit<AdminAgent, "id" | "created_at" | "updated_at" | "assigned_count">
): Promise<{ agent: AdminAgent | null; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { agent: null, error: authError };

  try {
    const supabase = await createAdminClient();
    const { data: agent, error } = await supabase
      .from("agents")
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        role_title: data.role_title,
        notes: data.notes,
      })
      .select("*")
      .single();

    if (error || !agent) {
      return { agent: null, error: error?.message ?? "Failed to create agent" };
    }

    revalidatePath("/admin/agents");
    return { agent: agent as AdminAgent, error: null };
  } catch {
    return { agent: null, error: "Failed to create agent" };
  }
}

export async function updateAgent(
  agentId: string,
  data: Partial<
    Omit<AdminAgent, "id" | "created_at" | "updated_at" | "assigned_count">
  >
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("agents")
      .update({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        role_title: data.role_title,
        notes: data.notes,
      })
      .eq("id", agentId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/agents");
    revalidatePath(`/admin/agents/${agentId}`);
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to update agent" };
  }
}

export async function deleteAgent(agentId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.from("agents").delete().eq("id", agentId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/agents");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to delete agent" };
  }
}

export async function getBusinessAgents(businessId: string): Promise<{
  agents: AdminAgent[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { agents: [], error: authError };

  try {
    const supabase = await createAdminClient();
    const { data: assignments, error } = await supabase
      .from("business_agents")
      .select(
        `
        agent_id,
        agents (
          id,
          full_name,
          email,
          phone,
          role_title,
          notes,
          created_at,
          updated_at
        )
      `
      )
      .eq("business_id", businessId)
      .order("assigned_at", { ascending: false });

    if (error) {
      return { agents: [], error: error.message };
    }

    const agents = (
      assignments as Array<{
        agents: AdminAgent | AdminAgent[] | null;
      }>
    )
      .flatMap((row) => {
        if (!row.agents) {
          return [];
        }
        return Array.isArray(row.agents) ? row.agents : [row.agents];
      })
      .filter((agent): agent is AdminAgent => Boolean(agent));

    return { agents, error: null };
  } catch {
    return { agents: [], error: "Failed to fetch business agents" };
  }
}

export async function getAgentBusinesses(agentId: string): Promise<{
  businesses: AdminAgentBusiness[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { businesses: [], error: authError };

  try {
    const supabase = await createAdminClient();
    const { data: assignments, error } = await supabase
      .from("business_agents")
      .select(
        `
        business_id,
        businesses (
          id,
          name,
          pipeline_stage,
          city,
          business_type
        )
      `
      )
      .eq("agent_id", agentId)
      .order("assigned_at", { ascending: false });

    if (error) {
      return { businesses: [], error: error.message };
    }

    const businesses = (
      assignments as Array<{
        businesses: AdminAgentBusiness | AdminAgentBusiness[] | null;
      }>
    )
      .flatMap((row) => {
        if (!row.businesses) {
          return [];
        }
        return Array.isArray(row.businesses) ? row.businesses : [row.businesses];
      })
      .filter((business): business is AdminAgentBusiness => Boolean(business));

    return { businesses, error: null };
  } catch {
    return { businesses: [], error: "Failed to fetch agent businesses" };
  }
}

export async function assignAgentToBusiness(
  businessId: string,
  agentId: string
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.from("business_agents").insert({
      business_id: businessId,
      agent_id: agentId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/admin/businesses/${businessId}`);
    revalidatePath(`/admin/agents/${agentId}`);
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to assign agent" };
  }
}

export async function unassignAgentFromBusiness(
  businessId: string,
  agentId: string
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("business_agents")
      .delete()
      .eq("business_id", businessId)
      .eq("agent_id", agentId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/admin/businesses/${businessId}`);
    revalidatePath(`/admin/agents/${agentId}`);
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to unassign agent" };
  }
}

function buildInFilter(list: string[]) {
  if (!list.length) {
    return null;
  }
  const escaped = list
    .map((id) => id.replace(/['"]/g, "").trim())
    .filter(Boolean)
    .join(",");
  if (!escaped.length) {
    return null;
  }
  return `(${escaped})`;
}

export async function getUnlinkedSampleBookings(): Promise<{
  bookings: AdminSampleBooking[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { bookings: [], error: authError };

  try {
    const supabase = await createAdminClient();
    const { data: linked } = await supabase
      .from("businesses")
      .select("linked_booking_id")
      .not("linked_booking_id", "is", null);

    const linkedIds = (linked as Array<{ linked_booking_id: string | null }>)
      ?.map((row) => row.linked_booking_id)
      .filter((id): id is string => Boolean(id)) ?? [];

    let query = supabase
      .from("sample_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    const inFilter = buildInFilter(linkedIds);
    if (inFilter) {
      query = query.not("id", "in", inFilter);
    }

    const { data: bookings, error } = await query;
    if (error) {
      return { bookings: [], error: error.message };
    }

    return { bookings: (bookings as AdminSampleBooking[]) ?? [], error: null };
  } catch {
    return { bookings: [], error: "Failed to fetch sample bookings" };
  }
}

export async function getUnlinkedProfiles(): Promise<{
  profiles: AdminClient[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { profiles: [], error: authError };

  try {
    const supabase = await createAdminClient();
    const { data: linked } = await supabase
      .from("businesses")
      .select("linked_profile_id")
      .not("linked_profile_id", "is", null);

    const linkedIds = (linked as Array<{ linked_profile_id: string | null }>)
      ?.map((row) => row.linked_profile_id)
      .filter((id): id is string => Boolean(id)) ?? [];

    let query = supabase
      .from("profiles")
      .select("*")
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    const inFilter = buildInFilter(linkedIds);
    if (inFilter) {
      query = query.not("id", "in", inFilter);
    }

    const { data: profiles, error } = await query;
    if (error) {
      return { profiles: [], error: error.message };
    }

    return { profiles: (profiles as AdminClient[]) ?? [], error: null };
  } catch {
    return { profiles: [], error: "Failed to fetch profiles" };
  }
}

export async function autoLinkProfiles(): Promise<{
  created: number;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { created: 0, error: authError };

  try {
    const { profiles, error } = await getUnlinkedProfiles();
    if (error) {
      return { created: 0, error };
    }

    if (!profiles.length) {
      return { created: 0, error: null };
    }

    const supabase = await createAdminClient();
    const inserts = profiles.map((profile) => ({
      name: profile.full_name || "New signup",
      contact_name: profile.full_name,
      phone: profile.phone,
      pipeline_stage: "lead",
      source: "signup",
      linked_profile_id: profile.id,
      tags: [],
    }));

    const { error: insertError } = await supabase.from("businesses").insert(inserts);
    if (insertError) {
      return { created: 0, error: insertError.message };
    }

    revalidatePath("/admin/businesses");
    return { created: inserts.length, error: null };
  } catch {
    return { created: 0, error: "Failed to import signups" };
  }
}

export async function autoLinkSampleBookings(): Promise<{
  created: number;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { created: 0, error: authError };

  try {
    const { bookings, error } = await getUnlinkedSampleBookings();
    if (error) {
      return { created: 0, error };
    }

    if (!bookings.length) {
      return { created: 0, error: null };
    }

    const supabase = await createAdminClient();
    const inserts = bookings.map((booking) => ({
      name: booking.full_name,
      contact_name: booking.full_name,
      email: booking.email,
      phone: booking.phone,
      business_type: booking.business_type,
      address: booking.address,
      city: booking.city,
      pipeline_stage: "sample_sent",
      source: "sample_booking",
      linked_booking_id: booking.id,
      notes: booking.notes,
      tags: [],
    }));

    const { error: insertError } = await supabase.from("businesses").insert(inserts);
    if (insertError) {
      return { created: 0, error: insertError.message };
    }

    revalidatePath("/admin/businesses");
    return { created: inserts.length, error: null };
  } catch {
    return { created: 0, error: "Failed to auto-link sample bookings" };
  }
}

export async function convertSampleBookingToBusiness(
  bookingId: string
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  try {
    const supabase = await createAdminClient();
    const { data: booking, error: bookingError } = await supabase
      .from("sample_bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return { success: false, error: "Sample booking not found" };
    }

    const { error: insertError } = await supabase.from("businesses").insert({
      name: booking.full_name,
      contact_name: booking.full_name,
      email: booking.email,
      phone: booking.phone,
      business_type: booking.business_type,
      address: booking.address,
      city: booking.city,
      pipeline_stage: "sample_sent",
      source: "sample_booking",
      linked_booking_id: booking.id,
      notes: booking.notes,
      tags: [],
    });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    revalidatePath("/admin/businesses");
    revalidatePath("/admin/sample-bookings");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to convert booking" };
  }
}

// ============================================
// PRODUCTS
// ============================================

export interface AdminProduct {
  id: string;
  slug: string;
  name_key: string;
  description_key: string;
  contents_key: string | null;
  highlights_key: string | null;
  price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  sold_out: boolean;
  featured: boolean;
  status: "draft" | "published";
  display_order: number;
  type: "cialde" | "machine";
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: "purchase" | "sale" | "adjustment" | "return";
  quantity: number;
  reference?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface ProductPayload {
  slug: string;
  name_key: string;
  description_key: string;
  contents_key?: string | null;
  highlights_key?: string | null;
  price: number;
  cost_price?: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  sold_out: boolean;
  featured: boolean;
  status?: "draft" | "published";
  display_order?: number;
  type: "cialde" | "machine";
  images: string[];
}

export async function getAdminProducts(): Promise<{
  products: AdminProduct[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { products: [], error: authError };

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return { products: [], error: error.message };
    }

    return { products: (data as AdminProduct[]) ?? [], error: null };
  } catch {
    return { products: [], error: "Failed to fetch products" };
  }
}

export async function getAdminProductById(
  id: string
): Promise<{ product: AdminProduct | null; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { product: null, error: authError };

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { product: null, error: error.message };
    }

    return { product: data as AdminProduct, error: null };
  } catch {
    return { product: null, error: "Failed to fetch product" };
  }
}

export async function createProduct(
  payload: ProductPayload
): Promise<{ product: AdminProduct | null; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { product: null, error: authError };

  try {
    const supabase = await createAdminClient();
    let nextDisplayOrder = payload.display_order;

    // Check if slug already exists
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("slug", payload.slug)
      .single();

    if (existing) {
      return { product: null, error: "A product with this slug already exists" };
    }

    if (nextDisplayOrder == null) {
      const { data: lastOrderedProduct } = await supabase
        .from("products")
        .select("display_order")
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      nextDisplayOrder = ((lastOrderedProduct as { display_order: number } | null)?.display_order ?? 0) + 1;
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        slug: payload.slug,
        name_key: payload.name_key,
        description_key: payload.description_key,
        contents_key: payload.contents_key || null,
        highlights_key: payload.highlights_key || null,
        price: payload.price,
        cost_price: payload.cost_price ?? 0,
        stock_quantity: payload.stock_quantity ?? 0,
        low_stock_threshold: payload.low_stock_threshold ?? 5,
        sold_out: payload.sold_out,
        featured: payload.featured,
        status: payload.status ?? "draft",
        display_order: Math.max(1, Math.floor(nextDisplayOrder)),
        type: payload.type,
        images: payload.images,
      })
      .select()
      .single();

    if (error) {
      return { product: null, error: error.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");

    return { product: data as AdminProduct, error: null };
  } catch {
    return { product: null, error: "Failed to create product" };
  }
}

export async function updateProduct(
  id: string,
  payload: Partial<ProductPayload>
): Promise<{ product: AdminProduct | null; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { product: null, error: authError };

  try {
    const supabase = await createAdminClient();
    const normalizedPayload: Partial<ProductPayload> = { ...payload };

    // If slug is being updated, check if it already exists
    if (normalizedPayload.slug) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("slug", normalizedPayload.slug)
        .neq("id", id)
        .single();

      if (existing) {
        return { product: null, error: "A product with this slug already exists" };
      }
    }

    if (normalizedPayload.display_order !== undefined) {
      normalizedPayload.display_order = Math.max(
        1,
        Math.floor(normalizedPayload.display_order)
      );
    }

    const { data, error } = await supabase
      .from("products")
      .update(normalizedPayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { product: null, error: error.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");

    return { product: data as AdminProduct, error: null };
  } catch {
    return { product: null, error: "Failed to update product" };
  }
}

export async function deleteProduct(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  try {
    const supabase = await createAdminClient();

    // Get product to check for images to delete
    const { data: product } = await supabase
      .from("products")
      .select("images")
      .eq("id", id)
      .single();

    // Delete the product
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Delete associated images from storage if they exist
    if (product?.images && product.images.length > 0) {
      const imagePaths = product.images
        .filter((url: string) => url.includes("product-images"))
        .map((url: string) => {
          // Extract the path after product-images/
          const match = url.match(/product-images\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      if (imagePaths.length > 0) {
        await supabase.storage.from("product-images").remove(imagePaths as string[]);
      }
    }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");

    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to delete product" };
  }
}

export async function uploadProductImage(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { url: null, error: authError };

  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { url: null, error: "No file provided" };
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return { url: null, error: "Invalid file type. Please upload a JPEG, PNG, or WebP image." };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { url: null, error: "File size exceeds 5MB limit." };
    }

    const supabase = await createAdminClient();

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return { url: null, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl, error: null };
  } catch {
    return { url: null, error: "Failed to upload image" };
  }
}

// ============================================
// INVENTORY / STOCK MANAGEMENT
// ============================================

export async function getStockMovements(productId?: string): Promise<{
  movements: StockMovement[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { movements: [], error: authError };

  try {
    const supabase = await createAdminClient();
    let query = supabase
      .from("stock_movements")
      .select("*")
      .order("created_at", { ascending: false });

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;

    if (error) {
      return { movements: [], error: error.message };
    }

    return { movements: (data as StockMovement[]) ?? [], error: null };
  } catch {
    return { movements: [], error: "Failed to fetch stock movements" };
  }
}

export async function addStockMovement(payload: {
  product_id: string;
  type: "purchase" | "sale" | "adjustment" | "return";
  quantity: number;
  reference?: string;
  notes?: string;
}): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  if (payload.quantity === 0) {
    return { success: false, error: "Quantity cannot be zero" };
  }

  try {
    const supabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get current stock
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", payload.product_id)
      .single();

    if (productError || !product) {
      return { success: false, error: "Product not found" };
    }

    let adjustment: number;
    if (payload.type === "adjustment") {
      adjustment = payload.quantity;
    } else if (["purchase", "return"].includes(payload.type)) {
      if (payload.quantity < 0) {
        return { success: false, error: "Purchase and return must have positive quantity" };
      }
      adjustment = payload.quantity;
    } else {
      if (payload.quantity < 0) {
        return { success: false, error: "Sale must have positive quantity" };
      }
      adjustment = -payload.quantity;
    }
    const newStock = product.stock_quantity + adjustment;

    if (newStock < 0) {
      return {
        success: false,
        error: `Insufficient stock. Current: ${product.stock_quantity}, requested: ${payload.quantity}`,
      };
    }

    // Insert movement record
    const { error: movementError } = await supabase.from("stock_movements").insert({
      product_id: payload.product_id,
      type: payload.type,
      quantity: payload.quantity,
      reference: payload.reference ?? null,
      notes: payload.notes ?? null,
      created_by: user?.id ?? null,
    });

    if (movementError) {
      return { success: false, error: movementError.message };
    }

    // Update product stock quantity
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_quantity: newStock })
      .eq("id", payload.product_id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${payload.product_id}`);
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to add stock movement" };
  }
}

export async function updateProductPricing(
  productId: string,
  pricing: {
    price: number;
    cost_price: number;
    low_stock_threshold: number;
  }
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("products")
      .update(pricing)
      .eq("id", productId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to update pricing" };
  }
}

export async function deleteProductImage(
  imageUrl: string
): Promise<{ success: boolean; error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: authError };

  try {
    // Only delete if it's from our storage
    if (!imageUrl.includes("product-images")) {
      return { success: true, error: null };
    }

    // Extract the path from the URL
    const match = imageUrl.match(/product-images\/(.+)$/);
    if (!match) {
      return { success: false, error: "Invalid image URL" };
    }

    const path = match[1];
    const supabase = await createAdminClient();

    const { error } = await supabase.storage.from("product-images").remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to delete image" };
  }
}
