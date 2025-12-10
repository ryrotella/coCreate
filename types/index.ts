import { Database } from './database'

// Extract row types from database
export type User = Database['public']['Tables']['users']['Row']
export type Node = Database['public']['Tables']['nodes']['Row']
export type BubbleWorld = Database['public']['Tables']['bubble_worlds']['Row']
export type NodePlacement = Database['public']['Tables']['node_placements']['Row']
export type Connection = Database['public']['Tables']['connections']['Row']
export type SavedNode = Database['public']['Tables']['saved_nodes']['Row']
export type Bucket = Database['public']['Tables']['buckets']['Row']
export type BucketNode = Database['public']['Tables']['bucket_nodes']['Row']
export type Stream = Database['public']['Tables']['streams']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type NodeInsert = Database['public']['Tables']['nodes']['Insert']
export type BubbleWorldInsert = Database['public']['Tables']['bubble_worlds']['Insert']
export type NodePlacementInsert = Database['public']['Tables']['node_placements']['Insert']
export type ConnectionInsert = Database['public']['Tables']['connections']['Insert']
export type SavedNodeInsert = Database['public']['Tables']['saved_nodes']['Insert']
export type BucketInsert = Database['public']['Tables']['buckets']['Insert']
export type BucketNodeInsert = Database['public']['Tables']['bucket_nodes']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type NodeUpdate = Database['public']['Tables']['nodes']['Update']
export type BubbleWorldUpdate = Database['public']['Tables']['bubble_worlds']['Update']
export type NodePlacementUpdate = Database['public']['Tables']['node_placements']['Update']
export type ConnectionUpdate = Database['public']['Tables']['connections']['Update']
export type BucketUpdate = Database['public']['Tables']['buckets']['Update']
export type BucketNodeUpdate = Database['public']['Tables']['bucket_nodes']['Update']
export type StreamInsert = Database['public']['Tables']['streams']['Insert']
export type StreamUpdate = Database['public']['Tables']['streams']['Update']

// Stream status type
export type StreamStatus = 'live' | 'ended'

// Stream with creator details
export interface StreamWithCreator extends Stream {
  creator: User
}

// Connection types
export type ConnectionType = 'follow' | 'collaboration' | 'inspiration'

// Connection with user details (for displaying followers/following lists)
export interface ConnectionWithUser extends Connection {
  follower?: User
  following?: User
}

// Environment configuration
export interface BubbleEnvironment {
  skyColor: string
  groundColor: string
  fogColor: string
  fogDensity: number
  lightIntensity: number
}

// Node content types
export interface TextContent {
  text: string
}

export interface ImageContent {
  url: string
  alt?: string
  width?: number
  height?: number
}

export interface LinkContent {
  url: string
  title?: string
  description?: string
  imageUrl?: string
}

export interface VideoContent {
  url: string
  platform: 'youtube' | 'vimeo' | 'other'
  videoId: string
  thumbnailUrl?: string
  title?: string
  duration?: string
}

export type NodeContentData = TextContent | ImageContent | LinkContent | VideoContent

// Node with placement (for rendering in 3D)
export interface NodeWithPlacement extends Node {
  placement?: NodePlacement
  bucket_id?: string | null // If this node is in a bucket
  creator?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

// Bucket with nodes (for rendering in 3D)
export interface BucketWithNodes extends Bucket {
  nodes: BucketNodeWithDetails[]
}

// Bucket node with full details (node data + who added it)
export interface BucketNodeWithDetails extends BucketNode {
  node: Node
  added_by: User
}

// Node connection (who added this node to their collection/bucket)
export interface NodeConnection {
  id: string
  user: User
  bucket?: Bucket | null
  added_at: string
}

// Node with all its connections (Are.na-style)
export interface NodeWithConnections extends Node {
  creator: User
  connections: NodeConnection[]
  connection_count: number
}

// Bubble world with nodes
export interface BubbleWorldWithNodes extends BubbleWorld {
  nodes: NodeWithPlacement[]
  owner: User
}

// 3D Position
export interface Position3D {
  x: number
  y: number
  z: number
}

// Display styles for nodes in 3D
export type DisplayStyle = 'card' | 'frame' | 'hologram' | 'sculpture'

// Layout types
export type LayoutType = 'gallery' | 'garden' | 'floating' | 'room' | 'spiral'

// Network View Types
export interface NetworkNode {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  nodeCount: number
  // Position calculated by d3-force
  x?: number
  y?: number
  z?: number
  // Velocity for physics
  vx?: number
  vy?: number
  vz?: number
}

export interface NetworkLink {
  id: string
  source: string | NetworkNode
  target: string | NetworkNode
  type: 'follow' | 'collaboration' | 'inspiration'
}

export interface NetworkGraphData {
  nodes: NetworkNode[]
  links: NetworkLink[]
}

// 2.5D Isometric Network Types
export interface LayerConfig {
  maxNodesPerLayer: number
  layerSpacing: number  // pixels in Z
  scaleFactor: number   // 0-1, scale reduction per layer
  opacityFactor: number // 0-1, opacity reduction per layer
}

export interface IsometricPosition {
  x: number
  y: number
  layer: number
}

export interface NetworkLayerData {
  layerIndex: number
  nodes: NetworkNode[]
  isActive: boolean
}
