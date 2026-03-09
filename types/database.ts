/**
 * Auto-generated types for Supabase database schema.
 * Regenerate with: npx supabase gen types typescript --project-id uuridzmajcooiwcpoyyt
 */
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
      parties: {
        Row: {
          id: string;
          name: string;
          abbreviation: string | null;
          logo_url: string | null;
          founded_year: number | null;
          ideology: string | null;
          parent_party_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["parties"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["parties"]["Insert"]>;
      };
      politicians: {
        Row: {
          id: string;
          name: string;
          name_hindi: string | null;
          slug: string;
          profile_image_url: string | null;
          date_of_birth: string | null;
          gender: string | null;
          education: string | null;
          party_id: string | null;
          constituency: string | null;
          state: string | null;
          house: "lok_sabha" | "rajya_sabha" | "vidhan_sabha" | null;
          term_start: string | null;
          term_end: string | null;
          is_active: boolean;
          pan_card_last4: string | null;
          aadhaar_masked: string | null;
          contact_email: string | null;
          official_website: string | null;
          social_twitter: string | null;
          social_facebook: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["politicians"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["politicians"]["Insert"]>;
      };
      election_terms: {
        Row: {
          id: string;
          politician_id: string;
          election_year: number;
          house: string | null;
          constituency: string | null;
          state: string | null;
          votes_received: number | null;
          vote_share_percent: number | null;
          margin: number | null;
          result: "won" | "lost" | "no_contest" | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["election_terms"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["election_terms"]["Insert"]>;
      };
      assets_declarations: {
        Row: {
          id: string;
          politician_id: string;
          declaration_year: number;
          election_id: string | null;
          cash_in_hand: number | null;
          bank_deposits: number | null;
          bonds_debentures: number | null;
          nsc_postal: number | null;
          lic_policies: number | null;
          personal_loans_given: number | null;
          motor_vehicles: number | null;
          jewelry_gold: number | null;
          other_movable: number | null;
          total_movable_assets: number | null;
          agricultural_land: number | null;
          non_agricultural_land: number | null;
          buildings: number | null;
          other_immovable: number | null;
          total_immovable_assets: number | null;
          total_assets: number | null;
          total_liabilities: number | null;
          net_worth: number | null;
          spouse_total_assets: number | null;
          spouse_total_liabilities: number | null;
          source_url: string | null;
          source_type: string | null;
          verified: boolean;
          raw_affidavit_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["assets_declarations"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["assets_declarations"]["Insert"]>;
      };
      criminal_cases: {
        Row: {
          id: string;
          politician_id: string;
          case_number: string | null;
          court_name: string | null;
          court_type: string | null;
          state: string | null;
          ipc_sections: string[] | null;
          case_description: string | null;
          case_year: number | null;
          date_of_filing: string | null;
          current_status: "pending" | "convicted" | "acquitted" | "discharged" | "stayed" | "unknown" | null;
          conviction_year: number | null;
          sentence_description: string | null;
          is_heinous: boolean;
          source_url: string | null;
          declaration_year: number | null;
          ecourts_case_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["criminal_cases"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["criminal_cases"]["Insert"]>;
      };
      company_interests: {
        Row: {
          id: string;
          politician_id: string;
          company_name: string | null;
          cin: string | null;
          role: string | null;
          share_percentage: number | null;
          company_type: string | null;
          company_status: string | null;
          mca_data_url: string | null;
          has_govt_contracts: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["company_interests"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_interests"]["Insert"]>;
      };
      govt_tenders: {
        Row: {
          id: string;
          politician_id: string;
          company_id: string | null;
          tender_id: string | null;
          tender_title: string | null;
          tendering_authority: string | null;
          contract_value: number | null;
          award_date: string | null;
          source: string | null;
          source_url: string | null;
          conflict_of_interest_flag: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["govt_tenders"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["govt_tenders"]["Insert"]>;
      };
      fund_usage: {
        Row: {
          id: string;
          politician_id: string;
          fund_type: "mplad" | "mlalad" | null;
          financial_year: string | null;
          total_allocated: number | null;
          total_released: number | null;
          total_utilized: number | null;
          utilization_percent: number | null;
          projects: Json | null;
          source_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["fund_usage"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fund_usage"]["Insert"]>;
      };
      controversies: {
        Row: {
          id: string;
          politician_id: string;
          title: string;
          description: string | null;
          controversy_type: string | null;
          severity: "low" | "medium" | "high" | "critical" | null;
          date_of_incident: string | null;
          news_links: string[] | null;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["controversies"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["controversies"]["Insert"]>;
      };
      corruption_signals: {
        Row: {
          id: string;
          politician_id: string;
          signal_type: string | null;
          signal_severity: "low" | "medium" | "high" | "critical" | null;
          signal_description: string | null;
          evidence_links: string[] | null;
          auto_generated: boolean;
          is_dismissed: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["corruption_signals"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["corruption_signals"]["Insert"]>;
      };
      attendance_records: {
        Row: {
          id: string;
          politician_id: string;
          session_year: number | null;
          session_name: string | null;
          days_present: number | null;
          total_days: number | null;
          attendance_percent: number | null;
          questions_asked: number | null;
          debates_participated: number | null;
          bills_introduced: number | null;
          source_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["attendance_records"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance_records"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
