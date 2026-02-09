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

    return {
      businesses: (businessesWithAgents as unknown as AdminBusiness[]) ?? [],
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
        businesses: AdminAgentBusiness | null;
      }>
    )
      .map((row) => row.businesses)
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
        agents: AdminAgent | null;
      }>
    )
      .map((row) => row.agents)
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
        businesses: AdminAgentBusiness | null;
      }>
    )
      .map((row) => row.businesses)
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
  const escaped = list.map((id) => `'${id}'`).join(",");
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
