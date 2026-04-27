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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chantiers: {
        Row: {
          created_at: string
          description: string | null
          devis: number
          heures_prevues: number
          id: string
          nom: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          devis?: number
          heures_prevues?: number
          id: string
          nom: string
        }
        Update: {
          created_at?: string
          description?: string | null
          devis?: number
          heures_prevues?: number
          id?: string
          nom?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          cout_horaire: number
          created_at: string
          id: string
          nom: string
          prenom: string
        }
        Insert: {
          cout_horaire?: number
          created_at?: string
          id: string
          nom: string
          prenom: string
        }
        Update: {
          cout_horaire?: number
          created_at?: string
          id?: string
          nom?: string
          prenom?: string
        }
        Relationships: []
      }
      hour_categories: {
        Row: {
          created_at: string
          id: string
          is_bureau: boolean
          nom: string
          pourcentage: number
        }
        Insert: {
          created_at?: string
          id: string
          is_bureau?: boolean
          nom: string
          pourcentage?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_bureau?: boolean
          nom?: string
          pourcentage?: number
        }
        Relationships: []
      }
      material_costs: {
        Row: {
          chantier_id: string
          created_at: string
          date: string
          description: string
          id: string
          montant: number
        }
        Insert: {
          chantier_id: string
          created_at?: string
          date: string
          description: string
          id: string
          montant?: number
        }
        Update: {
          chantier_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          montant?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_costs_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          chantier_id: string | null
          created_at: string
          date: string
          description: string | null
          employee_id: string
          heures: number
          hour_category_id: string | null
          id: string
        }
        Insert: {
          chantier_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          employee_id: string
          heures?: number
          hour_category_id?: string | null
          id: string
        }
        Update: {
          chantier_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          employee_id?: string
          heures?: number
          hour_category_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_hour_category_id_fkey"
            columns: ["hour_category_id"]
            isOneToOne: false
            referencedRelation: "hour_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gantt_markers: {
        Row: {
          id: string
          chantier_id: string
          date: string
          end_date: string | null
          type: string
          label: string
          color: string | null
          created_at: string
        }
        Insert: {
          id: string
          chantier_id: string
          date: string
          end_date?: string | null
          type: string
          label: string
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          chantier_id?: string
          date?: string
          end_date?: string | null
          type?: string
          label?: string
          color?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gantt_markers_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
