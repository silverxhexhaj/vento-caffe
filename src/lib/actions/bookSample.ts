"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface BookSampleInput {
  fullName: string;
  phone: string;
  email?: string;
  businessType: string;
  address: string;
  city: string;
  bookingDate: string; // ISO date string YYYY-MM-DD
}

interface BookSampleResult {
  success: boolean;
  error?: string;
}

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

export async function bookSample(input: BookSampleInput): Promise<BookSampleResult> {
  try {
    // Validate required fields
    if (!input.fullName?.trim()) {
      return { success: false, error: "Full name is required" };
    }
    if (!input.phone?.trim()) {
      return { success: false, error: "Phone number is required" };
    }
    if (!input.businessType?.trim()) {
      return { success: false, error: "Business type is required" };
    }
    if (!input.address?.trim()) {
      return { success: false, error: "Address is required" };
    }
    if (!input.city?.trim()) {
      return { success: false, error: "City is required" };
    }
    if (!input.bookingDate) {
      return { success: false, error: "Booking date is required" };
    }

    // Validate booking date is tomorrow or later (server-side check)
    const bookingDate = new Date(input.bookingDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (bookingDate < tomorrow) {
      return { success: false, error: "Booking date must be tomorrow or later" };
    }

    const supabase = await createUntypedClient();

    const { error } = await supabase
      .from("sample_bookings")
      .insert({
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        business_type: input.businessType,
        address: input.address.trim(),
        city: input.city.trim(),
        booking_date: input.bookingDate,
        status: "pending",
      });

    if (error) {
      console.error("Sample booking error:", error);
      return { success: false, error: "Failed to create booking" };
    }

    return { success: true };
  } catch (error) {
    console.error("Sample booking error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
