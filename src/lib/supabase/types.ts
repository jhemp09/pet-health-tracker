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
          timezone: string;
          created_at: string;
        };
        Insert: { name: string; timezone?: string };
        Update: { name?: string; timezone?: string };
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
      meal_foods: {
        Row: {
          id: string;
          schedule_id: string;
          url: string;
          title: string | null;
          image_url: string | null;
          amount: string | null;
          created_at: string;
        };
        Insert: {
          schedule_id: string;
          url: string;
          title?: string | null;
          image_url?: string | null;
          amount?: string | null;
        };
        Update: {
          url?: string;
          title?: string | null;
          image_url?: string | null;
          amount?: string | null;
        };
        Relationships: [];
      };
      medications: {
        Row: {
          id: string;
          pet_id: string;
          name: string;
          dosage: string | null;
          active: boolean;
          interval_days: number;
          start_date: string | null;
          end_date: string | null;
          notes: string | null;
          product_url: string | null;
          created_at: string;
        };
        Insert: {
          pet_id: string;
          name: string;
          dosage?: string | null;
          active?: boolean;
          interval_days?: number;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          product_url?: string | null;
        };
        Update: {
          name?: string;
          dosage?: string | null;
          active?: boolean;
          interval_days?: number;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          product_url?: string | null;
        };
        Relationships: [];
      };
      medication_schedule_times: {
        Row: {
          id: string;
          medication_id: string;
          scheduled_time: string;
          linked_schedule_id: string | null;
          created_at: string;
        };
        Insert: {
          medication_id: string;
          scheduled_time: string;
          linked_schedule_id?: string | null;
        };
        Update: {
          scheduled_time?: string;
          linked_schedule_id?: string | null;
        };
        Relationships: [];
      };
      medication_logs: {
        Row: {
          id: string;
          pet_id: string;
          medication_id: string;
          schedule_time_id: string | null;
          observed_date: string;
          given: boolean;
          notes: string | null;
          logged_by: string;
          created_at: string;
        };
        Insert: {
          pet_id: string;
          medication_id: string;
          schedule_time_id?: string | null;
          observed_date: string;
          given: boolean;
          notes?: string | null;
          logged_by: string;
        };
        Update: {
          given?: boolean;
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
          bloodwork_file_id: string | null;
        };
        Insert: {
          pet_id: string;
          logged_by: string;
          weight: number;
          unit?: "lb" | "kg";
          logged_at?: string;
          notes?: string | null;
          bloodwork_file_id?: string | null;
        };
        Update: {
          weight?: number;
          unit?: "lb" | "kg";
          logged_at?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      pet_demeanor_symptoms: {
        Row: {
          id: string;
          pet_id: string;
          symptom_key: string;
          active: boolean;
          created_at: string;
        };
        Insert: { pet_id: string; symptom_key: string; active?: boolean };
        Update: { active?: boolean };
        Relationships: [];
      };
      demeanor_observations: {
        Row: {
          id: string;
          pet_id: string;
          symptom_key: string;
          observed_date: string;
          value_numeric: number | null;
          value_text: string | null;
          notes: string | null;
          logged_by: string;
          created_at: string;
        };
        Insert: {
          pet_id: string;
          symptom_key: string;
          observed_date: string;
          value_numeric?: number | null;
          value_text?: string | null;
          notes?: string | null;
          logged_by: string;
        };
        Update: {
          value_numeric?: number | null;
          value_text?: string | null;
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
          mime_type: string | null;
          parse_status: "pending" | "done" | "failed";
          parsed_summary: string | null;
          parsed_at: string | null;
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
          mime_type?: string | null;
        };
        Update: {
          taken_at?: string | null;
          notes?: string | null;
          parse_status?: "pending" | "done" | "failed";
          parsed_summary?: string | null;
          parsed_at?: string | null;
        };
        Relationships: [];
      };
      bloodwork_results: {
        Row: {
          id: string;
          bloodwork_file_id: string;
          test_name: string;
          value: string;
          unit: string | null;
          reference_range: string | null;
          flag: "low" | "high" | "normal" | "abnormal" | null;
          created_at: string;
        };
        Insert: {
          bloodwork_file_id: string;
          test_name: string;
          value: string;
          unit?: string | null;
          reference_range?: string | null;
          flag?: "low" | "high" | "normal" | "abnormal" | null;
        };
        Update: {
          test_name?: string;
          value?: string;
          unit?: string | null;
          reference_range?: string | null;
          flag?: "low" | "high" | "normal" | "abnormal" | null;
        };
        Relationships: [];
      };
      pet_synopses: {
        Row: {
          id: string;
          pet_id: string;
          current_state: string;
          recent_changes: string;
          trend: string;
          prognosis: string;
          suggestions: string[];
          generated_at: string;
        };
        Insert: {
          pet_id: string;
          current_state: string;
          recent_changes: string;
          trend: string;
          prognosis: string;
          suggestions: string[];
          generated_at?: string;
        };
        Update: {
          current_state?: string;
          recent_changes?: string;
          trend?: string;
          prognosis?: string;
          suggestions?: string[];
          generated_at?: string;
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
      change_log_entries: {
        Row: {
          id: string;
          pet_id: string;
          event_date: string;
          category: "medication" | "food" | "bloodwork" | "manual";
          description: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          pet_id: string;
          event_date: string;
          category: "medication" | "food" | "bloodwork" | "manual";
          description: string;
          created_by?: string | null;
        };
        Update: {
          event_date?: string;
          description?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_household: {
        Args: {
          household_name: string;
          member_display_name?: string | null;
          household_timezone?: string;
        };
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
      medication_household_id: {
        Args: { mid: string };
        Returns: string;
      };
      schedule_time_household_id: {
        Args: { stid: string };
        Returns: string;
      };
    };
  };
}
