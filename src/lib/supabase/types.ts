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
        };
        Insert: {
          id?: string;
          slug: string;
          name_key: string;
          description_key: string;
          contents_key?: string | null;
          highlights_key?: string | null;
          price: number;
          cost_price?: number;
          stock_quantity?: number;
          low_stock_threshold?: number;
          sold_out?: boolean;
          featured?: boolean;
          status?: "draft" | "published";
          display_order?: number;
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
          cost_price?: number;
          stock_quantity?: number;
          low_stock_threshold?: number;
          sold_out?: boolean;
          featured?: boolean;
          status?: "draft" | "published";
          display_order?: number;
          type?: "cialde" | "machine";
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      stock_movements: {
        Row: {
          id: string;
          product_id: string;
          type: "purchase" | "sale" | "adjustment" | "return";
          quantity: number;
          reference: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          type: "purchase" | "sale" | "adjustment" | "return";
          quantity: number;
          reference?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          type?: "purchase" | "sale" | "adjustment" | "return";
          quantity?: number;
          reference?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
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
      admin_notifications: {
        Row: {
          id: string;
          type: string;
          title: string;
          body: string;
          payload: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          title: string;
          body: string;
          payload?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          title?: string;
          body?: string;
          payload?: Json;
          is_read?: boolean;
          created_at?: string;
        };
      };
      marketing_campaigns: {
        Row: {
          id: string;
          name: string;
          goal: string;
          product_focus: string;
          tone: string[];
          platforms: Database["public"]["Enums"]["marketing_platform"][];
          outputs: string[];
          status: Database["public"]["Enums"]["marketing_campaign_status"];
          error_message: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          goal: string;
          product_focus: string;
          tone?: string[];
          platforms?: Database["public"]["Enums"]["marketing_platform"][];
          outputs?: string[];
          status?: Database["public"]["Enums"]["marketing_campaign_status"];
          error_message?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          goal?: string;
          product_focus?: string;
          tone?: string[];
          platforms?: Database["public"]["Enums"]["marketing_platform"][];
          outputs?: string[];
          status?: Database["public"]["Enums"]["marketing_campaign_status"];
          error_message?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      marketing_assets: {
        Row: {
          id: string;
          campaign_id: string | null;
          kind: Database["public"]["Enums"]["marketing_asset_kind"];
          source: Database["public"]["Enums"]["marketing_asset_source"];
          label: string;
          url: string;
          storage_path: string | null;
          content_type: string | null;
          prompt: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id?: string | null;
          kind: Database["public"]["Enums"]["marketing_asset_kind"];
          source: Database["public"]["Enums"]["marketing_asset_source"];
          label: string;
          url: string;
          storage_path?: string | null;
          content_type?: string | null;
          prompt?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string | null;
          kind?: Database["public"]["Enums"]["marketing_asset_kind"];
          source?: Database["public"]["Enums"]["marketing_asset_source"];
          label?: string;
          url?: string;
          storage_path?: string | null;
          content_type?: string | null;
          prompt?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      marketing_posts: {
        Row: {
          id: string;
          campaign_id: string;
          linked_asset_id: string | null;
          platform: Database["public"]["Enums"]["marketing_platform"];
          title: string;
          caption: string;
          hashtags: string[];
          status: Database["public"]["Enums"]["marketing_post_status"];
          scheduled_at: string | null;
          image_prompt: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          linked_asset_id?: string | null;
          platform: Database["public"]["Enums"]["marketing_platform"];
          title: string;
          caption: string;
          hashtags?: string[];
          status?: Database["public"]["Enums"]["marketing_post_status"];
          scheduled_at?: string | null;
          image_prompt?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          linked_asset_id?: string | null;
          platform?: Database["public"]["Enums"]["marketing_platform"];
          title?: string;
          caption?: string;
          hashtags?: string[];
          status?: Database["public"]["Enums"]["marketing_post_status"];
          scheduled_at?: string | null;
          image_prompt?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supplier_receipts: {
        Row: {
          id: string;
          status: "draft" | "reviewed" | "archived";
          supplier_name: string | null;
          receipt_number: string | null;
          receipt_date: string | null;
          currency: string;
          subtotal: number | null;
          tax: number | null;
          total: number | null;
          extraction_confidence: number | null;
          image_storage_path: string;
          image_content_type: string;
          image_size: number;
          extracted_json: Json | null;
          extraction_error: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          status?: "draft" | "reviewed" | "archived";
          supplier_name?: string | null;
          receipt_number?: string | null;
          receipt_date?: string | null;
          currency?: string;
          subtotal?: number | null;
          tax?: number | null;
          total?: number | null;
          extraction_confidence?: number | null;
          image_storage_path: string;
          image_content_type: string;
          image_size: number;
          extracted_json?: Json | null;
          extraction_error?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status?: "draft" | "reviewed" | "archived";
          supplier_name?: string | null;
          receipt_number?: string | null;
          receipt_date?: string | null;
          currency?: string;
          subtotal?: number | null;
          tax?: number | null;
          total?: number | null;
          extraction_confidence?: number | null;
          image_storage_path?: string;
          image_content_type?: string;
          image_size?: number;
          extracted_json?: Json | null;
          extraction_error?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supplier_receipt_lines: {
        Row: {
          id: string;
          receipt_id: string;
          line_order: number;
          description_raw: string;
          quantity: number;
          unit_amount: number | null;
          line_total: number | null;
          suggested_product_id: string | null;
          suggested_match_confidence: number | null;
          confirmed_product_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_id: string;
          line_order?: number;
          description_raw?: string;
          quantity?: number;
          unit_amount?: number | null;
          line_total?: number | null;
          suggested_product_id?: string | null;
          suggested_match_confidence?: number | null;
          confirmed_product_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          receipt_id?: string;
          line_order?: number;
          description_raw?: string;
          quantity?: number;
          unit_amount?: number | null;
          line_total?: number | null;
          suggested_product_id?: string | null;
          suggested_match_confidence?: number | null;
          confirmed_product_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      cash_ledger_entries: {
        Row: {
          id: string;
          direction: "in" | "out";
          source: "order_payment" | "supplier_payment" | "manual_adjustment" | "opening_balance";
          amount: number;
          occurred_at: string;
          note: string | null;
          order_id: string | null;
          supplier_receipt_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          direction: "in" | "out";
          source: "order_payment" | "supplier_payment" | "manual_adjustment" | "opening_balance";
          amount: number;
          occurred_at?: string;
          note?: string | null;
          order_id?: string | null;
          supplier_receipt_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          direction?: "in" | "out";
          source?: "order_payment" | "supplier_payment" | "manual_adjustment" | "opening_balance";
          amount?: number;
          occurred_at?: string;
          note?: string | null;
          order_id?: string | null;
          supplier_receipt_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
      product_status: "draft" | "published";
      product_type: "cialde" | "machine";
      booking_status: "pending" | "confirmed" | "delivered" | "cancelled";
      marketing_asset_kind: "reference" | "generated";
      marketing_asset_source: "upload" | "gpt_image";
      marketing_platform: "instagram" | "facebook" | "tiktok";
      marketing_post_status: "draft" | "ready" | "scheduled";
      marketing_campaign_status: "draft" | "generating" | "ready" | "failed";
      supplier_receipt_status: "draft" | "reviewed" | "archived";
      cash_ledger_direction: "in" | "out";
      cash_ledger_source:
        | "order_payment"
        | "supplier_payment"
        | "manual_adjustment"
        | "opening_balance";
    };
  };
}
