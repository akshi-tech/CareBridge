export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      care_circle: {
        Row: {
          can_view_summary: boolean;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          relationship: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          can_view_summary?: boolean;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          relationship?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          can_view_summary?: boolean;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          relationship?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      care_plans: {
        Row: {
          condition_id: string | null;
          created_at: string;
          follow_up_at: string | null;
          id: string;
          notes: string | null;
          risk_level: string;
          safety_report: Json | null;
          started_at: string;
          status: string;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          condition_id?: string | null;
          created_at?: string;
          follow_up_at?: string | null;
          id?: string;
          notes?: string | null;
          risk_level?: string;
          safety_report?: Json | null;
          started_at?: string;
          status?: string;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          condition_id?: string | null;
          created_at?: string;
          follow_up_at?: string | null;
          id?: string;
          notes?: string | null;
          risk_level?: string;
          safety_report?: Json | null;
          started_at?: string;
          status?: string;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "care_plans_condition_id_fkey";
            columns: ["condition_id"];
            isOneToOne: false;
            referencedRelation: "conditions";
            referencedColumns: ["id"];
          },
        ];
      };
      conditions: {
        Row: {
          avoid: string[];
          care_level: string;
          category: string;
          created_at: string;
          evidence_source: string | null;
          expected_improvement: string | null;
          id: string;
          name: string;
          red_flags: string[];
          self_care: string[];
          symptoms: string[];
          updated_at: string;
        };
        Insert: {
          avoid?: string[];
          care_level?: string;
          category: string;
          created_at?: string;
          evidence_source?: string | null;
          expected_improvement?: string | null;
          id?: string;
          name: string;
          red_flags?: string[];
          self_care?: string[];
          symptoms?: string[];
          updated_at?: string;
        };
        Update: {
          avoid?: string[];
          care_level?: string;
          category?: string;
          created_at?: string;
          evidence_source?: string | null;
          expected_improvement?: string | null;
          id?: string;
          name?: string;
          red_flags?: string[];
          self_care?: string[];
          symptoms?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      followups: {
        Row: {
          care_plan_id: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          scheduled_for: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          care_plan_id?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          scheduled_for: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          care_plan_id?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          scheduled_for?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "followups_care_plan_id_fkey";
            columns: ["care_plan_id"];
            isOneToOne: false;
            referencedRelation: "care_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "followups_plan_owner_fkey";
            columns: ["care_plan_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "care_plans";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      medication_logs: {
        Row: {
          created_at: string;
          id: string;
          medication_id: string;
          scheduled_at: string;
          status: string;
          taken_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          medication_id: string;
          scheduled_at?: string;
          status?: string;
          taken_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          medication_id?: string;
          scheduled_at?: string;
          status?: string;
          taken_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey";
            columns: ["medication_id"];
            isOneToOne: false;
            referencedRelation: "medications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medication_logs_medication_owner_fkey";
            columns: ["medication_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "medications";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      medications: {
        Row: {
          created_at: string;
          dosage: string | null;
          end_date: string | null;
          frequency: string | null;
          id: string;
          instructions: string | null;
          name: string;
          start_date: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          dosage?: string | null;
          end_date?: string | null;
          frequency?: string | null;
          id?: string;
          instructions?: string | null;
          name: string;
          start_date?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          dosage?: string | null;
          end_date?: string | null;
          frequency?: string | null;
          id?: string;
          instructions?: string | null;
          name?: string;
          start_date?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          blood_group: string | null;
          created_at: string;
          date_of_birth: string | null;
          email: string | null;
          gender: string | null;
          id: string;
          name: string | null;
          updated_at: string;
        };
        Insert: {
          blood_group?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          gender?: string | null;
          id: string;
          name?: string | null;
          updated_at?: string;
        };
        Update: {
          blood_group?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          gender?: string | null;
          id?: string;
          name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      symptom_analyses: {
        Row: {
          ai_available: boolean;
          associated_symptoms: string[];
          created_at: string;
          duration_days: number | null;
          id: string;
          input_text: string;
          missing_safety_questions: string[];
          red_flags_present: string[];
          safety_report: Json;
          severity: number | null;
          summary: string;
          symptoms: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_available?: boolean;
          associated_symptoms?: string[];
          created_at?: string;
          duration_days?: number | null;
          id?: string;
          input_text: string;
          missing_safety_questions?: string[];
          red_flags_present?: string[];
          safety_report: Json;
          severity?: number | null;
          summary: string;
          symptoms?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ai_available?: boolean;
          associated_symptoms?: string[];
          created_at?: string;
          duration_days?: number | null;
          id?: string;
          input_text?: string;
          missing_safety_questions?: string[];
          red_flags_present?: string[];
          safety_report?: Json;
          severity?: number | null;
          summary?: string;
          symptoms?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      symptom_entries: {
        Row: {
          created_at: string;
          description: string | null;
          duration_days: number | null;
          id: string;
          severity: number | null;
          started_at: string | null;
          symptom_name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          duration_days?: number | null;
          id?: string;
          severity?: number | null;
          started_at?: string | null;
          symptom_name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          duration_days?: number | null;
          id?: string;
          severity?: number | null;
          started_at?: string | null;
          symptom_name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      timeline_events: {
        Row: {
          care_plan_id: string | null;
          created_at: string;
          description: string | null;
          event_date: string;
          event_type: string;
          id: string;
          severity: number | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          care_plan_id?: string | null;
          created_at?: string;
          description?: string | null;
          event_date?: string;
          event_type: string;
          id?: string;
          severity?: number | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          care_plan_id?: string | null;
          created_at?: string;
          description?: string | null;
          event_date?: string;
          event_type?: string;
          id?: string;
          severity?: number | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "timeline_events_care_plan_id_fkey";
            columns: ["care_plan_id"];
            isOneToOne: false;
            referencedRelation: "care_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timeline_events_plan_owner_fkey";
            columns: ["care_plan_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "care_plans";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
