// Hand-written to match supabase/migrations/*.sql. If you add the Supabase
// CLI later, this can be regenerated with `supabase gen types typescript`.

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: { name: string };
        Update: { name?: string };
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: "owner" | "member";
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          household_id: string;
          user_id: string;
          role?: "owner" | "member";
          display_name?: string | null;
        };
        Update: { display_name?: string | null; role?: "owner" | "member" };
        Relationships: [];
      };
      household_invites: {
        Row: {
          id: string;
          household_id: string;
          code: string;
          created_by: string;
          expires_at: string;
          max_uses: number | null;
          use_count: number;
          created_at: string;
        };
        Insert: {
          household_id: string;
          code: string;
          created_by: string;
          max_uses?: number | null;
        };
        Update: { max_uses?: number | null; use_count?: number };
        Relationships: [];
      };
      pets: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          species: "dog" | "cat" | "other";
          breed: string | null;
          birth_date: string | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          household_id: string;
          name: string;
          species?: "dog" | "cat" | "other";
          breed?: string | null;
          birth_date?: string | null;
          photo_url?: string | null;
        };
        Update: {
          name?: string;
          species?: "dog" | "cat" | "other";
          breed?: string | null;
          birth_date?: string | null;
          photo_url?: string | null;
        };
        Relationships: [];
      };
      feeding_schedules: {
        Row: {
          id: string;
          pet_id: string;
          label: string;
          scheduled_time: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          pet_id: string;
          label: string;
          scheduled_time: string;
          active?: boolean;
        };
        Update: {
          label?: string;
          scheduled_time?: string;
          active?: boolean;
        };
        Relationships: [];
      };
      feeding_logs: {
        Row: {
          id: string;
          pet_id: string;
          schedule_id: string | null;
          logged_by: string;
          fed_at: string;
          percent_eaten: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          pet_id: string;
          schedule_id?: string | null;
          logged_by: string;
          fed_at?: string;
          percent_eaten: number;
          notes?: string | null;
        };
        Update: {
          schedule_id?: string | null;
          fed_at?: string;
          percent_eaten?: number;
          notes?: string | null;
        };
        Relationships: [];
      };
      medications: {
        Row: {
          id: string;
          pet_id: string;
          name: string;
          dosage: string | null;
          schedule_times: string[];
          active: boolean;
          start_date: string | null;
          end_date: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          pet_id: string;
          name: string;
          dosage?: string | null;
          schedule_times?: string[];
          active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
        };
        Update: {
          name?: string;
          dosage?: string | null;
          schedule_times?: string[];
          active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      medication_logs: {
        Row: {
          id: string;
          medication_id: string;
          pet_id: string;
          logged_by: string;
          scheduled_for: string | null;
          given: boolean;
          given_at: string;
          notes: string | null;
        };
        Insert: {
          medication_id: string;
          pet_id: string;
          logged_by: string;
          scheduled_for?: string | null;
          given: boolean;
          given_at?: string;
          notes?: string | null;
        };
        Update: {
          given?: boolean;
          given_at?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      weight_logs: {
        Row: {
          id: string;
          pet_id: string;
          logged_by: string;
          weight: number;
          unit: "lb" | "kg";
          logged_at: string;
          notes: string | null;
        };
        Insert: {
          pet_id: string;
          logged_by: string;
          weight: number;
          unit?: "lb" | "kg";
          logged_at?: string;
          notes?: string | null;
        };
        Update: {
          weight?: number;
          unit?: "lb" | "kg";
          logged_at?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      demeanor_logs: {
        Row: {
          id: string;
          pet_id: string;
          logged_by: string;
          logged_at: string;
          energy_level: number | null;
          vomiting: boolean;
          vomiting_count: number;
          distancing: boolean;
          notes: string | null;
        };
        Insert: {
          pet_id: string;
          logged_by: string;
          logged_at?: string;
          energy_level?: number | null;
          vomiting?: boolean;
          vomiting_count?: number;
          distancing?: boolean;
          notes?: string | null;
        };
        Update: {
          energy_level?: number | null;
          vomiting?: boolean;
          vomiting_count?: number;
          distancing?: boolean;
          notes?: string | null;
        };
        Relationships: [];
      };
      bloodwork_files: {
        Row: {
          id: string;
          pet_id: string;
          uploaded_by: string;
          storage_path: string;
          file_name: string;
          file_type: "image" | "pdf";
          taken_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          pet_id: string;
          uploaded_by: string;
          storage_path: string;
          file_name: string;
          file_type: "image" | "pdf";
          taken_at?: string | null;
          notes?: string | null;
        };
        Update: {
          taken_at?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          pet_id: string;
          feeding_enabled: boolean;
          medication_enabled: boolean;
          weight_enabled: boolean;
          demeanor_enabled: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          pet_id: string;
          feeding_enabled?: boolean;
          medication_enabled?: boolean;
          weight_enabled?: boolean;
          demeanor_enabled?: boolean;
        };
        Update: {
          feeding_enabled?: boolean;
          medication_enabled?: boolean;
          weight_enabled?: boolean;
          demeanor_enabled?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_household: {
        Args: { household_name: string; member_display_name?: string | null };
        Returns: string;
      };
      create_household_invite: {
        Args: { hid: string };
        Returns: string;
      };
      join_household_with_code: {
        Args: { invite_code: string; member_display_name?: string | null };
        Returns: string;
      };
      is_household_member: {
        Args: { hid: string };
        Returns: boolean;
      };
      is_household_owner: {
        Args: { hid: string };
        Returns: boolean;
      };
      pet_household_id: {
        Args: { pid: string };
        Returns: string;
      };
    };
  };
}
