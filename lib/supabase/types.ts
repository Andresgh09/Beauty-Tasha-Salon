/**
 * Tipos generados manualmente del schema.
 * Cuando tengamos Supabase CLI, generar automáticamente con:
 *   npx supabase gen types typescript --project-id cuxdmzaeklfnjsrhqyer
 */

export type ServiceCategory =
  | "manicure"
  | "pedicure"
  | "spa"
  | "semipermanente"
  | "extensiones"
  | "ninas";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type DiscountType = "percentage" | "fixed";

export type Service = {
  id: string;
  slug: string;
  name: string;
  category: ServiceCategory;
  price: number;
  duration_minutes: number;
  short_description: string;
  long_description: string | null;
  images: string[];
  featured: boolean;
  visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type GalleryItem = {
  id: string;
  image_url: string;
  alt_text: string | null;
  visible: boolean;
  sort_order: number;
  created_at: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthday: string | null;
  notes: string | null;
  total_bookings: number;
  total_spent: number;
  last_visit_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  customer_id: string | null;
  service_id: string | null;
  service_name: string;
  service_price: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes: string | null;
  starts_at: string;
  duration_minutes: number;
  status: BookingStatus;
  google_event_id: string | null;
  discount_code_id: string | null;
  discount_amount: number;
  final_price: number;
  created_at: string;
  updated_at: string;
};

export type BlockedSlot = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
};

export type BusinessHours = {
  id: string;
  day_of_week: number;
  is_open: boolean;
  morning_open: string | null;
  morning_close: string | null;
  afternoon_open: string | null;
  afternoon_close: string | null;
  evening_open: string | null;
  evening_close: string | null;
  slot_duration_minutes: number;
  updated_at: string;
};

export type DiscountCode = {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_amount: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  created_at: string;
};

export type Testimonial = {
  id: string;
  customer_name: string;
  customer_role: string | null;
  customer_avatar: string | null;
  rating: number;
  text: string;
  visible: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string;
};

export type SiteSetting = {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
};

/** Database type para createClient<Database>() */
export type Database = {
  public: {
    Tables: {
      services: { Row: Service; Insert: Partial<Service>; Update: Partial<Service> };
      gallery: { Row: GalleryItem; Insert: Partial<GalleryItem>; Update: Partial<GalleryItem> };
      customers: { Row: Customer; Insert: Partial<Customer>; Update: Partial<Customer> };
      bookings: { Row: Booking; Insert: Partial<Booking>; Update: Partial<Booking> };
      blocked_slots: { Row: BlockedSlot; Insert: Partial<BlockedSlot>; Update: Partial<BlockedSlot> };
      business_hours: { Row: BusinessHours; Insert: Partial<BusinessHours>; Update: Partial<BusinessHours> };
      discount_codes: { Row: DiscountCode; Insert: Partial<DiscountCode>; Update: Partial<DiscountCode> };
      testimonials: { Row: Testimonial; Insert: Partial<Testimonial>; Update: Partial<Testimonial> };
      site_settings: { Row: SiteSetting; Insert: Partial<SiteSetting>; Update: Partial<SiteSetting> };
    };
    Enums: {
      service_category: ServiceCategory;
      booking_status: BookingStatus;
      discount_type: DiscountType;
    };
  };
};
