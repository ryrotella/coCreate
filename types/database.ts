export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      nodes: {
        Row: {
          id: string
          creator_id: string
          type: string
          title: string
          description: string | null
          content_type: string | null
          content_data: Json | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          type?: string
          title: string
          description?: string | null
          content_type?: string | null
          content_data?: Json | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          type?: string
          title?: string
          description?: string | null
          content_type?: string | null
          content_data?: Json | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      bubble_worlds: {
        Row: {
          id: string
          user_id: string
          name: string
          environment: Json
          layout_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          environment?: Json
          layout_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          environment?: Json
          layout_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      node_placements: {
        Row: {
          id: string
          node_id: string
          bubble_world_id: string
          position_x: number
          position_y: number
          position_z: number
          scale: number
          rotation_y: number
          display_style: string
          updated_at: string
        }
        Insert: {
          id?: string
          node_id: string
          bubble_world_id: string
          position_x?: number
          position_y?: number
          position_z?: number
          scale?: number
          rotation_y?: number
          display_style?: string
          updated_at?: string
        }
        Update: {
          id?: string
          node_id?: string
          bubble_world_id?: string
          position_x?: number
          position_y?: number
          position_z?: number
          scale?: number
          rotation_y?: number
          display_style?: string
          updated_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          connection_type: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          connection_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          connection_type?: string
          created_at?: string
        }
      }
      saved_nodes: {
        Row: {
          id: string
          user_id: string
          node_id: string
          original_creator_id: string
          bucket_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          node_id: string
          original_creator_id: string
          bucket_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          node_id?: string
          original_creator_id?: string
          bucket_id?: string | null
          created_at?: string
        }
      }
      buckets: {
        Row: {
          id: string
          bubble_world_id: string
          creator_id: string
          name: string
          description: string | null
          color: string
          position_x: number
          position_y: number
          position_z: number
          scale: number
          is_expanded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bubble_world_id: string
          creator_id: string
          name?: string
          description?: string | null
          color?: string
          position_x?: number
          position_y?: number
          position_z?: number
          scale?: number
          is_expanded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bubble_world_id?: string
          creator_id?: string
          name?: string
          description?: string | null
          color?: string
          position_x?: number
          position_y?: number
          position_z?: number
          scale?: number
          is_expanded?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bucket_nodes: {
        Row: {
          id: string
          bucket_id: string
          node_id: string
          added_by_id: string
          position_x: number
          position_y: number
          position_z: number
          added_at: string
        }
        Insert: {
          id?: string
          bucket_id: string
          node_id: string
          added_by_id: string
          position_x?: number
          position_y?: number
          position_z?: number
          added_at?: string
        }
        Update: {
          id?: string
          bucket_id?: string
          node_id?: string
          added_by_id?: string
          position_x?: number
          position_y?: number
          position_z?: number
          added_at?: string
        }
      }
      streams: {
        Row: {
          id: string
          creator_id: string
          room_name: string
          room_url: string
          status: 'live' | 'ended'
          started_at: string
          ended_at: string | null
          viewer_count: number
        }
        Insert: {
          id?: string
          creator_id: string
          room_name: string
          room_url: string
          status?: 'live' | 'ended'
          started_at?: string
          ended_at?: string | null
          viewer_count?: number
        }
        Update: {
          id?: string
          creator_id?: string
          room_name?: string
          room_url?: string
          status?: 'live' | 'ended'
          started_at?: string
          ended_at?: string | null
          viewer_count?: number
        }
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
  }
}
