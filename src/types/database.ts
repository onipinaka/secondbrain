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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ads_tracker: {
        Row: {
          budget: number | null
          campaign: string
          created_at: string | null
          id: string
          notes: string | null
          platform: string | null
          results: string | null
          roi: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          budget?: number | null
          campaign: string
          created_at?: string | null
          id?: string
          notes?: string | null
          platform?: string | null
          results?: string | null
          roi?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          budget?: number | null
          campaign?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          platform?: string | null
          results?: string | null
          roi?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_tracker_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      body_metrics: {
        Row: {
          arms_cm: number | null
          body_fat_percent: number | null
          chest_cm: number | null
          created_at: string | null
          id: string
          log_date: string
          notes: string | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          arms_cm?: number | null
          body_fat_percent?: number | null
          chest_cm?: number | null
          created_at?: string | null
          id?: string
          log_date: string
          notes?: string | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          arms_cm?: number | null
          body_fat_percent?: number | null
          chest_cm?: number | null
          created_at?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string | null
          category: string | null
          created_at: string | null
          current_page: number | null
          finished_date: string | null
          id: string
          key_takeaways: string | null
          notes: string | null
          rating: number | null
          started_date: string | null
          status: string | null
          title: string
          total_pages: number | null
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          current_page?: number | null
          finished_date?: string | null
          id?: string
          key_takeaways?: string | null
          notes?: string | null
          rating?: number | null
          started_date?: string | null
          status?: string | null
          title: string
          total_pages?: number | null
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          current_page?: number | null
          finished_date?: string | null
          id?: string
          key_takeaways?: string | null
          notes?: string | null
          rating?: number | null
          started_date?: string | null
          status?: string | null
          title?: string
          total_pages?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      calisthenics_sessions: {
        Row: {
          created_at: string | null
          duration_mins: number | null
          id: string
          log_date: string
          notes: string | null
          skills_practiced: string | null
        }
        Insert: {
          created_at?: string | null
          duration_mins?: number | null
          id?: string
          log_date: string
          notes?: string | null
          skills_practiced?: string | null
        }
        Update: {
          created_at?: string | null
          duration_mins?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          skills_practiced?: string | null
        }
        Relationships: []
      }
      calisthenics_skills: {
        Row: {
          created_at: string | null
          current_level: string | null
          id: string
          progression_plan: string | null
          skill: string
          target_level: string | null
          training_notes: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          current_level?: string | null
          id?: string
          progression_plan?: string | null
          skill: string
          target_level?: string | null
          training_notes?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          current_level?: string | null
          id?: string
          progression_plan?: string | null
          skill?: string
          target_level?: string | null
          training_notes?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      calories_log: {
        Row: {
          created_at: string | null
          goal: number | null
          id: string
          log_date: string
          notes: string | null
          total_calories: number | null
        }
        Insert: {
          created_at?: string | null
          goal?: number | null
          id?: string
          log_date: string
          notes?: string | null
          total_calories?: number | null
        }
        Update: {
          created_at?: string | null
          goal?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          total_calories?: number | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          amount_inr: number | null
          created_at: string | null
          deadline: string | null
          deliverables: string | null
          id: string
          invoice_status: string | null
          login_credentials: string | null
          name: string
          niche: string | null
          notes: string | null
          progress_percent: number | null
          project_type: string | null
          satisfaction_notes: string | null
          start_date: string | null
          updated_at: string | null
          upsell_opportunities: string | null
          workspace_id: string | null
        }
        Insert: {
          amount_inr?: number | null
          created_at?: string | null
          deadline?: string | null
          deliverables?: string | null
          id?: string
          invoice_status?: string | null
          login_credentials?: string | null
          name: string
          niche?: string | null
          notes?: string | null
          progress_percent?: number | null
          project_type?: string | null
          satisfaction_notes?: string | null
          start_date?: string | null
          updated_at?: string | null
          upsell_opportunities?: string | null
          workspace_id?: string | null
        }
        Update: {
          amount_inr?: number | null
          created_at?: string | null
          deadline?: string | null
          deliverables?: string | null
          id?: string
          invoice_status?: string | null
          login_credentials?: string | null
          name?: string
          niche?: string | null
          notes?: string | null
          progress_percent?: number | null
          project_type?: string | null
          satisfaction_notes?: string | null
          start_date?: string | null
          updated_at?: string | null
          upsell_opportunities?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          content_idea: string
          created_at: string | null
          id: string
          performance_notes: string | null
          platform: string | null
          scheduled_date: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          content_idea: string
          created_at?: string | null
          id?: string
          performance_notes?: string | null
          platform?: string | null
          scheduled_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          content_idea?: string
          created_at?: string | null
          id?: string
          performance_notes?: string | null
          platform?: string | null
          scheduled_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contests: {
        Row: {
          contest_date: string | null
          created_at: string | null
          duration: string | null
          id: string
          name: string
          notes: string | null
          participated: boolean | null
          platform: string
          problems_solved: number | null
          rank: number | null
          rating_after: number | null
          rating_before: number | null
          registered: boolean | null
        }
        Insert: {
          contest_date?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          name: string
          notes?: string | null
          participated?: boolean | null
          platform: string
          problems_solved?: number | null
          rank?: number | null
          rating_after?: number | null
          rating_before?: number | null
          registered?: boolean | null
        }
        Update: {
          contest_date?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          name?: string
          notes?: string | null
          participated?: boolean | null
          platform?: string
          problems_solved?: number | null
          rank?: number | null
          rating_after?: number | null
          rating_before?: number | null
          registered?: boolean | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string | null
          current_unit: number | null
          has_certificate: boolean | null
          id: string
          name: string
          notes: string | null
          platform: string | null
          status: string | null
          total_units: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_unit?: number | null
          has_certificate?: boolean | null
          id?: string
          name: string
          notes?: string | null
          platform?: string | null
          status?: string | null
          total_units?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_unit?: number | null
          has_certificate?: boolean | null
          id?: string
          name?: string
          notes?: string | null
          platform?: string | null
          status?: string | null
          total_units?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cp_rating_tracker: {
        Row: {
          created_at: string | null
          id: string
          log_date: string
          platform: string
          rating: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_date: string
          platform: string
          rating: number
        }
        Update: {
          created_at?: string | null
          id?: string
          log_date?: string
          platform?: string
          rating?: number
        }
        Relationships: []
      }
      daily_planner: {
        Row: {
          ai_generated: boolean | null
          created_at: string | null
          custom_prompt_used: string | null
          day_rating: number | null
          end_of_day_reflection: string | null
          id: string
          morning_intention: string | null
          plan_date: string
          time_block_plan: string | null
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string | null
          custom_prompt_used?: string | null
          day_rating?: number | null
          end_of_day_reflection?: string | null
          id?: string
          morning_intention?: string | null
          plan_date: string
          time_block_plan?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string | null
          custom_prompt_used?: string | null
          day_rating?: number | null
          end_of_day_reflection?: string | null
          id?: string
          morning_intention?: string | null
          plan_date?: string
          time_block_plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      diet_log: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string | null
          fats_g: number | null
          id: string
          log_date: string
          meal: string
          notes: string | null
          protein_g: number | null
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          fats_g?: number | null
          id?: string
          log_date: string
          meal: string
          notes?: string | null
          protein_g?: number | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          fats_g?: number | null
          id?: string
          log_date?: string
          meal?: string
          notes?: string | null
          protein_g?: number | null
        }
        Relationships: []
      }
      editorial_reviews: {
        Row: {
          contest_name: string | null
          correct_approach: string | null
          created_at: string | null
          date_reviewed: string | null
          id: string
          problem_name: string
          question_id: string | null
          what_went_wrong: string | null
        }
        Insert: {
          contest_name?: string | null
          correct_approach?: string | null
          created_at?: string | null
          date_reviewed?: string | null
          id?: string
          problem_name: string
          question_id?: string | null
          what_went_wrong?: string | null
        }
        Update: {
          contest_name?: string | null
          correct_approach?: string | null
          created_at?: string | null
          date_reviewed?: string | null
          id?: string
          problem_name?: string
          question_id?: string | null
          what_went_wrong?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "editorial_reviews_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          equipment: string | null
          form_notes: string | null
          id: string
          muscle_group: string | null
          name: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          equipment?: string | null
          form_notes?: string | null
          id?: string
          muscle_group?: string | null
          name: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          equipment?: string | null
          form_notes?: string | null
          id?: string
          muscle_group?: string | null
          name?: string
          video_url?: string | null
        }
        Relationships: []
      }
      geopolitics_notes: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          key_learnings: string | null
          log_date: string | null
          region: string | null
          tags: string[] | null
          topic: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          key_learnings?: string | null
          log_date?: string | null
          region?: string | null
          tags?: string[] | null
          topic: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          key_learnings?: string | null
          log_date?: string | null
          region?: string | null
          tags?: string[] | null
          topic?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string | null
          deadline: string | null
          goal: string
          id: string
          progress_notes: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          why_it_matters: string | null
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          goal: string
          id?: string
          progress_notes?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          why_it_matters?: string | null
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          goal?: string
          id?: string
          progress_notes?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          why_it_matters?: string | null
        }
        Relationships: []
      }
      grammar_points: {
        Row: {
          created_at: string | null
          examples: string | null
          grammar_point: string
          id: string
          jlpt_level: string | null
          mastered: boolean | null
          meaning: string | null
          notes: string | null
          structure: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          examples?: string | null
          grammar_point: string
          id?: string
          jlpt_level?: string | null
          mastered?: boolean | null
          meaning?: string | null
          notes?: string | null
          structure?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          examples?: string | null
          grammar_point?: string
          id?: string
          jlpt_level?: string | null
          mastered?: boolean | null
          meaning?: string | null
          notes?: string | null
          structure?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gratitude_log: {
        Row: {
          created_at: string | null
          id: string
          log_date: string
          notes: string | null
          thing_1: string | null
          thing_2: string | null
          thing_3: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_date: string
          notes?: string | null
          thing_1?: string | null
          thing_2?: string | null
          thing_3?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          thing_1?: string | null
          thing_2?: string | null
          thing_3?: string | null
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string | null
          done: boolean | null
          habit_id: string | null
          id: string
          log_date: string
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          done?: boolean | null
          habit_id?: string | null
          id?: string
          log_date: string
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          done?: boolean | null
          habit_id?: string | null
          id?: string
          log_date?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      immersion_log: {
        Row: {
          comprehension: number | null
          content: string | null
          created_at: string | null
          duration_mins: number | null
          id: string
          log_date: string
          notes: string | null
          topic: string | null
          type: string | null
        }
        Insert: {
          comprehension?: number | null
          content?: string | null
          created_at?: string | null
          duration_mins?: number | null
          id?: string
          log_date: string
          notes?: string | null
          topic?: string | null
          type?: string | null
        }
        Update: {
          comprehension?: number | null
          content?: string | null
          created_at?: string | null
          duration_mins?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          topic?: string | null
          type?: string | null
        }
        Relationships: []
      }
      interview_qa: {
        Row: {
          confidence: string | null
          created_at: string | null
          id: string
          my_answer: string | null
          question: string
          source: string | null
          topic_id: string | null
          type: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          confidence?: string | null
          created_at?: string | null
          id?: string
          my_answer?: string | null
          question: string
          source?: string | null
          topic_id?: string | null
          type?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          confidence?: string | null
          created_at?: string | null
          id?: string
          my_answer?: string | null
          question?: string
          source?: string | null
          topic_id?: string | null
          type?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_qa_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_qa_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          created_at: string | null
          difficulty: string | null
          id: string
          issue_number: number | null
          issue_url: string | null
          notes: string | null
          repo_id: string | null
          repo_name: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          issue_number?: number | null
          issue_url?: string | null
          notes?: string | null
          repo_id?: string | null
          repo_name?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          issue_number?: number | null
          issue_url?: string | null
          notes?: string | null
          repo_id?: string | null
          repo_name?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "repos"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: Json | null
          created_at: string | null
          entry_date: string
          id: string
          mood: number | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          entry_date: string
          id?: string
          mood?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          entry_date?: string
          id?: string
          mood?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      kanji: {
        Row: {
          character: string
          created_at: string | null
          example_words: string | null
          id: string
          jlpt_level: string | null
          kun_reading: string | null
          mastered: boolean | null
          meaning: string | null
          on_reading: string | null
          stroke_count: number | null
          updated_at: string | null
        }
        Insert: {
          character: string
          created_at?: string | null
          example_words?: string | null
          id?: string
          jlpt_level?: string | null
          kun_reading?: string | null
          mastered?: boolean | null
          meaning?: string | null
          on_reading?: string | null
          stroke_count?: number | null
          updated_at?: string | null
        }
        Update: {
          character?: string
          created_at?: string | null
          example_words?: string | null
          id?: string
          jlpt_level?: string | null
          kun_reading?: string | null
          mastered?: boolean | null
          meaning?: string | null
          on_reading?: string | null
          stroke_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          best_time_to_call: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          last_contact: string | null
          mobile: string | null
          name: string
          next_follow_up: string | null
          niche: string | null
          notes: string | null
          response: string | null
          response_rate: number | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          whatsapp: string | null
          whatsapp_template_used: string | null
          workspace_id: string | null
        }
        Insert: {
          best_time_to_call?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          mobile?: string | null
          name: string
          next_follow_up?: string | null
          niche?: string | null
          notes?: string | null
          response?: string | null
          response_rate?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          whatsapp?: string | null
          whatsapp_template_used?: string | null
          workspace_id?: string | null
        }
        Update: {
          best_time_to_call?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          mobile?: string | null
          name?: string
          next_follow_up?: string | null
          niche?: string | null
          notes?: string | null
          response?: string | null
          response_rate?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          whatsapp?: string | null
          whatsapp_template_used?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      meditation_log: {
        Row: {
          created_at: string | null
          duration_mins: number | null
          id: string
          log_date: string
          mood_after: number | null
          mood_before: number | null
          notes: string | null
          resource: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          duration_mins?: number | null
          id?: string
          log_date: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          resource?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          duration_mins?: number | null
          id?: string
          log_date?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          resource?: string | null
          type?: string | null
        }
        Relationships: []
      }
      niche_findings: {
        Row: {
          best_hooks: string | null
          best_platforms: string | null
          common_objections: string | null
          created_at: string | null
          discovery_insights: string | null
          dos_and_donts: string | null
          general_notes: string | null
          id: string
          niche: string
          pricing_notes: string | null
          updated_at: string | null
          what_works: string | null
          workspace_id: string | null
        }
        Insert: {
          best_hooks?: string | null
          best_platforms?: string | null
          common_objections?: string | null
          created_at?: string | null
          discovery_insights?: string | null
          dos_and_donts?: string | null
          general_notes?: string | null
          id?: string
          niche: string
          pricing_notes?: string | null
          updated_at?: string | null
          what_works?: string | null
          workspace_id?: string | null
        }
        Update: {
          best_hooks?: string | null
          best_platforms?: string | null
          common_objections?: string | null
          created_at?: string | null
          discovery_insights?: string | null
          dos_and_donts?: string | null
          general_notes?: string | null
          id?: string
          niche?: string
          pricing_notes?: string | null
          updated_at?: string | null
          what_works?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "niche_findings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      note_pages: {
        Row: {
          content: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          tags: string[] | null
          title: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          application_deadline: string | null
          company: string | null
          contact_person: string | null
          created_at: string | null
          domain: string | null
          duration: string | null
          effort_estimate: string | null
          end_date: string | null
          id: string
          location: string | null
          mode: string | null
          name: string
          notes: string | null
          organizer: string | null
          priority: string | null
          prize_pool: string | null
          registration_deadline: string | null
          role: string | null
          skills_required: string | null
          start_date: string | null
          status: string | null
          stipend: string | null
          team_members: string | null
          team_size: number | null
          theme: string | null
          type: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          application_deadline?: string | null
          company?: string | null
          contact_person?: string | null
          created_at?: string | null
          domain?: string | null
          duration?: string | null
          effort_estimate?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          mode?: string | null
          name: string
          notes?: string | null
          organizer?: string | null
          priority?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          role?: string | null
          skills_required?: string | null
          start_date?: string | null
          status?: string | null
          stipend?: string | null
          team_members?: string | null
          team_size?: number | null
          theme?: string | null
          type: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          application_deadline?: string | null
          company?: string | null
          contact_person?: string | null
          created_at?: string | null
          domain?: string | null
          duration?: string | null
          effort_estimate?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          mode?: string | null
          name?: string
          notes?: string | null
          organizer?: string | null
          priority?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          role?: string | null
          skills_required?: string | null
          start_date?: string | null
          status?: string | null
          stipend?: string | null
          team_members?: string | null
          team_size?: number | null
          theme?: string | null
          type?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      outreach_templates: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          platform: string | null
          success_rate: string | null
          template_text: string | null
          use_case: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          platform?: string | null
          success_rate?: string | null
          template_text?: string | null
          use_case?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          platform?: string | null
          success_rate?: string | null
          template_text?: string | null
          use_case?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pr_tracker: {
        Row: {
          created_at: string | null
          current_max: string | null
          date_achieved: string | null
          exercise_id: string | null
          exercise_name: string
          goal: string | null
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_max?: string | null
          date_achieved?: string | null
          exercise_id?: string | null
          exercise_name: string
          goal?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_max?: string | null
          date_achieved?: string | null
          exercise_id?: string | null
          exercise_name?: string
          goal?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pr_tracker_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      project_bugs: {
        Row: {
          created_at: string | null
          fix_notes: string | null
          id: string
          project_id: string | null
          severity: string | null
          status: string | null
          steps_to_reproduce: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fix_notes?: string | null
          id?: string
          project_id?: string | null
          severity?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fix_notes?: string | null
          id?: string
          project_id?: string | null
          severity?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_bugs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_features: {
        Row: {
          complexity: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          priority: string | null
          project_id: string | null
          sort_order: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          complexity?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          priority?: string | null
          project_id?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          complexity?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          priority?: string | null
          project_id?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_features_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          architecture_notes: string | null
          created_at: string | null
          description: string | null
          github_url: string | null
          id: string
          investor_notes: string | null
          lessons_learned: string | null
          live_url: string | null
          marketing_plan: string | null
          monetization_plan: string | null
          name: string
          progress_percent: number | null
          roadmap: string | null
          start_date: string | null
          status: string | null
          target_audience: string | null
          target_date: string | null
          tech_stack: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          architecture_notes?: string | null
          created_at?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          investor_notes?: string | null
          lessons_learned?: string | null
          live_url?: string | null
          marketing_plan?: string | null
          monetization_plan?: string | null
          name: string
          progress_percent?: number | null
          roadmap?: string | null
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          target_date?: string | null
          tech_stack?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          architecture_notes?: string | null
          created_at?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          investor_notes?: string | null
          lessons_learned?: string | null
          live_url?: string | null
          marketing_plan?: string | null
          monetization_plan?: string | null
          name?: string
          progress_percent?: number | null
          roadmap?: string | null
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          target_date?: string | null
          tech_stack?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pull_requests: {
        Row: {
          complexity: string | null
          created_at: string | null
          date_merged_closed: string | null
          date_submitted: string | null
          description: string | null
          id: string
          notes: string | null
          pr_url: string | null
          rejection_notes: string | null
          repo_id: string | null
          repo_name: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          complexity?: string | null
          created_at?: string | null
          date_merged_closed?: string | null
          date_submitted?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          pr_url?: string | null
          rejection_notes?: string | null
          repo_id?: string | null
          repo_name?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          complexity?: string | null
          created_at?: string | null
          date_merged_closed?: string | null
          date_submitted?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          pr_url?: string | null
          rejection_notes?: string | null
          repo_id?: string | null
          repo_name?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pull_requests_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "repos"
            referencedColumns: ["id"]
          },
        ]
      }
      pushup_log: {
        Row: {
          created_at: string | null
          goal: number | null
          id: string
          log_date: string
          notes: string | null
          personal_best_single_set: number | null
          sets_reps_breakdown: string | null
          total_pushups: number | null
        }
        Insert: {
          created_at?: string | null
          goal?: number | null
          id?: string
          log_date: string
          notes?: string | null
          personal_best_single_set?: number | null
          sets_reps_breakdown?: string | null
          total_pushups?: number | null
        }
        Update: {
          created_at?: string | null
          goal?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          personal_best_single_set?: number | null
          sets_reps_breakdown?: string | null
          total_pushups?: number | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          approach_notes: string | null
          attempts: number | null
          created_at: string | null
          difficulty: string | null
          id: string
          name: string
          platform: string | null
          solution_url: string | null
          status: string | null
          subject: string | null
          tags: string[] | null
          time_taken_mins: number | null
          topic_id: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          approach_notes?: string | null
          attempts?: number | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          name: string
          platform?: string | null
          solution_url?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          time_taken_mins?: number | null
          topic_id?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          approach_notes?: string | null
          attempts?: number | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          name?: string
          platform?: string | null
          solution_url?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          time_taken_mins?: number | null
          topic_id?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_capture: {
        Row: {
          category: string | null
          content: string
          converted_to_id: string | null
          converted_to_type: string | null
          created_at: string | null
          due_date: string | null
          due_time: string | null
          id: string
          is_hard_block: boolean | null
          is_sorted: boolean | null
          person_involved: string | null
          tags: string[] | null
          title: string | null
          type: string
          url: string | null
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          content: string
          converted_to_id?: string | null
          converted_to_type?: string | null
          created_at?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_hard_block?: boolean | null
          is_sorted?: boolean | null
          person_involved?: string | null
          tags?: string[] | null
          title?: string | null
          type: string
          url?: string | null
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          converted_to_id?: string | null
          converted_to_type?: string | null
          created_at?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_hard_block?: boolean | null
          is_sorted?: boolean | null
          person_involved?: string | null
          tags?: string[] | null
          title?: string | null
          type?: string
          url?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_capture_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          author: string | null
          category: string | null
          created_at: string | null
          id: string
          is_favourite: boolean | null
          quote: string
          source: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_favourite?: boolean | null
          quote: string
          source?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_favourite?: boolean | null
          quote?: string
          source?: string | null
        }
        Relationships: []
      }
      repos: {
        Row: {
          created_at: string | null
          difficulty: string | null
          domain: string | null
          github_url: string | null
          has_good_first_issues: boolean | null
          id: string
          language: string | null
          mentor_contacts: string | null
          name: string
          notes: string | null
          organization: string | null
          program: string | null
          stars: number | null
          status: string | null
          updated_at: string | null
          why_interested: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          domain?: string | null
          github_url?: string | null
          has_good_first_issues?: boolean | null
          id?: string
          language?: string | null
          mentor_contacts?: string | null
          name: string
          notes?: string | null
          organization?: string | null
          program?: string | null
          stars?: number | null
          status?: string | null
          updated_at?: string | null
          why_interested?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          domain?: string | null
          github_url?: string | null
          has_good_first_issues?: boolean | null
          id?: string
          language?: string | null
          mentor_contacts?: string | null
          name?: string
          notes?: string | null
          organization?: string | null
          program?: string | null
          stars?: number | null
          status?: string | null
          updated_at?: string | null
          why_interested?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          platform: string | null
          status: string | null
          topic_id: string | null
          total_units: number | null
          type: string | null
          units_done: number | null
          updated_at: string | null
          url: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          platform?: string | null
          status?: string | null
          topic_id?: string | null
          total_units?: number | null
          type?: string | null
          units_done?: number | null
          updated_at?: string | null
          url?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          platform?: string | null
          status?: string | null
          topic_id?: string | null
          total_units?: number | null
          type?: string | null
          units_done?: number | null
          updated_at?: string | null
          url?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_products: {
        Row: {
          created_at: string | null
          github_url: string | null
          id: string
          landing_page_url: string | null
          mrr: number | null
          name: string
          notes: string | null
          progress_percent: number | null
          stage: string | null
          target_customer: string | null
          target_launch_date: string | null
          tech_stack: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          github_url?: string | null
          id?: string
          landing_page_url?: string | null
          mrr?: number | null
          name: string
          notes?: string | null
          progress_percent?: number | null
          stage?: string | null
          target_customer?: string | null
          target_launch_date?: string | null
          tech_stack?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          github_url?: string | null
          id?: string
          landing_page_url?: string | null
          mrr?: number | null
          name?: string
          notes?: string | null
          progress_percent?: number | null
          stage?: string | null
          target_customer?: string | null
          target_launch_date?: string | null
          tech_stack?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          created_at: string | null
          custom_title: string | null
          entity_id: string | null
          entity_type: string
          hours_allocated: number | null
          id: string
          is_hard_block: boolean | null
          notes: string | null
          scheduled_date: string
          status: string | null
          time_end: string | null
          time_start: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_title?: string | null
          entity_id?: string | null
          entity_type: string
          hours_allocated?: number | null
          id?: string
          is_hard_block?: boolean | null
          notes?: string | null
          scheduled_date: string
          status?: string | null
          time_end?: string | null
          time_start?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_title?: string | null
          entity_id?: string | null
          entity_type?: string
          hours_allocated?: number | null
          id?: string
          is_hard_block?: boolean | null
          notes?: string | null
          scheduled_date?: string
          status?: string | null
          time_end?: string | null
          time_start?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          break_duration_mins: number | null
          break_frequency_mins: number | null
          custom_prompt: string | null
          id: string
          peak_energy_end: string | null
          peak_energy_start: string | null
          scheduling_rules: string | null
          today_special_overrides: string | null
          updated_at: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          break_duration_mins?: number | null
          break_frequency_mins?: number | null
          custom_prompt?: string | null
          id?: string
          peak_energy_end?: string | null
          peak_energy_start?: string | null
          scheduling_rules?: string | null
          today_special_overrides?: string | null
          updated_at?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          break_duration_mins?: number | null
          break_frequency_mins?: number | null
          custom_prompt?: string | null
          id?: string
          peak_energy_end?: string | null
          peak_energy_start?: string | null
          scheduling_rules?: string | null
          today_special_overrides?: string | null
          updated_at?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      steps_log: {
        Row: {
          created_at: string | null
          goal: number | null
          id: string
          log_date: string
          notes: string | null
          steps: number | null
        }
        Insert: {
          created_at?: string | null
          goal?: number | null
          id?: string
          log_date: string
          notes?: string | null
          steps?: number | null
        }
        Update: {
          created_at?: string | null
          goal?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          steps?: number | null
        }
        Relationships: []
      }
      supplement_tracker: {
        Row: {
          created_at: string | null
          days_taken_this_week: number | null
          dose: string | null
          id: string
          name: string
          notes: string | null
          time_of_day: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_taken_this_week?: number | null
          dose?: string | null
          id?: string
          name: string
          notes?: string | null
          time_of_day?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_taken_this_week?: number | null
          dose?: string | null
          id?: string
          name?: string
          notes?: string | null
          time_of_day?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          effort: string | null
          id: string
          linked_project_id: string | null
          priority: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          effort?: string | null
          id?: string
          linked_project_id?: string | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          effort?: string | null
          id?: string
          linked_project_id?: string | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_linked_project_fkey"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string | null
          difficulty: string | null
          hours_allocated: number | null
          hours_spent: number | null
          id: string
          interview_frequency: string | null
          last_studied: string | null
          name: string
          next_revision: string | null
          priority: number | null
          sort_order: number | null
          status: string | null
          type: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          hours_allocated?: number | null
          hours_spent?: number | null
          id?: string
          interview_frequency?: string | null
          last_studied?: string | null
          name: string
          next_revision?: string | null
          priority?: number | null
          sort_order?: number | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          hours_allocated?: number | null
          hours_spent?: number | null
          id?: string
          interview_frequency?: string | null
          last_studied?: string | null
          name?: string
          next_revision?: string | null
          priority?: number | null
          sort_order?: number | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary: {
        Row: {
          created_at: string | null
          example_sentence: string | null
          id: string
          jlpt_level: string | null
          last_reviewed: string | null
          mastered: boolean | null
          meaning: string | null
          reading: string | null
          romaji: string | null
          srs_level: number | null
          updated_at: string | null
          word: string
        }
        Insert: {
          created_at?: string | null
          example_sentence?: string | null
          id?: string
          jlpt_level?: string | null
          last_reviewed?: string | null
          mastered?: boolean | null
          meaning?: string | null
          reading?: string | null
          romaji?: string | null
          srs_level?: number | null
          updated_at?: string | null
          word: string
        }
        Update: {
          created_at?: string | null
          example_sentence?: string | null
          id?: string
          jlpt_level?: string | null
          last_reviewed?: string | null
          mastered?: boolean | null
          meaning?: string | null
          reading?: string | null
          romaji?: string | null
          srs_level?: number | null
          updated_at?: string | null
          word?: string
        }
        Relationships: []
      }
      workout_log: {
        Row: {
          created_at: string | null
          duration_mins: number | null
          id: string
          intensity: string | null
          log_date: string
          notes: string | null
          pr_hit: boolean | null
          type: string | null
          workout_name: string
        }
        Insert: {
          created_at?: string | null
          duration_mins?: number | null
          id?: string
          intensity?: string | null
          log_date: string
          notes?: string | null
          pr_hit?: boolean | null
          type?: string | null
          workout_name: string
        }
        Update: {
          created_at?: string | null
          duration_mins?: number | null
          id?: string
          intensity?: string | null
          log_date?: string
          notes?: string | null
          pr_hit?: boolean | null
          type?: string | null
          workout_name?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          priority: number | null
          sort_order: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          priority?: number | null
          sort_order?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          priority?: number | null
          sort_order?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
