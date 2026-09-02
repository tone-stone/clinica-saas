// Tipos escritos a mano reflejando supabase/migrations/*.sql.
// Cuando el proyecto Supabase esté creado, reemplazar por tipos generados:
//   npx supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts

export type MembershipRole = "owner" | "staff" | "patient";
export type StaffRole = "doctor" | "psicologo" | "recepcion";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";
export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
export type ClinicalRecordType = "general" | "medicina" | "psicologia";
export type AttachmentResourceType = "image" | "raw" | "video";
export type BlogPostStatus = "draft" | "published";
export type ScaleType = "phq9" | "gad7";
export type PaymentStatus = "unpaid" | "paid" | "waived";
export type WaitlistStatus = "waiting" | "resolved" | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tenants: {
        Row: {
          id: string;
          name: string;
          subdomain: string;
          custom_domain: string | null;
          plan_id: string | null;
          subscription_status: SubscriptionStatus;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_ends_at: string | null;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subdomain: string;
          custom_domain?: string | null;
          plan_id?: string | null;
          subscription_status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subdomain?: string;
          custom_domain?: string | null;
          plan_id?: string | null;
          subscription_status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      super_admins: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: { user_id?: string; created_at?: string };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: MembershipRole;
          staff_role: StaffRole | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role: MembershipRole;
          staff_role?: StaffRole | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: MembershipRole;
          staff_role?: StaffRole | null;
          created_at?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          date_of_birth: string | null;
          gender: string | null;
          address: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          notes: string | null;
          photo_public_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id?: string | null;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          address?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          notes?: string | null;
          photo_public_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string | null;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          address?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          notes?: string | null;
          photo_public_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          tenant_id: string;
          patient_id: string;
          staff_id: string;
          scheduled_at: string;
          duration_minutes: number;
          status: AppointmentStatus;
          reason: string | null;
          notes: string | null;
          reminder_sent_at: string | null;
          started_notified_at: string | null;
          finished_notified_at: string | null;
          price_cents: number | null;
          payment_status: PaymentStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          patient_id: string;
          staff_id: string;
          scheduled_at: string;
          duration_minutes?: number;
          status?: AppointmentStatus;
          reason?: string | null;
          notes?: string | null;
          reminder_sent_at?: string | null;
          started_notified_at?: string | null;
          finished_notified_at?: string | null;
          price_cents?: number | null;
          payment_status?: PaymentStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          patient_id?: string;
          staff_id?: string;
          scheduled_at?: string;
          duration_minutes?: number;
          status?: AppointmentStatus;
          reason?: string | null;
          notes?: string | null;
          reminder_sent_at?: string | null;
          started_notified_at?: string | null;
          finished_notified_at?: string | null;
          price_cents?: number | null;
          payment_status?: PaymentStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      assessments: {
        Row: {
          id: string;
          tenant_id: string;
          patient_id: string;
          staff_id: string;
          appointment_id: string | null;
          scale_type: ScaleType;
          answers: number[];
          score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          patient_id: string;
          staff_id: string;
          appointment_id?: string | null;
          scale_type: ScaleType;
          answers?: number[];
          score: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          patient_id?: string;
          staff_id?: string;
          appointment_id?: string | null;
          scale_type?: ScaleType;
          answers?: number[];
          score?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      appointment_intake: {
        Row: {
          id: string;
          tenant_id: string;
          appointment_id: string;
          patient_id: string;
          motivo: string | null;
          sintomas: string | null;
          severidad: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          appointment_id: string;
          patient_id: string;
          motivo?: string | null;
          sintomas?: string | null;
          severidad?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          appointment_id?: string;
          patient_id?: string;
          motivo?: string | null;
          sintomas?: string | null;
          severidad?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      consents: {
        Row: {
          id: string;
          tenant_id: string;
          patient_id: string;
          title: string;
          body: string;
          signed_name: string | null;
          signed_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          patient_id: string;
          title: string;
          body: string;
          signed_name?: string | null;
          signed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          patient_id?: string;
          title?: string;
          body?: string;
          signed_name?: string | null;
          signed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      waitlist_entries: {
        Row: {
          id: string;
          tenant_id: string;
          patient_id: string;
          staff_id: string | null;
          note: string | null;
          status: WaitlistStatus;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          patient_id: string;
          staff_id?: string | null;
          note?: string | null;
          status?: WaitlistStatus;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          patient_id?: string;
          staff_id?: string | null;
          note?: string | null;
          status?: WaitlistStatus;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_availability: {
        Row: {
          id: string;
          tenant_id: string;
          staff_id: string;
          day_of_week: number;
          start_minutes: number | null;
          end_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          staff_id: string;
          day_of_week: number;
          start_minutes?: number | null;
          end_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          staff_id?: string;
          day_of_week?: number;
          start_minutes?: number | null;
          end_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinical_records: {
        Row: {
          id: string;
          tenant_id: string;
          patient_id: string;
          appointment_id: string | null;
          staff_id: string;
          record_type: ClinicalRecordType;
          summary: string | null;
          content: Record<string, unknown>;
          visible_to_patient: boolean;
          amends_record_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          patient_id: string;
          appointment_id?: string | null;
          staff_id: string;
          record_type?: ClinicalRecordType;
          summary?: string | null;
          content?: Record<string, unknown>;
          visible_to_patient?: boolean;
          amends_record_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          patient_id?: string;
          appointment_id?: string | null;
          staff_id?: string;
          record_type?: ClinicalRecordType;
          summary?: string | null;
          content?: Record<string, unknown>;
          visible_to_patient?: boolean;
          amends_record_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          tenant_id: string;
          patient_id: string;
          clinical_record_id: string | null;
          cloudinary_public_id: string;
          resource_type: AttachmentResourceType;
          original_filename: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          patient_id: string;
          clinical_record_id?: string | null;
          cloudinary_public_id: string;
          resource_type?: AttachmentResourceType;
          original_filename?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          patient_id?: string;
          clinical_record_id?: string | null;
          cloudinary_public_id?: string;
          resource_type?: AttachmentResourceType;
          original_filename?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          tenant_id: string | null;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          name: string;
          stripe_price_id: string;
          interval: "year" | "month";
          price_cents: number;
          currency: string;
          max_staff: number | null;
          max_patients: number | null;
          features: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          stripe_price_id: string;
          interval?: "year" | "month";
          price_cents: number;
          currency?: string;
          max_staff?: number | null;
          max_patients?: number | null;
          features?: Record<string, unknown>;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          stripe_price_id?: string;
          interval?: "year" | "month";
          price_cents?: number;
          currency?: string;
          max_staff?: number | null;
          max_patients?: number | null;
          features?: Record<string, unknown>;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          tenant_id: string;
          author_id: string | null;
          title: string;
          slug: string;
          content: string | null;
          cover_image_public_id: string | null;
          status: BlogPostStatus;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          author_id?: string | null;
          title: string;
          slug: string;
          content?: string | null;
          cover_image_public_id?: string | null;
          status?: BlogPostStatus;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          author_id?: string | null;
          title?: string;
          slug?: string;
          content?: string | null;
          cover_image_public_id?: string | null;
          status?: BlogPostStatus;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
