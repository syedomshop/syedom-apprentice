export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          api_calls: number | null
          date: string
          id: string
          tokens_used: number | null
        }
        Insert: {
          api_calls?: number | null
          date?: string
          id?: string
          tokens_used?: number | null
        }
        Update: {
          api_calls?: number | null
          date?: string
          id?: string
          tokens_used?: number | null
        }
        Relationships: []
      }
      batches: {
        Row: {
          batch_number: number
          created_at: string | null
          end_date: string
          id: string
          max_seats: number | null
          start_date: string
          status: Database["public"]["Enums"]["batch_status"] | null
          tasks_generated: boolean | null
          title: string
        }
        Insert: {
          batch_number: number
          created_at?: string | null
          end_date: string
          id?: string
          max_seats?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["batch_status"] | null
          tasks_generated?: boolean | null
          title: string
        }
        Update: {
          batch_number?: number
          created_at?: string | null
          end_date?: string
          id?: string
          max_seats?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["batch_status"] | null
          tasks_generated?: boolean | null
          title?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          average_score: number
          batch_number: number | null
          certificate_code: string
          field: string
          id: string
          intern_id: string
          issued_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          status: Database["public"]["Enums"]["certificate_status"] | null
          student_name: string
          tasks_completed: number
        }
        Insert: {
          average_score: number
          batch_number?: number | null
          certificate_code: string
          field: string
          id?: string
          intern_id: string
          issued_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          status?: Database["public"]["Enums"]["certificate_status"] | null
          student_name: string
          tasks_completed: number
        }
        Update: {
          average_score?: number
          batch_number?: number | null
          certificate_code?: string
          field?: string
          id?: string
          intern_id?: string
          issued_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          status?: Database["public"]["Enums"]["certificate_status"] | null
          student_name?: string
          tasks_completed?: number
        }
        Relationships: [
          {
            foreignKeyName: "certificates_intern_id_fkey"
            columns: ["intern_id"]
            isOneToOne: true
            referencedRelation: "intern_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          feedback: string | null
          graded_at: string | null
          id: string
          intern_id: string
          score: number
          task_id: string
        }
        Insert: {
          feedback?: string | null
          graded_at?: string | null
          id?: string
          intern_id: string
          score?: number
          task_id: string
        }
        Update: {
          feedback?: string | null
          graded_at?: string | null
          id?: string
          intern_id?: string
          score?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_intern_id_fkey"
            columns: ["intern_id"]
            isOneToOne: false
            referencedRelation: "intern_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      intern_profiles: {
        Row: {
          batch_id: string | null
          created_at: string | null
          email: string
          field: string
          github_username: string | null
          id: string
          intern_id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["internship_status"] | null
          user_id: string
          username: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          email: string
          field: string
          github_username?: string | null
          id?: string
          intern_id: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["internship_status"] | null
          user_id: string
          username: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          email?: string
          field?: string
          github_username?: string | null
          id?: string
          intern_id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["internship_status"] | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "intern_profiles_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      intern_tasks: {
        Row: {
          assigned_date: string | null
          id: string
          intern_id: string
          status: Database["public"]["Enums"]["task_status"] | null
          task_id: string
        }
        Insert: {
          assigned_date?: string | null
          id?: string
          intern_id: string
          status?: Database["public"]["Enums"]["task_status"] | null
          task_id: string
        }
        Update: {
          assigned_date?: string | null
          id?: string
          intern_id?: string
          status?: Database["public"]["Enums"]["task_status"] | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intern_tasks_intern_id_fkey"
            columns: ["intern_id"]
            isOneToOne: false
            referencedRelation: "intern_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intern_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          intern_id: string
          is_read: boolean | null
          link: string | null
          link_label: string | null
          message: string
          scheduled_for: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          intern_id: string
          is_read?: boolean | null
          link?: string | null
          link_label?: string | null
          message: string
          scheduled_for?: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          intern_id?: string
          is_read?: boolean | null
          link?: string | null
          link_label?: string | null
          message?: string
          scheduled_for?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_intern_id_fkey"
            columns: ["intern_id"]
            isOneToOne: false
            referencedRelation: "intern_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_offers: {
        Row: {
          created_at: string | null
          email: string
          field: string
          id: string
          intern_id: string
          intern_profile_id: string
          name: string
          send_after: string
          status: Database["public"]["Enums"]["offer_status"] | null
        }
        Insert: {
          created_at?: string | null
          email: string
          field: string
          id?: string
          intern_id: string
          intern_profile_id: string
          name: string
          send_after: string
          status?: Database["public"]["Enums"]["offer_status"] | null
        }
        Update: {
          created_at?: string | null
          email?: string
          field?: string
          id?: string
          intern_id?: string
          intern_profile_id?: string
          name?: string
          send_after?: string
          status?: Database["public"]["Enums"]["offer_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_offers_intern_profile_id_fkey"
            columns: ["intern_profile_id"]
            isOneToOne: false
            referencedRelation: "intern_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          ai_feedback: string | null
          ai_score: number | null
          created_at: string | null
          id: string
          instructor_comment: string | null
          intern_comment: string | null
          intern_id: string
          repo_link: string
          status: Database["public"]["Enums"]["submission_status"] | null
          task_id: string
          timeliness: string | null
        }
        Insert: {
          ai_feedback?: string | null
          ai_score?: number | null
          created_at?: string | null
          id?: string
          instructor_comment?: string | null
          intern_comment?: string | null
          intern_id: string
          repo_link: string
          status?: Database["public"]["Enums"]["submission_status"] | null
          task_id: string
          timeliness?: string | null
        }
        Update: {
          ai_feedback?: string | null
          ai_score?: number | null
          created_at?: string | null
          id?: string
          instructor_comment?: string | null
          intern_comment?: string | null
          intern_id?: string
          repo_link?: string
          status?: Database["public"]["Enums"]["submission_status"] | null
          task_id?: string
          timeliness?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_intern_id_fkey"
            columns: ["intern_id"]
            isOneToOne: false
            referencedRelation: "intern_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          batch_id: string | null
          created_at: string | null
          deadline: string | null
          deliverable: string | null
          description: string | null
          difficulty: string | null
          estimated_time: string | null
          field: string
          id: string
          learning_objective: string | null
          mentor_explanation: string | null
          task_file_url: string | null
          title: string
          week_number: number
          youtube_links: string[] | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          deadline?: string | null
          deliverable?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_time?: string | null
          field: string
          id?: string
          learning_objective?: string | null
          mentor_explanation?: string | null
          task_file_url?: string | null
          title: string
          week_number: number
          youtube_links?: string[] | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          deadline?: string | null
          deliverable?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_time?: string | null
          field?: string
          id?: string
          learning_objective?: string | null
          mentor_explanation?: string | null
          task_file_url?: string | null
          title?: string
          week_number?: number
          youtube_links?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          field: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          field: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          field?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_seat_available: { Args: never; Returns: boolean }
      count_active_interns: { Args: never; Returns: number }
      get_active_batch: { Args: never; Returns: string }
      get_intern_profile_id: { Args: { _user_id: string }; Returns: string }
      get_intern_week: { Args: { _intern_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_email: { Args: { _email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "intern" | "admin"
      batch_status: "active" | "completed" | "upcoming"
      certificate_status: "issued" | "revoked"
      internship_status: "active" | "completed" | "removed"
      offer_status: "pending" | "sent"
      payment_status: "unpaid" | "paid"
      submission_status: "submitted" | "graded"
      task_status: "pending" | "in_progress" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["intern", "admin"],
      batch_status: ["active", "completed", "upcoming"],
      certificate_status: ["issued", "revoked"],
      internship_status: ["active", "completed", "removed"],
      offer_status: ["pending", "sent"],
      payment_status: ["unpaid", "paid"],
      submission_status: ["submitted", "graded"],
      task_status: ["pending", "in_progress", "completed"],
    },
  },
} as const
