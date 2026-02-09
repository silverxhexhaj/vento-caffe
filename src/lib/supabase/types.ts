export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          default_shipping_address: Json | null;
          role: "customer" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          default_shipping_address?: Json | null;
          role?: "customer" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          default_shipping_address?: Json | null;
          role?: "customer" | "admin";
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name_key: string;
          description_key: string;
          contents_key: string | null;
          highlights_key: string | null;
          price: number;
          sold_out: boolean;
          featured: boolean;
          type: "cialde" | "machine";
          images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_key: string;
          description_key: string;
          contents_key?: string | null;
          highlights_key?: string | null;
          price: number;
          sold_out?: boolean;
          featured?: boolean;
          type: "cialde" | "machine";
          images: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name_key?: string;
          description_key?: string;
          contents_key?: string | null;
          highlights_key?: string | null;
          price?: number;
          sold_out?: boolean;
          featured?: boolean;
          type?: "cialde" | "machine";
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
          total: number;
          is_subscription: boolean;
          shipping_address: Json;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
          total: number;
          is_subscription?: boolean;
          shipping_address: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
          total?: number;
          is_subscription?: boolean;
          shipping_address?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price_at_purchase: number;
          is_free: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price_at_purchase: number;
          is_free?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          price_at_purchase?: number;
          is_free?: boolean;
          created_at?: string;
        };
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          subscribed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          subscribed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          subscribed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      carts: {
        Row: {
          id: string;
          user_id: string;
          items: Json;
          is_subscription: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          items?: Json;
          is_subscription?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          items?: Json;
          is_subscription?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sample_bookings: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          business_type: string;
          address: string;
          city: string;
          booking_date: string;
          status: "pending" | "confirmed" | "delivered" | "cancelled";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email?: string | null;
          business_type: string;
          address: string;
          city: string;
          booking_date: string;
          status?: "pending" | "confirmed" | "delivered" | "cancelled";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          email?: string | null;
          business_type?: string;
          address?: string;
          city?: string;
          booking_date?: string;
          status?: "pending" | "confirmed" | "delivered" | "cancelled";
          notes?: string | null;
          created_at?: string;
        };
      };
      businesses: {
        Row: {
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
        };
        Insert: {
          id?: string;
          name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          business_type?: string | null;
          address?: string | null;
          city?: string | null;
          website?: string | null;
          pipeline_stage?: string;
          source?: string;
          tags?: string[];
          notes?: string | null;
          linked_profile_id?: string | null;
          linked_booking_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          business_type?: string | null;
          address?: string | null;
          city?: string | null;
          website?: string | null;
          pipeline_stage?: string;
          source?: string;
          tags?: string[];
          notes?: string | null;
          linked_profile_id?: string | null;
          linked_booking_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      business_activities: {
        Row: {
          id: string;
          business_id: string;
          type: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          type: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          type?: string;
          description?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      order_status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
      product_type: "cialde" | "machine";
      booking_status: "pending" | "confirmed" | "delivered" | "cancelled";
    };
  };
}
