import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 型安全なクライアント（後で型定義追加）
export type Database = {
  public: {
    Tables: {
      buildings_table_2: {
        Row: {
          building_id: number
          uid: string
          title: string
          titleEn: string | null
          thumbnailUrl: string | null
          youtubeUrl: string | null
          completionYears: string | null
          parentBuildingTypes: string | null
          parentBuildingTypesEn: string | null
          buildingTypes: string | null
          buildingTypesEn: string | null
          parentStructures: string | null
          parentStructuresEn: string | null
          structures: string | null
          structuresEn: string | null
          prefectures: string | null
          prefecturesEn: string | null
          areas: string
          areasEn: string | null
          location: string
          locationEn_from_datasheetChunkEn: string | null
          architectDetails: string | null
          datasheetChunkEn: string | null
          lat: number | null
          lng: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          building_id?: number
          uid: string
          title: string
          titleEn?: string | null
          thumbnailUrl?: string | null
          youtubeUrl?: string | null
          completionYears?: string | null
          parentBuildingTypes?: string | null
          parentBuildingTypesEn?: string | null
          buildingTypes?: string | null
          buildingTypesEn?: string | null
          parentStructures?: string | null
          parentStructuresEn?: string | null
          structures?: string | null
          structuresEn?: string | null
          prefectures?: string | null
          prefecturesEn?: string | null
          areas: string
          areasEn?: string | null
          location: string
          locationEn_from_datasheetChunkEn?: string | null
          architectDetails?: string | null
          datasheetChunkEn?: string | null
          lat?: number | null
          lng?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          building_id?: number
          uid?: string
          title?: string
          titleEn?: string | null
          thumbnailUrl?: string | null
          youtubeUrl?: string | null
          completionYears?: string | null
          parentBuildingTypes?: string | null
          parentBuildingTypesEn?: string | null
          buildingTypes?: string | null
          buildingTypesEn?: string | null
          parentStructures?: string | null
          parentStructuresEn?: string | null
          structures?: string | null
          structuresEn?: string | null
          prefectures?: string | null
          prefecturesEn?: string | null
          areas?: string
          areasEn?: string | null
          location?: string
          locationEn_from_datasheetChunkEn?: string | null
          architectDetails?: string | null
          datasheetChunkEn?: string | null
          lat?: number | null
          lng?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      architects_table: {
        Row: {
          architect_id: number
          architectJa: string
          architectEn: string
        }
        Insert: {
          architect_id?: number
          architectJa: string
          architectEn: string
        }
        Update: {
          architect_id?: number
          architectJa?: string
          architectEn?: string
        }
      }
      building_architects: {
        Row: {
          building_id: number
          architect_id: number
          architect_order: number
        }
        Insert: {
          building_id: number
          architect_id: number
          architect_order: number
        }
        Update: {
          building_id?: number
          architect_id?: number
          architect_order?: number
        }
      }
      architect_websites_3: {
        Row: {
          website_id: number
          architect_id: number
          url: string | null
          architectJa: string
          architectEn: string | null
          invalid: boolean | null
          title: string | null
        }
        Insert: {
          website_id?: number
          architect_id: number
          url?: string | null
          architectJa: string
          architectEn?: string | null
          invalid?: boolean | null
          title?: string | null
        }
        Update: {
          website_id?: number
          architect_id?: number
          url?: string | null
          architectJa?: string
          architectEn?: string | null
          invalid?: boolean | null
          title?: string | null
        }
      }
      photos: {
        Row: {
          id: number
          building_id: number
          url: string
          thumbnail_url: string
          likes: number
          created_at: string
        }
        Insert: {
          id?: number
          building_id: number
          url: string
          thumbnail_url: string
          likes?: number
          created_at?: string
        }
        Update: {
          id?: number
          building_id?: number
          url?: string
          thumbnail_url?: string
          likes?: number
          created_at?: string
        }
      }
    }
  }
}