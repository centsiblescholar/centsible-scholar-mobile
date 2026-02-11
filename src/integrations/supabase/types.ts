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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_table: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          active: boolean
          created_at: string
          email: string
          granted_at: string
          granted_by: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          operation: string
          record_id: string | null
          table_name: string
          user_role: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          operation: string
          record_id?: string | null
          table_name: string
          user_role: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          operation?: string
          record_id?: string | null
          table_name?: string
          user_role?: string
        }
        Relationships: []
      }
      behavior_analytics_summary: {
        Row: {
          assessment_count: number
          avg_score: number
          created_at: string | null
          id: string
          month_year: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assessment_count: number
          avg_score: number
          created_at?: string | null
          id?: string
          month_year: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assessment_count?: number
          avg_score?: number
          created_at?: string | null
          id?: string
          month_year?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      behavior_assessments: {
        Row: {
          attitude: number
          cooperation: number
          courtesy: number
          created_at: string
          date: string
          diet: number
          exercise: number
          hygiene: number
          id: string
          originated_by: string | null
          parent_notes: string | null
          respect: number
          responsibilities: number
          reviewed_at: string | null
          score_disputes: Json | null
          service: number
          status:
            | Database["public"]["Enums"]["behavior_assessment_status"]
            | null
          student_id: string | null
          student_user_id: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
          work: number
        }
        Insert: {
          attitude?: number
          cooperation?: number
          courtesy?: number
          created_at?: string
          date: string
          diet?: number
          exercise?: number
          hygiene?: number
          id?: string
          originated_by?: string | null
          parent_notes?: string | null
          respect?: number
          responsibilities?: number
          reviewed_at?: string | null
          score_disputes?: Json | null
          service?: number
          status?:
            | Database["public"]["Enums"]["behavior_assessment_status"]
            | null
          student_id?: string | null
          student_user_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          work?: number
        }
        Update: {
          attitude?: number
          cooperation?: number
          courtesy?: number
          created_at?: string
          date?: string
          diet?: number
          exercise?: number
          hygiene?: number
          id?: string
          originated_by?: string | null
          parent_notes?: string | null
          respect?: number
          responsibilities?: number
          reviewed_at?: string | null
          score_disputes?: Json | null
          service?: number
          status?:
            | Database["public"]["Enums"]["behavior_assessment_status"]
            | null
          student_id?: string | null
          student_user_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          work?: number
        }
        Relationships: [
          {
            foreignKeyName: "behavior_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_assessments_archived: {
        Row: {
          archived_at: string
          attitude: number
          cooperation: number
          courtesy: number
          created_at: string
          date: string
          diet: number
          exercise: number
          hygiene: number
          id: string
          respect: number
          responsibilities: number
          service: number
          updated_at: string
          user_id: string
          work: number
        }
        Insert: {
          archived_at?: string
          attitude: number
          cooperation: number
          courtesy: number
          created_at: string
          date: string
          diet: number
          exercise: number
          hygiene: number
          id: string
          respect: number
          responsibilities: number
          service: number
          updated_at: string
          user_id: string
          work: number
        }
        Update: {
          archived_at?: string
          attitude?: number
          cooperation?: number
          courtesy?: number
          created_at?: string
          date?: string
          diet?: number
          exercise?: number
          hygiene?: number
          id?: string
          respect?: number
          responsibilities?: number
          service?: number
          updated_at?: string
          user_id?: string
          work?: number
        }
        Relationships: []
      }
      behavior_assessments_archived_2024: {
        Row: {
          archived_at: string
          attitude: number
          cooperation: number
          courtesy: number
          created_at: string
          date: string
          diet: number
          exercise: number
          hygiene: number
          id: string
          respect: number
          responsibilities: number
          service: number
          updated_at: string
          user_id: string
          work: number
        }
        Insert: {
          archived_at?: string
          attitude: number
          cooperation: number
          courtesy: number
          created_at: string
          date: string
          diet: number
          exercise: number
          hygiene: number
          id: string
          respect: number
          responsibilities: number
          service: number
          updated_at: string
          user_id: string
          work: number
        }
        Update: {
          archived_at?: string
          attitude?: number
          cooperation?: number
          courtesy?: number
          created_at?: string
          date?: string
          diet?: number
          exercise?: number
          hygiene?: number
          id?: string
          respect?: number
          responsibilities?: number
          service?: number
          updated_at?: string
          user_id?: string
          work?: number
        }
        Relationships: []
      }
      behavior_assessments_archived_2025: {
        Row: {
          archived_at: string
          attitude: number
          cooperation: number
          courtesy: number
          created_at: string
          date: string
          diet: number
          exercise: number
          hygiene: number
          id: string
          respect: number
          responsibilities: number
          service: number
          updated_at: string
          user_id: string
          work: number
        }
        Insert: {
          archived_at?: string
          attitude: number
          cooperation: number
          courtesy: number
          created_at: string
          date: string
          diet: number
          exercise: number
          hygiene: number
          id: string
          respect: number
          responsibilities: number
          service: number
          updated_at: string
          user_id: string
          work: number
        }
        Update: {
          archived_at?: string
          attitude?: number
          cooperation?: number
          courtesy?: number
          created_at?: string
          date?: string
          diet?: number
          exercise?: number
          hygiene?: number
          id?: string
          respect?: number
          responsibilities?: number
          service?: number
          updated_at?: string
          user_id?: string
          work?: number
        }
        Relationships: []
      }
      behavior_assessments_complete: {
        Row: {
          attitude: number
          cooperation: number
          courtesy: number
          created_at: string
          date: string
          diet: number
          exercise: number
          hygiene: number
          id: string
          originated_by: string | null
          parent_notes: string | null
          parent_user_id: string | null
          respect: number
          responsibilities: number
          reviewed_at: string | null
          score_disputes: Json | null
          service: number
          status:
            | Database["public"]["Enums"]["behavior_assessment_status"]
            | null
          student_id: string | null
          student_user_id: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
          work: number
        }
        Insert: {
          attitude?: number
          cooperation?: number
          courtesy?: number
          created_at?: string
          date: string
          diet?: number
          exercise?: number
          hygiene?: number
          id?: string
          originated_by?: string | null
          parent_notes?: string | null
          parent_user_id?: string | null
          respect?: number
          responsibilities?: number
          reviewed_at?: string | null
          score_disputes?: Json | null
          service?: number
          status?:
            | Database["public"]["Enums"]["behavior_assessment_status"]
            | null
          student_id?: string | null
          student_user_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          work?: number
        }
        Update: {
          attitude?: number
          cooperation?: number
          courtesy?: number
          created_at?: string
          date?: string
          diet?: number
          exercise?: number
          hygiene?: number
          id?: string
          originated_by?: string | null
          parent_notes?: string | null
          parent_user_id?: string | null
          respect?: number
          responsibilities?: number
          reviewed_at?: string | null
          score_disputes?: Json | null
          service?: number
          status?:
            | Database["public"]["Enums"]["behavior_assessment_status"]
            | null
          student_id?: string | null
          student_user_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          work?: number
        }
        Relationships: [
          {
            foreignKeyName: "behavior_assessments_complete_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_assessments_pending: {
        Row: {
          archived_at: string
          attitude: number
          cooperation: number
          courtesy: number
          created_at: string
          date: string
          diet: number
          exercise: number
          hygiene: number
          id: string
          respect: number
          responsibilities: number
          service: number
          updated_at: string
          user_id: string
          work: number
        }
        Insert: {
          archived_at?: string
          attitude: number
          cooperation: number
          courtesy: number
          created_at: string
          date: string
          diet: number
          exercise: number
          hygiene: number
          id: string
          respect: number
          responsibilities: number
          service: number
          updated_at: string
          user_id: string
          work: number
        }
        Update: {
          archived_at?: string
          attitude?: number
          cooperation?: number
          courtesy?: number
          created_at?: string
          date?: string
          diet?: number
          exercise?: number
          hygiene?: number
          id?: string
          respect?: number
          responsibilities?: number
          service?: number
          updated_at?: string
          user_id?: string
          work?: number
        }
        Relationships: []
      }
      behavior_bonuses: {
        Row: {
          base_amount: number
          bonus_amount: number
          created_at: string
          id: string
          paid_at: string | null
          status: string
          student_id: string
          term_id: string | null
          term_number: number | null
          total_score: number
          updated_at: string
          user_id: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          base_amount: number
          bonus_amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
          student_id?: string
          term_id?: string | null
          term_number?: number | null
          total_score: number
          updated_at?: string
          user_id: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          base_amount?: number
          bonus_amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
          student_id?: string
          term_id?: string | null
          term_number?: number | null
          total_score?: number
          updated_at?: string
          user_id?: string
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          is_recurring: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          id?: string
          is_recurring?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          is_recurring?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_customer_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          coach_user_id: string
          coaching_order_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          coach_user_id: string
          coaching_order_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          coach_user_id?: string
          coaching_order_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_coach_customer_assignments_order"
            columns: ["coaching_order_id"]
            isOneToOne: false
            referencedRelation: "coaching_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_data_retention: {
        Row: {
          coaching_order_id: string | null
          created_at: string | null
          data_category: string
          id: string
          retention_until: string
          status: string | null
        }
        Insert: {
          coaching_order_id?: string | null
          created_at?: string | null
          data_category: string
          id?: string
          retention_until: string
          status?: string | null
        }
        Update: {
          coaching_order_id?: string | null
          created_at?: string | null
          data_category?: string
          id?: string
          retention_until?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaching_data_retention_coaching_order_id_fkey"
            columns: ["coaching_order_id"]
            isOneToOne: false
            referencedRelation: "coaching_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_orders: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          session_notes: string | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          session_notes?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          session_notes?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coaching_staff: {
        Row: {
          active: boolean | null
          created_at: string | null
          department: string | null
          id: string
          role: Database["public"]["Enums"]["coaching_staff_role"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          department?: string | null
          id?: string
          role: Database["public"]["Enums"]["coaching_staff_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          department?: string | null
          id?: string
          role?: Database["public"]["Enums"]["coaching_staff_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customer_details: {
        Row: {
          coaching_order_id: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          dietary_restrictions: string | null
          emergency_contact: string | null
          id: string
          medical_notes: string | null
          updated_at: string | null
        }
        Insert: {
          coaching_order_id?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          dietary_restrictions?: string | null
          emergency_contact?: string | null
          id?: string
          medical_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          coaching_order_id?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          dietary_restrictions?: string | null
          emergency_contact?: string | null
          id?: string
          medical_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_details_coaching_order_id_fkey"
            columns: ["coaching_order_id"]
            isOneToOne: true
            referencedRelation: "coaching_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_grades: {
        Row: {
          base_amount: number
          class_name: string
          created_at: string
          grade: string
          id: string
          reward_amount: number
          student_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_amount?: number
          class_name: string
          created_at?: string
          grade: string
          id?: string
          reward_amount?: number
          student_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_amount?: number
          class_name?: string
          created_at?: string
          grade?: string
          id?: string
          reward_amount?: number
          student_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_cleanup_log: {
        Row: {
          details: Json | null
          id: string
          operation_date: string
          operation_type: string
          records_affected: number
          status: string
          table_name: string
        }
        Insert: {
          details?: Json | null
          id?: string
          operation_date?: string
          operation_type: string
          records_affected?: number
          status?: string
          table_name: string
        }
        Update: {
          details?: Json | null
          id?: string
          operation_date?: string
          operation_type?: string
          records_affected?: number
          status?: string
          table_name?: string
        }
        Relationships: []
      }
      data_retention_config: {
        Row: {
          archive_after_days: number
          created_at: string
          id: string
          last_cleanup: string | null
          retention_days: number
          table_name: string
          updated_at: string
        }
        Insert: {
          archive_after_days: number
          created_at?: string
          id?: string
          last_cleanup?: string | null
          retention_days: number
          table_name: string
          updated_at?: string
        }
        Update: {
          archive_after_days?: number
          created_at?: string
          id?: string
          last_cleanup?: string | null
          retention_days?: number
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      edge_function_debug_log: {
        Row: {
          created_at: string | null
          function_name: string
          id: number
          log_data: Json
        }
        Insert: {
          created_at?: string | null
          function_name: string
          id?: number
          log_data: Json
        }
        Update: {
          created_at?: string | null
          function_name?: string
          id?: number
          log_data?: Json
        }
        Relationships: []
      }
      family_meetings: {
        Row: {
          attendees: string[] | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          scheduled_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendees?: string[] | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendees?: string[] | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_interest: {
        Row: {
          created_at: string
          feature_id: string
          id: string
          interested_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_id: string
          id?: string
          interested_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature_id?: string
          id?: string
          interested_at?: string
          user_id?: string
        }
        Relationships: []
      }
      grade_reporting_periods: {
        Row: {
          created_at: string
          due_date: string
          grades_submitted: number
          id: string
          period_end: string
          period_start: string
          status: string
          student_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date: string
          grades_submitted?: number
          id?: string
          period_end: string
          period_start: string
          status?: string
          student_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          grades_submitted?: number
          id?: string
          period_end?: string
          period_start?: string
          status?: string
          student_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      influencer_payouts: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string | null
          id: string
          influencer_id: string | null
          period_end: string
          period_start: string
          referral_count: number
          status: string | null
          stripe_transfer_id: string | null
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          influencer_id?: string | null
          period_end: string
          period_start: string
          referral_count: number
          status?: string | null
          stripe_transfer_id?: string | null
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          influencer_id?: string | null
          period_end?: string
          period_start?: string
          referral_count?: number
          status?: string | null
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_payouts_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_promo_codes: {
        Row: {
          code: string
          created_at: string | null
          discount_percent: number | null
          id: string
          influencer_id: string | null
          is_active: boolean | null
          stripe_coupon_id: string
          stripe_promo_code_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_percent?: number | null
          id?: string
          influencer_id?: string | null
          is_active?: boolean | null
          stripe_coupon_id: string
          stripe_promo_code_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_percent?: number | null
          id?: string
          influencer_id?: string | null
          is_active?: boolean | null
          stripe_coupon_id?: string
          stripe_promo_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_promo_codes_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_referrals: {
        Row: {
          commission_amount_cents: number
          confirmed_at: string | null
          id: string
          influencer_id: string | null
          paid_at: string | null
          promo_code_id: string | null
          referred_at: string | null
          status: string | null
          stripe_customer_id: string
          stripe_subscription_id: string
          subscription_amount_cents: number
        }
        Insert: {
          commission_amount_cents: number
          confirmed_at?: string | null
          id?: string
          influencer_id?: string | null
          paid_at?: string | null
          promo_code_id?: string | null
          referred_at?: string | null
          status?: string | null
          stripe_customer_id: string
          stripe_subscription_id: string
          subscription_amount_cents: number
        }
        Update: {
          commission_amount_cents?: number
          confirmed_at?: string | null
          id?: string
          influencer_id?: string | null
          paid_at?: string | null
          promo_code_id?: string | null
          referred_at?: string | null
          status?: string | null
          stripe_customer_id?: string
          stripe_subscription_id?: string
          subscription_amount_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "influencer_referrals_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_referrals_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "influencer_promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      influencers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          status: string | null
          stripe_connect_account_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          status?: string | null
          stripe_connect_account_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          status?: string | null
          stripe_connect_account_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      meeting_assessments: {
        Row: {
          communication_rating: number
          created_at: string
          goal_progress_rating: number
          id: string
          meeting_id: string
          notes: string | null
          overall_rating: number
          participation_rating: number
          student_id: string
          student_name: string
          updated_at: string
        }
        Insert: {
          communication_rating: number
          created_at?: string
          goal_progress_rating: number
          id?: string
          meeting_id: string
          notes?: string | null
          overall_rating: number
          participation_rating: number
          student_id: string
          student_name: string
          updated_at?: string
        }
        Update: {
          communication_rating?: number
          created_at?: string
          goal_progress_rating?: number
          id?: string
          meeting_id?: string
          notes?: string | null
          overall_rating?: number
          participation_rating?: number
          student_id?: string
          student_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_assessments_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "family_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_pending_assessments: {
        Row: {
          attitude: number
          cooperation: number
          courtesy: number
          created_at: string
          date: string
          diet: number
          exercise: number
          hygiene: number
          id: string
          originated_by: string | null
          parent_notes: string | null
          parent_user_id: string | null
          respect: number
          responsibilities: number
          reviewed_at: string | null
          score_disputes: Json | null
          service: number
          status:
            | Database["public"]["Enums"]["behavior_assessment_status"]
            | null
          student_display_name: string | null
          student_id: string | null
          student_user_id: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
          work: number
        }
        Insert: {
          attitude?: number
          cooperation?: number
          courtesy?: number
          created_at?: string
          date: string
          diet?: number
          exercise?: number
          hygiene?: number
          id?: string
          originated_by?: string | null
          parent_notes?: string | null
          parent_user_id?: string | null
          respect?: number
          responsibilities?: number
          reviewed_at?: string | null
          score_disputes?: Json | null
          service?: number
          status?:
            | Database["public"]["Enums"]["behavior_assessment_status"]
            | null
          student_display_name?: string | null
          student_id?: string | null
          student_user_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          work?: number
        }
        Update: {
          attitude?: number
          cooperation?: number
          courtesy?: number
          created_at?: string
          date?: string
          diet?: number
          exercise?: number
          hygiene?: number
          id?: string
          originated_by?: string | null
          parent_notes?: string | null
          parent_user_id?: string | null
          respect?: number
          responsibilities?: number
          reviewed_at?: string | null
          score_disputes?: Json | null
          service?: number
          status?:
            | Database["public"]["Enums"]["behavior_assessment_status"]
            | null
          student_display_name?: string | null
          student_id?: string | null
          student_user_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          work?: number
        }
        Relationships: [
          {
            foreignKeyName: "behavior_assessments_duplicate_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_pending_grades: {
        Row: {
          base_amount: number | null
          created_at: string | null
          grade: string
          id: string
          originated_by: string | null
          parent_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          student_display_name: string | null
          student_user_id: string
          subject: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          base_amount?: number | null
          created_at?: string | null
          grade: string
          id: string
          originated_by?: string | null
          parent_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          student_display_name?: string | null
          student_user_id: string
          subject: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          base_amount?: number | null
          created_at?: string | null
          grade?: string
          id?: string
          originated_by?: string | null
          parent_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          student_display_name?: string | null
          student_user_id?: string
          subject?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      parent_profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_completed: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      parent_student_relationships: {
        Row: {
          created_at: string
          id: string
          parent_user_id: string
          relationship_type: string | null
          student_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_user_id: string
          relationship_type?: string | null
          student_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_user_id?: string
          relationship_type?: string | null
          student_user_id?: string
        }
        Relationships: []
      }
      payment_audit_log: {
        Row: {
          amount_cents: number | null
          created_at: string
          currency: string | null
          event_type: string
          id: string
          new_state: Json | null
          previous_state: Json | null
          stripe_customer_id: string
          stripe_event_id: string
          stripe_invoice_id: string | null
          stripe_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          event_type: string
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          stripe_customer_id: string
          stripe_event_id: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          event_type?: string
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          stripe_customer_id?: string
          stripe_event_id?: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          error_message: string | null
          id: string
          metadata: Json | null
          payment_id: string
          payment_method: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          payment_id: string
          payment_method?: string | null
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string
          payment_method?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      public_pricing: {
        Row: {
          annual_price: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          features: string[] | null
          id: string
          is_popular: boolean | null
          is_visible: boolean | null
          monthly_price: number | null
          plan_name: string
          plan_type: string
          updated_at: string | null
        }
        Insert: {
          annual_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          features?: string[] | null
          id?: string
          is_popular?: boolean | null
          is_visible?: boolean | null
          monthly_price?: number | null
          plan_name: string
          plan_type: string
          updated_at?: string | null
        }
        Update: {
          annual_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          features?: string[] | null
          id?: string
          is_popular?: boolean | null
          is_visible?: boolean | null
          monthly_price?: number | null
          plan_name?: string
          plan_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      question_of_day_results: {
        Row: {
          created_at: string
          date: string
          id: string
          passed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          passed: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          passed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resource_downloads: {
        Row: {
          downloaded_at: string
          id: string
          resource_name: string
          resource_type: string
          user_id: string
        }
        Insert: {
          downloaded_at?: string
          id?: string
          resource_name: string
          resource_type: string
          user_id: string
        }
        Update: {
          downloaded_at?: string
          id?: string
          resource_name?: string
          resource_type?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          completed_at: string | null
          created_at: string
          current_amount: number
          goal_emoji: string | null
          goal_name: string
          id: string
          is_active: boolean
          priority: number | null
          student_id: string | null
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          goal_emoji?: string | null
          goal_name: string
          id?: string
          is_active?: boolean
          priority?: number | null
          student_id?: string | null
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          goal_emoji?: string | null
          goal_name?: string
          id?: string
          is_active?: boolean
          priority?: number | null
          student_id?: string | null
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_prices: {
        Row: {
          "Aggregate Usage": string | null
          Amount: number | null
          "Billing Scheme": string | null
          "Created (UTC)": string | null
          Currency: string | null
          Description: string | null
          Interval: string | null
          "Interval Count": string | null
          "Price ID": string | null
          "Product ID": string | null
          "Product Name": string
          "Product Statement Descriptor": string | null
          "Product Tax Code": string | null
          "Tax Behavior": string | null
          "Trial Period Days": string | null
          "Usage Type": string | null
        }
        Insert: {
          "Aggregate Usage"?: string | null
          Amount?: number | null
          "Billing Scheme"?: string | null
          "Created (UTC)"?: string | null
          Currency?: string | null
          Description?: string | null
          Interval?: string | null
          "Interval Count"?: string | null
          "Price ID"?: string | null
          "Product ID"?: string | null
          "Product Name": string
          "Product Statement Descriptor"?: string | null
          "Product Tax Code"?: string | null
          "Tax Behavior"?: string | null
          "Trial Period Days"?: string | null
          "Usage Type"?: string | null
        }
        Update: {
          "Aggregate Usage"?: string | null
          Amount?: number | null
          "Billing Scheme"?: string | null
          "Created (UTC)"?: string | null
          Currency?: string | null
          Description?: string | null
          Interval?: string | null
          "Interval Count"?: string | null
          "Price ID"?: string | null
          "Product ID"?: string | null
          "Product Name"?: string
          "Product Statement Descriptor"?: string | null
          "Product Tax Code"?: string | null
          "Tax Behavior"?: string | null
          "Trial Period Days"?: string | null
          "Usage Type"?: string | null
        }
        Relationships: []
      }
      stripe_products: {
        Row: {
          "Date (UTC)": string | null
          Description: string | null
          id: string | null
          Name: string
          "Statement Descriptor": string | null
          "Tax Code": string | null
          Type: string | null
          "Unit Label": string | null
          Url: string | null
        }
        Insert: {
          "Date (UTC)"?: string | null
          Description?: string | null
          id?: string | null
          Name: string
          "Statement Descriptor"?: string | null
          "Tax Code"?: string | null
          Type?: string | null
          "Unit Label"?: string | null
          Url?: string | null
        }
        Update: {
          "Date (UTC)"?: string | null
          Description?: string | null
          id?: string | null
          Name?: string
          "Statement Descriptor"?: string | null
          "Tax Code"?: string | null
          Type?: string | null
          "Unit Label"?: string | null
          Url?: string | null
        }
        Relationships: []
      }
      student_badges: {
        Row: {
          badge_data: Json
          created_at: string
          id: string
          student_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          badge_data: Json
          created_at?: string
          id?: string
          student_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          badge_data?: Json
          created_at?: string
          id?: string
          student_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_grades: {
        Row: {
          base_amount: number
          created_at: string
          grade: string
          id: string
          originated_by: string | null
          parent_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_user_id: string
          subject: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          base_amount?: number
          created_at?: string
          grade: string
          id?: string
          originated_by?: string | null
          parent_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_user_id: string
          subject: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          base_amount?: number
          created_at?: string
          grade?: string
          id?: string
          originated_by?: string | null
          parent_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_user_id?: string
          subject?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          base_reward_amount: number
          created_at: string
          custom_frequency_days: number | null
          email: string | null
          grade_level: string
          has_completed_onboarding: boolean | null
          id: string
          is_active: boolean
          last_qod_date: string | null
          last_report_submitted: string | null
          longest_streak: number
          name: string
          next_report_due: string | null
          reporting_frequency: string
          streak_count: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          base_reward_amount?: number
          created_at?: string
          custom_frequency_days?: number | null
          email?: string | null
          grade_level: string
          has_completed_onboarding?: boolean | null
          id?: string
          is_active?: boolean
          last_qod_date?: string | null
          last_report_submitted?: string | null
          longest_streak?: number
          name: string
          next_report_due?: string | null
          reporting_frequency?: string
          streak_count?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          base_reward_amount?: number
          created_at?: string
          custom_frequency_days?: number | null
          email?: string | null
          grade_level?: string
          has_completed_onboarding?: boolean | null
          id?: string
          is_active?: boolean
          last_qod_date?: string | null
          last_report_submitted?: string | null
          longest_streak?: number
          name?: string
          next_report_due?: string | null
          reporting_frequency?: string
          streak_count?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
          student_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: string
          student_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
          student_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_downgrades: {
        Row: {
          created_at: string
          downgrade_date: string
          from_subscription_type: string
          grace_period_expires: string
          id: string
          max_students_after: number
          students_before_downgrade: number
          to_subscription_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          downgrade_date?: string
          from_subscription_type: string
          grace_period_expires: string
          id?: string
          max_students_after: number
          students_before_downgrade: number
          to_subscription_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          downgrade_date?: string
          from_subscription_type?: string
          grace_period_expires?: string
          id?: string
          max_students_after?: number
          students_before_downgrade?: number
          to_subscription_type?: string
          user_id?: string
        }
        Relationships: []
      }
      term_configs: {
        Row: {
          created_at: string
          current_term_end: string
          current_term_start: string
          id: string
          term_length: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_term_end: string
          current_term_start: string
          id?: string
          term_length: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_term_end?: string
          current_term_start?: string
          id?: string
          term_length?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      term_snapshots: {
        Row: {
          allocation_breakdown: Json | null
          behavior_earnings: number
          created_at: string
          gpa: number | null
          grade_earnings: number
          grades_data: Json | null
          id: string
          term_end: string
          term_number: number
          term_start: string
          total_earnings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          allocation_breakdown?: Json | null
          behavior_earnings?: number
          created_at?: string
          gpa?: number | null
          grade_earnings?: number
          grades_data?: Json | null
          id?: string
          term_end: string
          term_number: number
          term_start: string
          total_earnings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          allocation_breakdown?: Json | null
          behavior_earnings?: number
          created_at?: string
          gpa?: number | null
          grade_earnings?: number
          grades_data?: Json | null
          id?: string
          term_end?: string
          term_number?: number
          term_start?: string
          total_earnings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          downgrade_effective_date: string | null
          grace_period_expires: string | null
          grace_period_warnings_sent: number | null
          id: number
          previous_subscription_type: string | null
          price_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          downgrade_effective_date?: string | null
          grace_period_expires?: string | null
          grace_period_warnings_sent?: number | null
          id?: never
          previous_subscription_type?: string | null
          price_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          downgrade_effective_date?: string | null
          grace_period_expires?: string | null
          grace_period_warnings_sent?: number | null
          id?: never
          previous_subscription_type?: string | null
          price_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tour_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          last_step_index: number | null
          tour_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_step_index?: number | null
          tour_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_step_index?: number | null
          tour_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          parent_id: string | null
          updated_at: string
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          parent_id?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          parent_id?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json | null
          processed_at: string | null
          processing_time_ms: number | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          processing_time_ms?: number | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          processing_time_ms?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      student_assessment_history: {
        Row: {
          attitude: number | null
          cooperation: number | null
          courtesy: number | null
          created_at: string | null
          date: string | null
          diet: number | null
          exercise: number | null
          hygiene: number | null
          id: string | null
          parent_display_name: string | null
          parent_email: string | null
          parent_notes: string | null
          parent_user_id: string | null
          respect: number | null
          responsibilities: number | null
          reviewed_at: string | null
          service: number | null
          status: string | null
          student_id: string | null
          student_user_id: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string | null
          work: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_behavior_assessment: {
        Args: {
          assessment_id: string
          parent_notes?: string
          parent_user_id: string
        }
        Returns: string
      }
      approve_student_grade: {
        Args: {
          grade_id: string
          parent_notes?: string
          parent_user_id: string
        }
        Returns: string
      }
      archive_old_behavior_assessments: { Args: never; Returns: number }
      calculate_next_report_due: {
        Args: { custom_days?: number; frequency: string; last_report?: string }
        Returns: string
      }
      cleanup_expired_coaching_data: { Args: never; Returns: number }
      cleanup_old_archived_data: { Args: never; Returns: number }
      cleanup_old_assessments: {
        Args: never
        Returns: {
          deleted_count: number
          summary_count: number
        }[]
      }
      create_parent_assessment: {
        Args: {
          p_date: string
          p_parent_user_id: string
          p_scores: Json
          p_student_user_id: string
        }
        Returns: string
      }
      create_parent_student_relationship: {
        Args: { parent_user_id: string; student_user_id: string }
        Returns: string
      }
      create_reporting_period: {
        Args: { custom_days?: number; frequency: string; student_id: string }
        Returns: string
      }
      delete_student_centsible_accounts: { Args: never; Returns: number }
      delete_user_data: { Args: { target_user_id: string }; Returns: Json }
      generate_secure_password: { Args: never; Returns: string }
      get_grade_conflicts: {
        Args: { p_student_user_id: string }
        Returns: {
          parent_grade: string
          parent_grade_id: string
          parent_originated_by: string
          student_grade: string
          student_grade_id: string
          student_originated_by: string
          subject: string
        }[]
      }
      get_max_students_allowed: {
        Args: { parent_user_id: string }
        Returns: number
      }
      get_student_number: { Args: { student_user_id: string }; Returns: number }
      get_users_in_grace_period: {
        Args: never
        Returns: {
          current_student_count: number
          days_remaining: number
          grace_period_expires: string
          max_allowed: number
          previous_subscription_type: string
          subscription_type: string
          user_id: string
        }[]
      }
      has_active_subscription: { Args: { user_uuid: string }; Returns: boolean }
      has_coaching_access: { Args: { user_uuid: string }; Returns: boolean }
      has_premium_subscription: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_admin_user: { Args: { user_uuid: string }; Returns: boolean }
      is_coaching_staff: {
        Args: {
          required_role?: Database["public"]["Enums"]["coaching_staff_role"]
          user_uuid: string
        }
        Returns: boolean
      }
      is_parent: { Args: { user_uuid: string }; Returns: boolean }
      is_premium_user: { Args: { user_uuid: string }; Returns: boolean }
      is_student: { Args: { user_uuid: string }; Returns: boolean }
      migrate_existing_behavior_assessments: { Args: never; Returns: undefined }
      parent_resolve_dispute: {
        Args: {
          p_assessment_id: string
          p_new_score: number
          p_parent_user_id: string
          p_resolution_notes: string
          p_score_field: string
        }
        Returns: undefined
      }
      reject_student_grade: {
        Args: {
          grade_id: string
          parent_notes?: string
          parent_user_id: string
        }
        Returns: undefined
      }
      request_assessment_cleanup: {
        Args: never
        Returns: {
          deleted_count: number
          message: string
          success: boolean
          summary_count: number
        }[]
      }
      request_behavior_assessment_revision: {
        Args: {
          assessment_id: string
          parent_notes: string
          parent_user_id: string
        }
        Returns: undefined
      }
      request_grade_revision: {
        Args: {
          grade_id: string
          parent_notes?: string
          parent_user_id: string
        }
        Returns: undefined
      }
      student_acknowledge_assessment: {
        Args: { p_assessment_id: string; p_student_user_id: string }
        Returns: undefined
      }
      student_dispute_score: {
        Args: {
          p_assessment_id: string
          p_comment: string
          p_score_field: string
          p_student_user_id: string
        }
        Returns: undefined
      }
      update_missed_meetings: { Args: never; Returns: undefined }
      validate_parent_access: {
        Args: { parent_user_id: string }
        Returns: boolean
      }
      validate_student_limit: {
        Args: { parent_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      behavior_assessment_status:
        | "draft"
        | "submitted"
        | "approved"
        | "needs_revision"
        | "parent_submitted"
        | "student_disputed"
        | "student_acknowledged"
      coaching_staff_role: "coach" | "admin" | "support"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      behavior_assessment_status: [
        "draft",
        "submitted",
        "approved",
        "needs_revision",
        "parent_submitted",
        "student_disputed",
        "student_acknowledged",
      ],
      coaching_staff_role: ["coach", "admin", "support"],
    },
  },
} as const
