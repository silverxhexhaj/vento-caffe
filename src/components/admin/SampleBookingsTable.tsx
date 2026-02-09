"use client";

import { useState, useTransition } from "react";
import StatusBadge from "./StatusBadge";
import { convertSampleBookingToBusiness, updateSampleBookingStatus } from "@/lib/actions/admin";
import type { AdminSampleBooking } from "@/lib/actions/admin";

interface SampleBookingsTableProps {
  bookings: AdminSampleBooking[];
}

export default function SampleBookingsTable({ bookings }: SampleBookingsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId);
    startTransition(async () => {
      await updateSampleBookingStatus(bookingId, newStatus);
      setUpdatingId(null);
    });
  };

  const handleConvert = (bookingId: string) => {
    setConvertingId(bookingId);
    startTransition(async () => {
      await convertSampleBookingToBusiness(bookingId);
      setConvertingId(null);
    });
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <p className="text-sm">No sample bookings found</p>
      </div>
    );
  }

  const statusOptions = ["pending", "confirmed", "delivered", "cancelled"];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Name</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Contact</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Business</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Location</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Date</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Status</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr
              key={booking.id}
              className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <td className="py-3 px-4">
                <p className="font-medium text-neutral-900">{booking.full_name}</p>
              </td>
              <td className="py-3 px-4">
                <p className="text-neutral-600">{booking.phone}</p>
                {booking.email && (
                  <p className="text-xs text-neutral-400">{booking.email}</p>
                )}
              </td>
              <td className="py-3 px-4 text-neutral-600 capitalize">
                {booking.business_type}
              </td>
              <td className="py-3 px-4">
                <p className="text-neutral-600">{booking.address}</p>
                <p className="text-xs text-neutral-400">{booking.city}</p>
              </td>
              <td className="py-3 px-4 text-neutral-500">
                {new Date(booking.booking_date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={booking.status} />
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-col gap-2">
                  <select
                    value={booking.status}
                    onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                    disabled={isPending && updatingId === booking.id}
                    className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-50"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleConvert(booking.id)}
                    disabled={isPending && convertingId === booking.id}
                    className="text-xs font-medium text-neutral-700 hover:text-neutral-900 underline disabled:opacity-50"
                  >
                    {isPending && convertingId === booking.id
                      ? "Converting..."
                      : "Convert to business"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
