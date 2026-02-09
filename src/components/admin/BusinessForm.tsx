"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  createBusiness,
  updateBusiness,
  type AdminBusiness,
  type AdminClient,
  type AdminSampleBooking,
} from "@/lib/actions/admin";
import TagInput from "./TagInput";

const stageOptions = [
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "sample_sent", label: "Sample Sent" },
  { value: "negotiating", label: "Negotiating" },
  { value: "active_client", label: "Active Client" },
  { value: "churned", label: "Churned" },
];

const sourceOptions = [
  { value: "manual", label: "Manual" },
  { value: "sample_booking", label: "Sample Booking" },
  { value: "signup", label: "Signup" },
  { value: "referral", label: "Referral" },
];

interface BusinessFormProps {
  business?: AdminBusiness | null;
  profiles: AdminClient[];
  bookings: AdminSampleBooking[];
}

export default function BusinessForm({
  business,
  profiles,
  bookings,
}: BusinessFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    name: business?.name || "",
    contact_name: business?.contact_name || "",
    email: business?.email || "",
    phone: business?.phone || "",
    business_type: business?.business_type || "",
    address: business?.address || "",
    city: business?.city || "",
    website: business?.website || "",
    pipeline_stage: business?.pipeline_stage || "lead",
    source: business?.source || "manual",
    tags: business?.tags || [],
    notes: business?.notes || "",
    linked_profile_id: business?.linked_profile_id || "",
    linked_booking_id: business?.linked_booking_id || "",
  });

  const updateField = (field: string, value: string | string[]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formState.name.trim()) {
      setError("Business name is required.");
      return;
    }

    const payload = {
      name: formState.name.trim(),
      contact_name: formState.contact_name || null,
      email: formState.email || null,
      phone: formState.phone || null,
      business_type: formState.business_type || null,
      address: formState.address || null,
      city: formState.city || null,
      website: formState.website || null,
      pipeline_stage: formState.pipeline_stage,
      source: formState.source,
      tags: formState.tags,
      notes: formState.notes || null,
      linked_profile_id: formState.linked_profile_id || null,
      linked_booking_id: formState.linked_booking_id || null,
    };

    startTransition(async () => {
      if (business?.id) {
        const result = await updateBusiness(business.id, payload);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.refresh();
        return;
      }

      const result = await createBusiness(payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.business?.id) {
        router.push(`/${locale}/admin/businesses/${result.business.id}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-neutral-500">
            Business name
          </label>
          <input
            value={formState.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">
            Contact name
          </label>
          <input
            value={formState.contact_name}
            onChange={(event) => updateField("contact_name", event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Email</label>
          <input
            value={formState.email}
            onChange={(event) => updateField("email", event.target.value)}
            type="email"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Phone</label>
          <input
            value={formState.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">
            Business type
          </label>
          <input
            value={formState.business_type}
            onChange={(event) => updateField("business_type", event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            placeholder="restaurant, hotel, office..."
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Website</label>
          <input
            value={formState.website}
            onChange={(event) => updateField("website", event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Address</label>
          <input
            value={formState.address}
            onChange={(event) => updateField("address", event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">City</label>
          <input
            value={formState.city}
            onChange={(event) => updateField("city", event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-neutral-500">Stage</label>
          <select
            value={formState.pipeline_stage}
            onChange={(event) => updateField("pipeline_stage", event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            {stageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Source</label>
          <select
            value={formState.source}
            onChange={(event) => updateField("source", event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-neutral-500">Tags</label>
        <div className="mt-1">
          <TagInput
            value={formState.tags}
            onChange={(tags) => updateField("tags", tags)}
            placeholder="Add tags like lead, vip, restaurant"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-neutral-500">Notes</label>
        <textarea
          value={formState.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-neutral-500">
            Link to signup profile
          </label>
          <select
            value={formState.linked_profile_id}
            onChange={(event) =>
              updateField("linked_profile_id", event.target.value)
            }
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="">No linked profile</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name || "Unnamed"} ({profile.id.slice(0, 8)})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">
            Link to sample booking
          </label>
          <select
            value={formState.linked_booking_id}
            onChange={(event) =>
              updateField("linked_booking_id", event.target.value)
            }
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="">No linked booking</option>
            {bookings.map((booking) => (
              <option key={booking.id} value={booking.id}>
                {booking.full_name} - {booking.business_type} ({booking.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
      >
        {isPending ? "Saving..." : business ? "Update Business" : "Create Business"}
      </button>
    </form>
  );
}
