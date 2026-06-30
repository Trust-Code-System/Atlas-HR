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
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          job_title: string | null;
          country: string | null;
          industry: string | null;
          company_size: string | null;
          bio: string | null;
          goals: string[];
          theme: "light" | "dark" | "system";
          accent: "blue" | "purple";
          role: "free" | "pro" | "team_admin" | "team_member" | "business_admin" | "business_member" | "enterprise" | "moderator" | "admin";
          is_verified: boolean;
          reputation: number;
          onboarding_completed: boolean;
          notification_preferences: Json | null;
          cookie_consent: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          job_title?: string | null;
          country?: string | null;
          industry?: string | null;
          company_size?: string | null;
          bio?: string | null;
          goals?: string[];
          theme?: "light" | "dark" | "system";
          accent?: "blue" | "purple";
          role?: "free" | "pro" | "team_admin" | "team_member" | "business_admin" | "business_member" | "enterprise" | "moderator" | "admin";
          is_verified?: boolean;
          reputation?: number;
          onboarding_completed?: boolean;
          notification_preferences?: Json | null;
          cookie_consent?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          job_title?: string | null;
          country?: string | null;
          industry?: string | null;
          company_size?: string | null;
          bio?: string | null;
          goals?: string[];
          theme?: "light" | "dark" | "system";
          accent?: "blue" | "purple";
          role?: "free" | "pro" | "team_admin" | "team_member" | "business_admin" | "business_member" | "enterprise" | "moderator" | "admin";
          is_verified?: boolean;
          reputation?: number;
          onboarding_completed?: boolean;
          notification_preferences?: Json | null;
          cookie_consent?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organisations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: "team" | "business" | "enterprise";
          industry: string | null;
          country: string | null;
          size: string | null;
          logo_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: "team" | "business" | "enterprise";
          industry?: string | null;
          country?: string | null;
          size?: string | null;
          logo_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: "team" | "business" | "enterprise";
          industry?: string | null;
          country?: string | null;
          size?: string | null;
          logo_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      org_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          org_role: "admin" | "member";
          roles: string[];
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          org_role?: "admin" | "member";
          roles?: string[];
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          org_role?: "admin" | "member";
          roles?: string[];
          invited_by?: string | null;
          joined_at?: string;
        };
        Relationships: [];
      };
      org_integrations: {
        Row: {
          id: string;
          org_id: string;
          integration_id: string;
          integration_type: "connector" | "plugin";
          config: Record<string, string>;
          is_active: boolean;
          connected_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          integration_id: string;
          integration_type: "connector" | "plugin";
          config?: Record<string, string>;
          is_active?: boolean;
          connected_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          integration_id?: string;
          integration_type?: "connector" | "plugin";
          config?: Record<string, string>;
          is_active?: boolean;
          connected_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      org_enabled_skills: {
        Row: {
          id: string;
          org_id: string;
          skill_id: string;
          enabled_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          skill_id: string;
          enabled_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          skill_id?: string;
          enabled_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          role: string;
          permissions: Json;
        };
        Insert: {
          role: string;
          permissions?: Json;
        };
        Update: {
          role?: string;
          permissions?: Json;
        };
        Relationships: [];
      };
      org_role_audit_log: {
        Row: {
          id: string;
          org_id: string;
          member_id: string | null;
          target_user_id: string | null;
          actor_user_id: string | null;
          before_roles: string[];
          after_roles: string[];
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          member_id?: string | null;
          target_user_id?: string | null;
          actor_user_id?: string | null;
          before_roles?: string[];
          after_roles?: string[];
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          member_id?: string | null;
          target_user_id?: string | null;
          actor_user_id?: string | null;
          before_roles?: string[];
          after_roles?: string[];
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      scheduled_reports: {
        Row: {
          id: string;
          org_id: string;
          created_by: string;
          report_slug: string;
          filter_config: Json | null;
          recipients: string[];
          cadence: "weekly" | "monthly" | "quarterly";
          day_of_week: number | null;
          day_of_month: number | null;
          format: "pdf" | "csv" | "xlsx";
          next_send_at: string;
          last_sent_at: string | null;
          is_active: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          created_by: string;
          report_slug: string;
          filter_config?: Json | null;
          recipients: string[];
          cadence: "weekly" | "monthly" | "quarterly";
          day_of_week?: number | null;
          day_of_month?: number | null;
          format?: "pdf" | "csv" | "xlsx";
          next_send_at: string;
          last_sent_at?: string | null;
          is_active?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          created_by?: string;
          report_slug?: string;
          filter_config?: Json | null;
          recipients?: string[];
          cadence?: "weekly" | "monthly" | "quarterly";
          day_of_week?: number | null;
          day_of_month?: number | null;
          format?: "pdf" | "csv" | "xlsx";
          next_send_at?: string;
          last_sent_at?: string | null;
          is_active?: boolean | null;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_report_views: {
        Row: {
          id: string;
          org_id: string;
          created_by: string;
          report_slug: string;
          name: string;
          filter_config: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          created_by: string;
          report_slug: string;
          name: string;
          filter_config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          created_by?: string;
          report_slug?: string;
          name?: string;
          filter_config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          org_id: string;
          full_name: string;
          email: string | null;
          job_title: string | null;
          department: string | null;
          manager_id: string | null;
          start_date: string | null;
          end_date: string | null;
          status: "active" | "on_leave" | "terminated";
          employment_type: "full_time" | "part_time" | "contract" | "intern" | null;
          country: string | null;
          salary: number | null;
          salary_currency: string;
          notes: string | null;
          linked_user_id: string | null;
          phone: string | null;
          address: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          photo_url: string | null;
          is_department_head: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          full_name: string;
          email?: string | null;
          job_title?: string | null;
          department?: string | null;
          manager_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: "active" | "on_leave" | "terminated";
          employment_type?: "full_time" | "part_time" | "contract" | "intern" | null;
          country?: string | null;
          salary?: number | null;
          salary_currency?: string;
          notes?: string | null;
          linked_user_id?: string | null;
          phone?: string | null;
          address?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          photo_url?: string | null;
          is_department_head?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          full_name?: string;
          email?: string | null;
          job_title?: string | null;
          department?: string | null;
          manager_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: "active" | "on_leave" | "terminated";
          employment_type?: "full_time" | "part_time" | "contract" | "intern" | null;
          country?: string | null;
          salary?: number | null;
          salary_currency?: string;
          notes?: string | null;
          linked_user_id?: string | null;
          phone?: string | null;
          address?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          photo_url?: string | null;
          is_department_head?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      employee_documents: {
        Row: {
          id: string;
          employee_id: string;
          doc_type: string;
          file_name: string;
          file_url: string;
          expires_at: string | null;
          uploaded_by: string | null;
          ai_enabled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          doc_type: string;
          file_name: string;
          file_url: string;
          expires_at?: string | null;
          uploaded_by?: string | null;
          ai_enabled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          doc_type?: string;
          file_name?: string;
          file_url?: string;
          expires_at?: string | null;
          uploaded_by?: string | null;
          ai_enabled?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      document_requirement_templates: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          applies_to_country: string[] | null;
          applies_to_employment_type: string[] | null;
          applies_to_role_pattern: string | null;
          is_active: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          description?: string | null;
          applies_to_country?: string[] | null;
          applies_to_employment_type?: string[] | null;
          applies_to_role_pattern?: string | null;
          is_active?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          description?: string | null;
          applies_to_country?: string[] | null;
          applies_to_employment_type?: string[] | null;
          applies_to_role_pattern?: string | null;
          is_active?: boolean | null;
          created_at?: string;
        };
        Relationships: [];
      };
      document_requirements: {
        Row: {
          id: string;
          template_id: string;
          doc_type: string;
          display_name: string;
          description: string | null;
          is_required: boolean | null;
          expiry_required: boolean | null;
          expiry_warning_days: number | null;
          acceptable_formats: string[] | null;
          legal_basis: string | null;
          knowledge_article_slug: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          doc_type: string;
          display_name: string;
          description?: string | null;
          is_required?: boolean | null;
          expiry_required?: boolean | null;
          expiry_warning_days?: number | null;
          acceptable_formats?: string[] | null;
          legal_basis?: string | null;
          knowledge_article_slug?: string | null;
        };
        Update: {
          id?: string;
          template_id?: string;
          doc_type?: string;
          display_name?: string;
          description?: string | null;
          is_required?: boolean | null;
          expiry_required?: boolean | null;
          expiry_warning_days?: number | null;
          acceptable_formats?: string[] | null;
          legal_basis?: string | null;
          knowledge_article_slug?: string | null;
        };
        Relationships: [];
      };
      employee_document_status: {
        Row: {
          id: string;
          employee_id: string;
          doc_type: string;
          status: "missing" | "submitted" | "expired" | "expiring_soon" | "approved";
          current_document_id: string | null;
          last_checked_at: string | null;
        };
        Insert: {
          id?: string;
          employee_id: string;
          doc_type: string;
          status: "missing" | "submitted" | "expired" | "expiring_soon" | "approved";
          current_document_id?: string | null;
          last_checked_at?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string;
          doc_type?: string;
          status?: "missing" | "submitted" | "expired" | "expiring_soon" | "approved";
          current_document_id?: string | null;
          last_checked_at?: string | null;
        };
        Relationships: [];
      };
      document_acknowledgments: {
        Row: {
          id: string;
          employee_id: string;
          document_type: string;
          document_version: string;
          acknowledged_at: string;
          ip: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          employee_id: string;
          document_type: string;
          document_version: string;
          acknowledged_at?: string;
          ip?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string;
          document_type?: string;
          document_version?: string;
          acknowledged_at?: string;
          ip?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      employee_profile_change_requests: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          requested_by: string;
          change_set: Json;
          status: "pending" | "approved" | "rejected" | "cancelled";
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          requested_by: string;
          change_set?: Json;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          employee_id?: string;
          requested_by?: string;
          change_set?: Json;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      employee_tasks: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string | null;
          assigned_to: string | null;
          title: string;
          description: string | null;
          task_type: "profile_update" | "document_upload" | "policy_acknowledgment" | "training" | "onboarding" | "offboarding" | "leave" | "custom";
          related_resource_type: string | null;
          related_resource_id: string | null;
          due_at: string | null;
          status: "pending" | "in_progress" | "completed" | "cancelled";
          completed_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id?: string | null;
          assigned_to?: string | null;
          title: string;
          description?: string | null;
          task_type?: "profile_update" | "document_upload" | "policy_acknowledgment" | "training" | "onboarding" | "offboarding" | "leave" | "custom";
          related_resource_type?: string | null;
          related_resource_id?: string | null;
          due_at?: string | null;
          status?: "pending" | "in_progress" | "completed" | "cancelled";
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          employee_id?: string | null;
          assigned_to?: string | null;
          title?: string;
          description?: string | null;
          task_type?: "profile_update" | "document_upload" | "policy_acknowledgment" | "training" | "onboarding" | "offboarding" | "leave" | "custom";
          related_resource_type?: string | null;
          related_resource_id?: string | null;
          due_at?: string | null;
          status?: "pending" | "in_progress" | "completed" | "cancelled";
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_announcements: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          body: string | null;
          published_by: string | null;
          published_at: string | null;
          expires_at: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          title: string;
          body?: string | null;
          published_by?: string | null;
          published_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          title?: string;
          body?: string | null;
          published_by?: string | null;
          published_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean | null;
        };
        Relationships: [];
      };
      approval_workflows: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          trigger_type: string;
          is_active: boolean | null;
          applies_when: Json | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          description?: string | null;
          trigger_type: string;
          is_active?: boolean | null;
          applies_when?: Json | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          description?: string | null;
          trigger_type?: string;
          is_active?: boolean | null;
          applies_when?: Json | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      approval_workflow_steps: {
        Row: {
          id: string;
          workflow_id: string;
          step_order: number;
          name: string;
          approver_type: string;
          approver_value: string | null;
          is_optional: boolean | null;
          sla_hours: number | null;
          escalation_after_hours: number | null;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          step_order: number;
          name: string;
          approver_type: string;
          approver_value?: string | null;
          is_optional?: boolean | null;
          sla_hours?: number | null;
          escalation_after_hours?: number | null;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          step_order?: number;
          name?: string;
          approver_type?: string;
          approver_value?: string | null;
          is_optional?: boolean | null;
          sla_hours?: number | null;
          escalation_after_hours?: number | null;
        };
        Relationships: [];
      };
      approval_requests: {
        Row: {
          id: string;
          workflow_id: string;
          org_id: string;
          trigger_type: string;
          subject_type: string;
          subject_id: string;
          initiated_by: string;
          current_step: number | null;
          status: "pending" | "approved" | "rejected" | "cancelled" | "expired";
          payload: Json | null;
          created_at: string;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          org_id: string;
          trigger_type: string;
          subject_type: string;
          subject_id: string;
          initiated_by: string;
          current_step?: number | null;
          status?: "pending" | "approved" | "rejected" | "cancelled" | "expired";
          payload?: Json | null;
          created_at?: string;
          decided_at?: string | null;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          org_id?: string;
          trigger_type?: string;
          subject_type?: string;
          subject_id?: string;
          initiated_by?: string;
          current_step?: number | null;
          status?: "pending" | "approved" | "rejected" | "cancelled" | "expired";
          payload?: Json | null;
          created_at?: string;
          decided_at?: string | null;
        };
        Relationships: [];
      };
      approval_decisions: {
        Row: {
          id: string;
          request_id: string;
          step_id: string;
          step_order: number;
          approver_user_id: string | null;
          decided_by: string | null;
          decision: "approved" | "rejected" | "delegated" | "escalated" | null;
          comment: string | null;
          decided_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          step_id: string;
          step_order: number;
          approver_user_id?: string | null;
          decided_by?: string | null;
          decision?: "approved" | "rejected" | "delegated" | "escalated" | null;
          comment?: string | null;
          decided_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          step_id?: string;
          step_order?: number;
          approver_user_id?: string | null;
          decided_by?: string | null;
          decision?: "approved" | "rejected" | "delegated" | "escalated" | null;
          comment?: string | null;
          decided_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      lifecycle_templates: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          type: "onboarding" | "offboarding";
          description: string | null;
          applies_to_department: string[] | null;
          applies_to_employment_type: string[] | null;
          applies_to_role_pattern: string | null;
          is_default: boolean | null;
          is_active: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          type: "onboarding" | "offboarding";
          description?: string | null;
          applies_to_department?: string[] | null;
          applies_to_employment_type?: string[] | null;
          applies_to_role_pattern?: string | null;
          is_default?: boolean | null;
          is_active?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          type?: "onboarding" | "offboarding";
          description?: string | null;
          applies_to_department?: string[] | null;
          applies_to_employment_type?: string[] | null;
          applies_to_role_pattern?: string | null;
          is_default?: boolean | null;
          is_active?: boolean | null;
          created_at?: string;
        };
        Relationships: [];
      };
      lifecycle_template_tasks: {
        Row: {
          id: string;
          template_id: string;
          task_order: number;
          title: string;
          description: string | null;
          task_type: string;
          assignee_type: string;
          assignee_value: string | null;
          due_offset_days: number | null;
          is_required: boolean | null;
          related_doc_type: string | null;
          related_training_slug: string | null;
          related_acknowledgment_type: string | null;
          knowledge_article_slug: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          task_order: number;
          title: string;
          description?: string | null;
          task_type: string;
          assignee_type: string;
          assignee_value?: string | null;
          due_offset_days?: number | null;
          is_required?: boolean | null;
          related_doc_type?: string | null;
          related_training_slug?: string | null;
          related_acknowledgment_type?: string | null;
          knowledge_article_slug?: string | null;
        };
        Update: {
          id?: string;
          template_id?: string;
          task_order?: number;
          title?: string;
          description?: string | null;
          task_type?: string;
          assignee_type?: string;
          assignee_value?: string | null;
          due_offset_days?: number | null;
          is_required?: boolean | null;
          related_doc_type?: string | null;
          related_training_slug?: string | null;
          related_acknowledgment_type?: string | null;
          knowledge_article_slug?: string | null;
        };
        Relationships: [];
      };
      lifecycle_runs: {
        Row: {
          id: string;
          template_id: string;
          employee_id: string;
          type: "onboarding" | "offboarding";
          reference_date: string;
          status: "in_progress" | "completed" | "cancelled";
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          employee_id: string;
          type: "onboarding" | "offboarding";
          reference_date: string;
          status?: "in_progress" | "completed" | "cancelled";
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          template_id?: string;
          employee_id?: string;
          type?: "onboarding" | "offboarding";
          reference_date?: string;
          status?: "in_progress" | "completed" | "cancelled";
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      lifecycle_tasks: {
        Row: {
          id: string;
          run_id: string;
          template_task_id: string | null;
          title: string;
          description: string | null;
          task_type: string;
          assignee_user_id: string | null;
          due_at: string | null;
          status: "pending" | "in_progress" | "completed" | "skipped" | "blocked";
          completed_by: string | null;
          completed_at: string | null;
          notes: string | null;
          attachments: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          template_task_id?: string | null;
          title: string;
          description?: string | null;
          task_type: string;
          assignee_user_id?: string | null;
          due_at?: string | null;
          status?: "pending" | "in_progress" | "completed" | "skipped" | "blocked";
          completed_by?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          attachments?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          template_task_id?: string | null;
          title?: string;
          description?: string | null;
          task_type?: string;
          assignee_user_id?: string | null;
          due_at?: string | null;
          status?: "pending" | "in_progress" | "completed" | "skipped" | "blocked";
          completed_by?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          attachments?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      workflow_runs: {
        Row: {
          id: string;
          org_id: string;
          workflow_slug: string;
          title: string;
          summary: string | null;
          status: "in_progress" | "completed" | "cancelled";
          priority: "low" | "normal" | "high" | "urgent";
          country: string | null;
          employee_id: string | null;
          launch_context: Json;
          next_step_url: string | null;
          created_by: string | null;
          due_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          workflow_slug: string;
          title: string;
          summary?: string | null;
          status?: "in_progress" | "completed" | "cancelled";
          priority?: "low" | "normal" | "high" | "urgent";
          country?: string | null;
          employee_id?: string | null;
          launch_context?: Json;
          next_step_url?: string | null;
          created_by?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          workflow_slug?: string;
          title?: string;
          summary?: string | null;
          status?: "in_progress" | "completed" | "cancelled";
          priority?: "low" | "normal" | "high" | "urgent";
          country?: string | null;
          employee_id?: string | null;
          launch_context?: Json;
          next_step_url?: string | null;
          created_by?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          org_id: string;
          actor_user_id: string | null;
          actor_email: string | null;
          actor_display_name: string | null;
          resource_type: string;
          resource_id: string;
          resource_display_name: string | null;
          action: string;
          before_value: Json | null;
          after_value: Json | null;
          changed_fields: string[] | null;
          reason: string | null;
          source: "web" | "api" | "system" | "import" | "webhook" | null;
          ip: string | null;
          user_agent: string | null;
          request_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          actor_user_id?: string | null;
          actor_email?: string | null;
          actor_display_name?: string | null;
          resource_type: string;
          resource_id: string;
          resource_display_name?: string | null;
          action: string;
          before_value?: Json | null;
          after_value?: Json | null;
          changed_fields?: string[] | null;
          reason?: string | null;
          source?: "web" | "api" | "system" | "import" | "webhook" | null;
          ip?: string | null;
          user_agent?: string | null;
          request_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          actor_user_id?: string | null;
          actor_email?: string | null;
          actor_display_name?: string | null;
          resource_type?: string;
          resource_id?: string;
          resource_display_name?: string | null;
          action?: string;
          before_value?: Json | null;
          after_value?: Json | null;
          changed_fields?: string[] | null;
          reason?: string | null;
          source?: "web" | "api" | "system" | "import" | "webhook" | null;
          ip?: string | null;
          user_agent?: string | null;
          request_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      leave_requests: {
        Row: {
          id: string;
          employee_id: string;
          leave_type: string;
          start_date: string;
          end_date: string;
          reason: string | null;
          status: "pending" | "approved" | "rejected" | "cancelled";
          approver_id: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          leave_type: string;
          start_date: string;
          end_date: string;
          reason?: string | null;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          approver_id?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          leave_type?: string;
          start_date?: string;
          end_date?: string;
          reason?: string | null;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          approver_id?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      generated_documents: {
        Row: {
          id: string;
          user_id: string;
          tool_slug: string;
          tool_name: string;
          inputs: Json;
          output: string;
          title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool_slug: string;
          tool_name: string;
          inputs: Json;
          output: string;
          title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tool_slug?: string;
          tool_name?: string;
          inputs?: Json;
          output?: string;
          title?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      content_feedback: {
        Row: {
          id: string;
          user_id: string | null;
          content_type: "article" | "country_guide" | "industry_guide";
          content_slug: string;
          helpful: boolean;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          content_type: "article" | "country_guide" | "industry_guide";
          content_slug: string;
          helpful: boolean;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          content_type?: "article" | "country_guide" | "industry_guide";
          content_slug?: string;
          helpful?: boolean;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_items: {
        Row: {
          id: string;
          user_id: string;
          item_type: "article" | "template" | "tool";
          item_slug: string;
          saved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_type: "article" | "template" | "tool";
          item_slug: string;
          saved_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_type?: "article" | "template" | "tool";
          item_slug?: string;
          saved_at?: string;
        };
        Relationships: [];
      };
      copilot_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          context_type: string | null;
          context_ref: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          context_type?: string | null;
          context_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          context_type?: string | null;
          context_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      copilot_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      community_threads: {
        Row: {
          id: string;
          author_id: string;
          category: string;
          region: string | null;
          title: string;
          body: string;
          is_anonymous: boolean;
          is_locked: boolean;
          is_pinned: boolean;
          vote_count: number;
          reply_count: number;
          view_count: number;
          last_reply_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          category: string;
          region?: string | null;
          title: string;
          body: string;
          is_anonymous?: boolean;
          is_locked?: boolean;
          is_pinned?: boolean;
          vote_count?: number;
          reply_count?: number;
          view_count?: number;
          last_reply_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          category?: string;
          region?: string | null;
          title?: string;
          body?: string;
          is_anonymous?: boolean;
          is_locked?: boolean;
          is_pinned?: boolean;
          vote_count?: number;
          reply_count?: number;
          view_count?: number;
          last_reply_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_replies: {
        Row: {
          id: string;
          thread_id: string;
          parent_reply_id: string | null;
          author_id: string;
          body: string;
          is_anonymous: boolean;
          is_accepted_answer: boolean;
          vote_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          parent_reply_id?: string | null;
          author_id: string;
          body: string;
          is_anonymous?: boolean;
          is_accepted_answer?: boolean;
          vote_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          parent_reply_id?: string | null;
          author_id?: string;
          body?: string;
          is_anonymous?: boolean;
          is_accepted_answer?: boolean;
          vote_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_votes: {
        Row: {
          id: string;
          user_id: string;
          target_type: "thread" | "reply";
          target_id: string;
          value: 1 | -1;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_type: "thread" | "reply";
          target_id: string;
          value: 1 | -1;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_type?: "thread" | "reply";
          target_id?: string;
          value?: 1 | -1;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      usage_tracking: {
        Row: {
          id: string;
          user_id: string;
          resource: string;
          resource_ref: string | null;
          count: number;
          period_start: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource: string;
          resource_ref?: string | null;
          count?: number;
          period_start: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resource?: string;
          resource_ref?: string | null;
          count?: number;
          period_start?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      org_invites: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          org_role: "admin" | "member";
          roles: string[];
          token: string;
          invited_by: string | null;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          org_role?: "admin" | "member";
          roles?: string[];
          token?: string;
          invited_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          org_role?: "admin" | "member";
          roles?: string[];
          token?: string;
          invited_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      status_incidents: {
        Row: {
          id: string;
          title: string;
          body: string;
          severity: "minor" | "major" | "critical";
          status: "investigating" | "identified" | "monitoring" | "resolved";
          affected_services: string[];
          started_at: string;
          resolved_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          severity?: "minor" | "major" | "critical";
          status?: "investigating" | "identified" | "monitoring" | "resolved";
          affected_services?: string[];
          started_at?: string;
          resolved_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          severity?: "minor" | "major" | "critical";
          status?: "investigating" | "identified" | "monitoring" | "resolved";
          affected_services?: string[];
          started_at?: string;
          resolved_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          name: string | null;
          category: "billing" | "technical" | "account" | "feature_request" | "other";
          priority: "normal" | "urgent";
          subject: string;
          body: string;
          status: "open" | "in_progress" | "resolved" | "closed";
          assigned_to: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          name?: string | null;
          category: "billing" | "technical" | "account" | "feature_request" | "other";
          priority?: "normal" | "urgent";
          subject: string;
          body: string;
          status?: "open" | "in_progress" | "resolved" | "closed";
          assigned_to?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string;
          name?: string | null;
          category?: "billing" | "technical" | "account" | "feature_request" | "other";
          priority?: "normal" | "urgent";
          subject?: string;
          body?: string;
          status?: "open" | "in_progress" | "resolved" | "closed";
          assigned_to?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          author_id: string | null;
          is_from_admin: boolean;
          body: string;
          attachments: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_id?: string | null;
          is_from_admin: boolean;
          body: string;
          attachments?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          author_id?: string | null;
          is_from_admin?: boolean;
          body?: string;
          attachments?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_user_id: string;
          action: string;
          target_user_id: string | null;
          target_resource: string | null;
          target_resource_id: string | null;
          before_value: Json | null;
          after_value: Json | null;
          reason: string | null;
          ip: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          action: string;
          target_user_id?: string | null;
          target_resource?: string | null;
          target_resource_id?: string | null;
          before_value?: Json | null;
          after_value?: Json | null;
          reason?: string | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_user_id?: string;
          action?: string;
          target_user_id?: string | null;
          target_resource?: string | null;
          target_resource_id?: string | null;
          before_value?: Json | null;
          after_value?: Json | null;
          reason?: string | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      beta_invites: {
        Row: {
          id: string;
          code: string;
          email: string | null;
          invited_by: string | null;
          cohort: string;
          is_vip: boolean;
          expires_at: string;
          access_expires_at: string | null;
          used_by: string | null;
          used_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          email?: string | null;
          invited_by?: string | null;
          cohort?: string;
          is_vip?: boolean;
          expires_at?: string;
          access_expires_at?: string | null;
          used_by?: string | null;
          used_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          email?: string | null;
          invited_by?: string | null;
          cohort?: string;
          is_vip?: boolean;
          expires_at?: string;
          access_expires_at?: string | null;
          used_by?: string | null;
          used_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      beta_feedback: {
        Row: {
          id: string;
          user_id: string;
          category: "bug" | "feature_request" | "content" | "general" | "onboarding" | "copilot" | "tools";
          severity: "low" | "normal" | "high" | "blocker";
          page_url: string | null;
          body: string;
          rating: number | null;
          screenshot_url: string | null;
          status: "new" | "reviewing" | "planned" | "in_progress" | "done" | "wontfix";
          admin_notes: string | null;
          labels: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: "bug" | "feature_request" | "content" | "general" | "onboarding" | "copilot" | "tools";
          severity?: "low" | "normal" | "high" | "blocker";
          page_url?: string | null;
          body: string;
          rating?: number | null;
          screenshot_url?: string | null;
          status?: "new" | "reviewing" | "planned" | "in_progress" | "done" | "wontfix";
          admin_notes?: string | null;
          labels?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: "bug" | "feature_request" | "content" | "general" | "onboarding" | "copilot" | "tools";
          severity?: "low" | "normal" | "high" | "blocker";
          page_url?: string | null;
          body?: string;
          rating?: number | null;
          screenshot_url?: string | null;
          status?: "new" | "reviewing" | "planned" | "in_progress" | "done" | "wontfix";
          admin_notes?: string | null;
          labels?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          department: string | null;
          location: string | null;
          employment_type: string | null;
          description: string | null;
          requirements: string | null;
          status: "draft" | "open" | "closed" | "on_hold";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          title: string;
          department?: string | null;
          location?: string | null;
          employment_type?: string | null;
          description?: string | null;
          requirements?: string | null;
          status?: "draft" | "open" | "closed" | "on_hold";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          title?: string;
          department?: string | null;
          location?: string | null;
          employment_type?: string | null;
          description?: string | null;
          requirements?: string | null;
          status?: "draft" | "open" | "closed" | "on_hold";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          candidate_name: string;
          candidate_email: string | null;
          candidate_phone: string | null;
          stage: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
          notes: string | null;
          cv_url: string | null;
          linkedin_url: string | null;
          source: "linkedin" | "indeed" | "referral" | "careers_page" | "glassdoor" | "agency" | "direct" | "other" | null;
          applied_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          candidate_name: string;
          candidate_email?: string | null;
          candidate_phone?: string | null;
          stage?: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
          notes?: string | null;
          cv_url?: string | null;
          linkedin_url?: string | null;
          source?: "linkedin" | "indeed" | "referral" | "careers_page" | "glassdoor" | "agency" | "direct" | "other" | null;
          applied_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          candidate_name?: string;
          candidate_email?: string | null;
          candidate_phone?: string | null;
          stage?: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
          notes?: string | null;
          cv_url?: string | null;
          linkedin_url?: string | null;
          source?: "linkedin" | "indeed" | "referral" | "careers_page" | "glassdoor" | "agency" | "direct" | "other" | null;
          applied_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      policy_library: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          description: string | null;
          category: string;
          file_url: string | null;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          title: string;
          description?: string | null;
          category?: string;
          file_url?: string | null;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          file_url?: string | null;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      time_entries: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          date: string;
          hours: number;
          category: "regular" | "overtime" | "sick" | "holiday" | "training";
          project: string | null;
          notes: string | null;
          status: "draft" | "submitted" | "approved";
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          date: string;
          hours: number;
          category?: "regular" | "overtime" | "sick" | "holiday" | "training";
          project?: string | null;
          notes?: string | null;
          status?: "draft" | "submitted" | "approved";
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          employee_id?: string;
          date?: string;
          hours?: number;
          category?: "regular" | "overtime" | "sick" | "holiday" | "training";
          project?: string | null;
          notes?: string | null;
          status?: "draft" | "submitted" | "approved";
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      payroll_runs: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          pay_period_start: string;
          pay_period_end: string;
          run_date: string | null;
          status: "draft" | "processing" | "approved" | "paid";
          total_gross: number | null;
          total_net: number | null;
          currency: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          pay_period_start: string;
          pay_period_end: string;
          run_date?: string | null;
          status?: "draft" | "processing" | "approved" | "paid";
          total_gross?: number | null;
          total_net?: number | null;
          currency?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          pay_period_start?: string;
          pay_period_end?: string;
          run_date?: string | null;
          status?: "draft" | "processing" | "approved" | "paid";
          total_gross?: number | null;
          total_net?: number | null;
          currency?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payroll_entries: {
        Row: {
          id: string;
          run_id: string;
          employee_id: string;
          gross_pay: number;
          deductions: number;
          net_pay: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          employee_id: string;
          gross_pay?: number;
          deductions?: number;
          net_pay?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          employee_id?: string;
          gross_pay?: number;
          deductions?: number;
          net_pay?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      performance_cycles: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          type: "annual" | "mid_year" | "quarterly" | "custom";
          status: "draft" | "active" | "completed";
          start_date: string;
          end_date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          type?: "annual" | "mid_year" | "quarterly" | "custom";
          status?: "draft" | "active" | "completed";
          start_date: string;
          end_date: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          type?: "annual" | "mid_year" | "quarterly" | "custom";
          status?: "draft" | "active" | "completed";
          start_date?: string;
          end_date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      performance_reviews: {
        Row: {
          id: string;
          cycle_id: string;
          employee_id: string;
          reviewer_id: string | null;
          status: "pending" | "in_progress" | "submitted" | "acknowledged";
          rating: number | null;
          summary: string | null;
          strengths: string | null;
          areas_for_improvement: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cycle_id: string;
          employee_id: string;
          reviewer_id?: string | null;
          status?: "pending" | "in_progress" | "submitted" | "acknowledged";
          rating?: number | null;
          summary?: string | null;
          strengths?: string | null;
          areas_for_improvement?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cycle_id?: string;
          employee_id?: string;
          reviewer_id?: string | null;
          status?: "pending" | "in_progress" | "submitted" | "acknowledged";
          rating?: number | null;
          summary?: string | null;
          strengths?: string | null;
          areas_for_improvement?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      surveys: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          type: "enps" | "pulse" | "custom";
          status: "draft" | "active" | "closed";
          questions: Json;
          ends_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          title: string;
          type?: "enps" | "pulse" | "custom";
          status?: "draft" | "active" | "closed";
          questions?: Json;
          ends_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          title?: string;
          type?: "enps" | "pulse" | "custom";
          status?: "draft" | "active" | "closed";
          questions?: Json;
          ends_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      survey_responses: {
        Row: {
          id: string;
          survey_id: string;
          respondent_id: string | null;
          responses: Json;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          survey_id: string;
          respondent_id?: string | null;
          responses?: Json;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          survey_id?: string;
          respondent_id?: string | null;
          responses?: Json;
          submitted_at?: string;
        };
        Relationships: [];
      };
      company_assets: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          asset_type: "laptop" | "desktop" | "monitor" | "phone" | "tablet" | "accessory" | "vehicle" | "license" | "card" | "other";
          asset_tag: string | null;
          serial_number: string | null;
          manufacturer: string | null;
          model: string | null;
          condition: "new" | "good" | "fair" | "damaged" | "repair_needed";
          status: "available" | "assigned" | "repair" | "lost" | "retired";
          purchase_date: string | null;
          warranty_expires: string | null;
          purchase_cost: number | null;
          currency: string;
          location: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          asset_type?: "laptop" | "desktop" | "monitor" | "phone" | "tablet" | "accessory" | "vehicle" | "license" | "card" | "other";
          asset_tag?: string | null;
          serial_number?: string | null;
          manufacturer?: string | null;
          model?: string | null;
          condition?: "new" | "good" | "fair" | "damaged" | "repair_needed";
          status?: "available" | "assigned" | "repair" | "lost" | "retired";
          purchase_date?: string | null;
          warranty_expires?: string | null;
          purchase_cost?: number | null;
          currency?: string;
          location?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          asset_type?: "laptop" | "desktop" | "monitor" | "phone" | "tablet" | "accessory" | "vehicle" | "license" | "card" | "other";
          asset_tag?: string | null;
          serial_number?: string | null;
          manufacturer?: string | null;
          model?: string | null;
          condition?: "new" | "good" | "fair" | "damaged" | "repair_needed";
          status?: "available" | "assigned" | "repair" | "lost" | "retired";
          purchase_date?: string | null;
          warranty_expires?: string | null;
          purchase_cost?: number | null;
          currency?: string;
          location?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      asset_assignments: {
        Row: {
          id: string;
          org_id: string;
          asset_id: string;
          employee_id: string;
          assigned_at: string;
          return_due_at: string | null;
          returned_at: string | null;
          assignment_status: "assigned" | "returned" | "overdue" | "lost";
          condition_out: "new" | "good" | "fair" | "damaged" | "repair_needed" | null;
          condition_in: "new" | "good" | "fair" | "damaged" | "repair_needed" | null;
          notes: string | null;
          assigned_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          asset_id: string;
          employee_id: string;
          assigned_at?: string;
          return_due_at?: string | null;
          returned_at?: string | null;
          assignment_status?: "assigned" | "returned" | "overdue" | "lost";
          condition_out?: "new" | "good" | "fair" | "damaged" | "repair_needed" | null;
          condition_in?: "new" | "good" | "fair" | "damaged" | "repair_needed" | null;
          notes?: string | null;
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          asset_id?: string;
          employee_id?: string;
          assigned_at?: string;
          return_due_at?: string | null;
          returned_at?: string | null;
          assignment_status?: "assigned" | "returned" | "overdue" | "lost";
          condition_out?: "new" | "good" | "fair" | "damaged" | "repair_needed" | null;
          condition_in?: "new" | "good" | "fair" | "damaged" | "repair_needed" | null;
          notes?: string | null;
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      benefit_plans: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          type: "health" | "dental" | "vision" | "pension" | "life" | "other";
          provider: string | null;
          description: string | null;
          employer_contribution: number;
          employee_contribution: number;
          currency: string;
          status: "active" | "inactive" | "archived";
          renewal_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          type?: "health" | "dental" | "vision" | "pension" | "life" | "other";
          provider?: string | null;
          description?: string | null;
          employer_contribution?: number;
          employee_contribution?: number;
          currency?: string;
          status?: "active" | "inactive" | "archived";
          renewal_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          type?: "health" | "dental" | "vision" | "pension" | "life" | "other";
          provider?: string | null;
          description?: string | null;
          employer_contribution?: number;
          employee_contribution?: number;
          currency?: string;
          status?: "active" | "inactive" | "archived";
          renewal_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      benefit_enrolments: {
        Row: {
          id: string;
          org_id: string;
          plan_id: string;
          employee_id: string;
          status: "active" | "pending" | "opted_out" | "terminated";
          start_date: string | null;
          end_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          plan_id: string;
          employee_id: string;
          status?: "active" | "pending" | "opted_out" | "terminated";
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          plan_id?: string;
          employee_id?: string;
          status?: "active" | "pending" | "opted_out" | "terminated";
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      disciplinary_cases: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          type: "query" | "warning" | "suspension" | "termination" | "other";
          severity: "minor" | "moderate" | "serious" | "gross_misconduct";
          title: string;
          description: string | null;
          incident_date: string;
          status: "open" | "under_review" | "resolved" | "closed";
          outcome: string | null;
          resolved_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          type?: "query" | "warning" | "suspension" | "termination" | "other";
          severity?: "minor" | "moderate" | "serious" | "gross_misconduct";
          title: string;
          description?: string | null;
          incident_date: string;
          status?: "open" | "under_review" | "resolved" | "closed";
          outcome?: string | null;
          resolved_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          employee_id?: string;
          type?: "query" | "warning" | "suspension" | "termination" | "other";
          severity?: "minor" | "moderate" | "serious" | "gross_misconduct";
          title?: string;
          description?: string | null;
          incident_date?: string;
          status?: "open" | "under_review" | "resolved" | "closed";
          outcome?: string | null;
          resolved_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exit_records: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          reason: "resignation" | "termination" | "redundancy" | "retirement" | "contract_end" | "other";
          status: "initiated" | "in_progress" | "completed";
          last_working_day: string | null;
          exit_date: string | null;
          exit_interview_date: string | null;
          exit_interview_notes: string | null;
          initiated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          reason?: "resignation" | "termination" | "redundancy" | "retirement" | "contract_end" | "other";
          status?: "initiated" | "in_progress" | "completed";
          last_working_day?: string | null;
          exit_date?: string | null;
          exit_interview_date?: string | null;
          exit_interview_notes?: string | null;
          initiated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          employee_id?: string;
          reason?: "resignation" | "termination" | "redundancy" | "retirement" | "contract_end" | "other";
          status?: "initiated" | "in_progress" | "completed";
          last_working_day?: string | null;
          exit_date?: string | null;
          exit_interview_date?: string | null;
          exit_interview_notes?: string | null;
          initiated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exit_checklist_items: {
        Row: {
          id: string;
          org_id: string;
          exit_id: string;
          category: "equipment" | "access" | "documentation" | "finance" | "other";
          title: string;
          description: string | null;
          status: "pending" | "in_progress" | "completed" | "not_applicable";
          due_date: string | null;
          completed_at: string | null;
          completed_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          exit_id: string;
          category?: "equipment" | "access" | "documentation" | "finance" | "other";
          title: string;
          description?: string | null;
          status?: "pending" | "in_progress" | "completed" | "not_applicable";
          due_date?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          exit_id?: string;
          category?: "equipment" | "access" | "documentation" | "finance" | "other";
          title?: string;
          description?: string | null;
          status?: "pending" | "in_progress" | "completed" | "not_applicable";
          due_date?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_referrals: {
        Row: {
          id: string;
          org_id: string;
          job_id: string;
          referrer_id: string;
          candidate_name: string;
          candidate_email: string;
          candidate_phone: string | null;
          linkedin_url: string | null;
          relationship: string | null;
          cover_note: string | null;
          status: "pending" | "reviewing" | "interviewing" | "hired" | "rejected";
          rejection_reason: string | null;
          hired_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          job_id: string;
          referrer_id: string;
          candidate_name: string;
          candidate_email: string;
          candidate_phone?: string | null;
          linkedin_url?: string | null;
          relationship?: string | null;
          cover_note?: string | null;
          status?: "pending" | "reviewing" | "interviewing" | "hired" | "rejected";
          rejection_reason?: string | null;
          hired_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          job_id?: string;
          referrer_id?: string;
          candidate_name?: string;
          candidate_email?: string;
          candidate_phone?: string | null;
          linkedin_url?: string | null;
          relationship?: string | null;
          cover_note?: string | null;
          status?: "pending" | "reviewing" | "interviewing" | "hired" | "rejected";
          rejection_reason?: string | null;
          hired_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      succession_candidates: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          target_role: string;
          readiness: "ready_now" | "ready_1_year" | "ready_2_plus" | "not_ready";
          potential: "high" | "medium" | "low";
          performance: "exceeds" | "meets" | "below";
          development_areas: string | null;
          notes: string | null;
          status: "active" | "promoted" | "removed";
          nominated_by: string | null;
          promoted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          target_role: string;
          readiness?: "ready_now" | "ready_1_year" | "ready_2_plus" | "not_ready";
          potential?: "high" | "medium" | "low";
          performance?: "exceeds" | "meets" | "below";
          development_areas?: string | null;
          notes?: string | null;
          status?: "active" | "promoted" | "removed";
          nominated_by?: string | null;
          promoted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          employee_id?: string;
          target_role?: string;
          readiness?: "ready_now" | "ready_1_year" | "ready_2_plus" | "not_ready";
          potential?: "high" | "medium" | "low";
          performance?: "exceeds" | "meets" | "below";
          development_areas?: string | null;
          notes?: string | null;
          status?: "active" | "promoted" | "removed";
          nominated_by?: string | null;
          promoted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lms_courses: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          description: string | null;
          category: "compliance" | "technical" | "soft_skills" | "leadership" | "onboarding" | "other";
          format: "video" | "document" | "live" | "external" | "scorm";
          duration_mins: number | null;
          thumbnail_url: string | null;
          external_url: string | null;
          is_mandatory: boolean;
          status: "draft" | "published" | "archived";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          title: string;
          description?: string | null;
          category?: "compliance" | "technical" | "soft_skills" | "leadership" | "onboarding" | "other";
          format?: "video" | "document" | "live" | "external" | "scorm";
          duration_mins?: number | null;
          thumbnail_url?: string | null;
          external_url?: string | null;
          is_mandatory?: boolean;
          status?: "draft" | "published" | "archived";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          title?: string;
          description?: string | null;
          category?: "compliance" | "technical" | "soft_skills" | "leadership" | "onboarding" | "other";
          format?: "video" | "document" | "live" | "external" | "scorm";
          duration_mins?: number | null;
          thumbnail_url?: string | null;
          external_url?: string | null;
          is_mandatory?: boolean;
          status?: "draft" | "published" | "archived";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lms_enrolments: {
        Row: {
          id: string;
          org_id: string;
          course_id: string;
          employee_id: string;
          status: "enrolled" | "in_progress" | "completed" | "failed" | "dropped";
          progress_pct: number;
          score: number | null;
          due_date: string | null;
          started_at: string | null;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          course_id: string;
          employee_id: string;
          status?: "enrolled" | "in_progress" | "completed" | "failed" | "dropped";
          progress_pct?: number;
          score?: number | null;
          due_date?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          course_id?: string;
          employee_id?: string;
          status?: "enrolled" | "in_progress" | "completed" | "failed" | "dropped";
          progress_pct?: number;
          score?: number | null;
          due_date?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lms_certifications: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          course_id: string | null;
          name: string;
          issuer: string | null;
          issued_date: string | null;
          expiry_date: string | null;
          credential_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          course_id?: string | null;
          name: string;
          issuer?: string | null;
          issued_date?: string | null;
          expiry_date?: string | null;
          credential_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          employee_id?: string;
          course_id?: string | null;
          name?: string;
          issuer?: string | null;
          issued_date?: string | null;
          expiry_date?: string | null;
          credential_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kb_documents: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          source: string;
          source_id: string | null;
          category: string;
          file_name: string | null;
          byte_size: number | null;
          status: string;
          ai_enabled: boolean;
          chunk_count: number;
          error: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          title: string;
          source?: string;
          source_id?: string | null;
          category?: string;
          file_name?: string | null;
          byte_size?: number | null;
          status?: string;
          ai_enabled?: boolean;
          chunk_count?: number;
          error?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          title?: string;
          source?: string;
          source_id?: string | null;
          category?: string;
          file_name?: string | null;
          byte_size?: number | null;
          status?: string;
          ai_enabled?: boolean;
          chunk_count?: number;
          error?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kb_chunks: {
        Row: {
          id: string;
          document_id: string;
          org_id: string;
          chunk_index: number;
          content: string;
          token_estimate: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          org_id: string;
          chunk_index: number;
          content: string;
          token_estimate?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          org_id?: string;
          chunk_index?: number;
          content?: string;
          token_estimate?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      complaints: {
        Row: {
          id: string;
          org_id: string;
          reporter_user_id: string | null;
          reporter_employee_id: string | null;
          is_anonymous: boolean;
          subject_employee_id: string | null;
          title: string;
          description: string;
          category: string;
          severity: string;
          is_sensitive: boolean;
          status: string;
          assigned_to: string | null;
          resolution: string | null;
          ai_summary: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          reporter_user_id?: string | null;
          reporter_employee_id?: string | null;
          is_anonymous?: boolean;
          subject_employee_id?: string | null;
          title: string;
          description: string;
          category?: string;
          severity?: string;
          is_sensitive?: boolean;
          status?: string;
          assigned_to?: string | null;
          resolution?: string | null;
          ai_summary?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          reporter_user_id?: string | null;
          reporter_employee_id?: string | null;
          is_anonymous?: boolean;
          subject_employee_id?: string | null;
          title?: string;
          description?: string;
          category?: string;
          severity?: string;
          is_sensitive?: boolean;
          status?: string;
          assigned_to?: string | null;
          resolution?: string | null;
          ai_summary?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      automation_workflows: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          nl_prompt: string | null;
          trigger_type: string;
          trigger_days: number;
          action_type: string;
          action_config: Json;
          is_active: boolean;
          last_run_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          nl_prompt?: string | null;
          trigger_type: string;
          trigger_days?: number;
          action_type: string;
          action_config?: Json;
          is_active?: boolean;
          last_run_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          nl_prompt?: string | null;
          trigger_type?: string;
          trigger_days?: number;
          action_type?: string;
          action_config?: Json;
          is_active?: boolean;
          last_run_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_permission: {
        Args: { _org_id: string; _permission: string };
        Returns: boolean;
      };
      is_org_admin: {
        Args: { _org_id: string };
        Returns: boolean;
      };
      is_org_member: {
        Args: { _org_id: string };
        Returns: boolean;
      };
      manages_employee: {
        Args: { _employee_id: string };
        Returns: boolean;
      };
      is_workspace_owner: {
        Args: { _org_id: string };
        Returns: boolean;
      };
      match_kb_chunks: {
        Args: { p_org_id: string; p_query: string; p_match_count?: number };
        Returns: {
          chunk_id: string;
          document_id: string;
          doc_title: string;
          content: string;
          rank: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}

// Convenience row-type aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organisation = Database["public"]["Tables"]["organisations"]["Row"];
export type OrgMember = Database["public"]["Tables"]["org_members"]["Row"];
export type OrgIntegration = Database["public"]["Tables"]["org_integrations"]["Row"];
export type OrgEnabledSkill = Database["public"]["Tables"]["org_enabled_skills"]["Row"];
export type RolePermission = Database["public"]["Tables"]["role_permissions"]["Row"];
export type OrgRoleAuditLog = Database["public"]["Tables"]["org_role_audit_log"]["Row"];
export type ScheduledReport = Database["public"]["Tables"]["scheduled_reports"]["Row"];
export type SavedReportView = Database["public"]["Tables"]["saved_report_views"]["Row"];
export type Employee = Database["public"]["Tables"]["employees"]["Row"];
export type EmployeeDocument = Database["public"]["Tables"]["employee_documents"]["Row"];
export type DocumentRequirementTemplate = Database["public"]["Tables"]["document_requirement_templates"]["Row"];
export type DocumentRequirement = Database["public"]["Tables"]["document_requirements"]["Row"];
export type EmployeeDocumentStatus = Database["public"]["Tables"]["employee_document_status"]["Row"];
export type DocumentAcknowledgment = Database["public"]["Tables"]["document_acknowledgments"]["Row"];
export type EmployeeProfileChangeRequest = Database["public"]["Tables"]["employee_profile_change_requests"]["Row"];
export type EmployeeTask = Database["public"]["Tables"]["employee_tasks"]["Row"];
export type WorkspaceAnnouncement = Database["public"]["Tables"]["workspace_announcements"]["Row"];
export type ApprovalWorkflow = Database["public"]["Tables"]["approval_workflows"]["Row"];
export type ApprovalWorkflowStep = Database["public"]["Tables"]["approval_workflow_steps"]["Row"];
export type ApprovalRequest = Database["public"]["Tables"]["approval_requests"]["Row"];
export type ApprovalDecision = Database["public"]["Tables"]["approval_decisions"]["Row"];
export type LifecycleTemplate = Database["public"]["Tables"]["lifecycle_templates"]["Row"];
export type LifecycleTemplateTask = Database["public"]["Tables"]["lifecycle_template_tasks"]["Row"];
export type LifecycleRun = Database["public"]["Tables"]["lifecycle_runs"]["Row"];
export type LifecycleTask = Database["public"]["Tables"]["lifecycle_tasks"]["Row"];
export type WorkflowRun = Database["public"]["Tables"]["workflow_runs"]["Row"];
export type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"];
export type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"];
export type GeneratedDocument = Database["public"]["Tables"]["generated_documents"]["Row"];
export type ContentFeedback = Database["public"]["Tables"]["content_feedback"]["Row"];
export type SavedItem = Database["public"]["Tables"]["saved_items"]["Row"];
export type Complaint = Database["public"]["Tables"]["complaints"]["Row"];
export type AutomationWorkflow = Database["public"]["Tables"]["automation_workflows"]["Row"];
export type KbDocument = Database["public"]["Tables"]["kb_documents"]["Row"];
export type KbChunk = Database["public"]["Tables"]["kb_chunks"]["Row"];
export type CopilotConversation = Database["public"]["Tables"]["copilot_conversations"]["Row"];
export type CopilotMessage = Database["public"]["Tables"]["copilot_messages"]["Row"];
export type CommunityThread = Database["public"]["Tables"]["community_threads"]["Row"];
export type CommunityReply = Database["public"]["Tables"]["community_replies"]["Row"];
export type CommunityVote = Database["public"]["Tables"]["community_votes"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type UsageTracking = Database["public"]["Tables"]["usage_tracking"]["Row"];
export type OrgInvite = Database["public"]["Tables"]["org_invites"]["Row"];
export type SupportTicket = Database["public"]["Tables"]["support_tickets"]["Row"];
export type SupportTicketMessage = Database["public"]["Tables"]["support_ticket_messages"]["Row"];
export type AdminAuditLog = Database["public"]["Tables"]["admin_audit_log"]["Row"];
export type StatusIncident = Database["public"]["Tables"]["status_incidents"]["Row"];
export type BetaInvite = Database["public"]["Tables"]["beta_invites"]["Row"];
export type BetaFeedback = Database["public"]["Tables"]["beta_feedback"]["Row"];
export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"];
export type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];
export type PolicyLibraryItem = Database["public"]["Tables"]["policy_library"]["Row"];
export type PayrollRun = Database["public"]["Tables"]["payroll_runs"]["Row"];
export type PayrollEntry = Database["public"]["Tables"]["payroll_entries"]["Row"];
export type PerformanceCycle = Database["public"]["Tables"]["performance_cycles"]["Row"];
export type PerformanceReview = Database["public"]["Tables"]["performance_reviews"]["Row"];
export type Survey = Database["public"]["Tables"]["surveys"]["Row"];
export type SurveyResponse = Database["public"]["Tables"]["survey_responses"]["Row"];
export type JobPosting = Job;
export type Candidate = JobApplication;
export type CompanyAsset = Database["public"]["Tables"]["company_assets"]["Row"];
export type AssetAssignment = Database["public"]["Tables"]["asset_assignments"]["Row"];
export type BenefitPlan = Database["public"]["Tables"]["benefit_plans"]["Row"];
export type BenefitEnrolment = Database["public"]["Tables"]["benefit_enrolments"]["Row"];
export type DisciplinaryCase = Database["public"]["Tables"]["disciplinary_cases"]["Row"];
export type ExitRecord = Database["public"]["Tables"]["exit_records"]["Row"];
export type ExitChecklistItem = Database["public"]["Tables"]["exit_checklist_items"]["Row"];
export type LMSCourse = Database["public"]["Tables"]["lms_courses"]["Row"];
export type LMSEnrolment = Database["public"]["Tables"]["lms_enrolments"]["Row"];
export type LMSCertification = Database["public"]["Tables"]["lms_certifications"]["Row"];
export type SuccessionCandidate = Database["public"]["Tables"]["succession_candidates"]["Row"];
export type JobReferral = Database["public"]["Tables"]["job_referrals"]["Row"];

// ─── Travel & Expenses ────────────────────────────────────────────────────────

export type ExpenseCategory =
  | "meal"
  | "transport"
  | "accommodation"
  | "supplies"
  | "equipment"
  | "client_entertainment"
  | "conference"
  | "other";

export type ExpenseStatus = "draft" | "pending" | "approved" | "rejected" | "reimbursed";

export type Expense = {
  id: string;
  org_id: string;
  employee_id: string;
  submitted_by: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  merchant: string | null;
  expense_date: string;
  receipt_url: string | null;
  status: ExpenseStatus;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  reimbursed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TravelStatus = "draft" | "pending" | "approved" | "rejected" | "cancelled" | "completed";

export type TravelRequest = {
  id: string;
  org_id: string;
  employee_id: string;
  submitted_by: string | null;
  purpose: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  estimated_budget: number | null;
  currency: string;
  status: TravelStatus;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  airline: string | null;
  flight_number: string | null;
  hotel_name: string | null;
  hotel_confirmation: string | null;
  check_in: string | null;
  check_out: string | null;
  per_diem_rate: number | null;
  actual_cost: number | null;
  booking_notes: string | null;
  created_at: string;
  updated_at: string;
};
