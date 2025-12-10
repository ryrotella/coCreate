-- Migration: Add buckets for organizing nodes (like 3D folders)
-- Created: 2024-12-09

-- Create buckets table (3D folders that can contain nodes)
CREATE TABLE IF NOT EXISTS buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bubble_world_id UUID NOT NULL REFERENCES bubble_worlds(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Bucket',
  description TEXT,
  color TEXT DEFAULT '#6366f1', -- Default indigo color
  -- 3D position in the bubble world
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 1,
  position_z REAL DEFAULT 0,
  scale REAL DEFAULT 1,
  -- Visual style
  is_expanded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bucket_nodes junction table (nodes in buckets with attribution)
CREATE TABLE IF NOT EXISTS bucket_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  added_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Position within the bucket (relative to bucket center)
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  position_z REAL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Each node can only be in each bucket once
  UNIQUE(bucket_id, node_id)
);

-- Add bucket_id to saved_nodes to track which bucket a saved node was added to
ALTER TABLE saved_nodes
ADD COLUMN IF NOT EXISTS bucket_id UUID REFERENCES buckets(id) ON DELETE SET NULL;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_buckets_bubble_world_id ON buckets(bubble_world_id);
CREATE INDEX IF NOT EXISTS idx_buckets_creator_id ON buckets(creator_id);
CREATE INDEX IF NOT EXISTS idx_bucket_nodes_bucket_id ON bucket_nodes(bucket_id);
CREATE INDEX IF NOT EXISTS idx_bucket_nodes_node_id ON bucket_nodes(node_id);
CREATE INDEX IF NOT EXISTS idx_bucket_nodes_added_by ON bucket_nodes(added_by_id);
CREATE INDEX IF NOT EXISTS idx_saved_nodes_bucket_id ON saved_nodes(bucket_id);

-- Enable RLS
ALTER TABLE buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_nodes ENABLE ROW LEVEL SECURITY;

-- Bucket policies
-- Everyone can view buckets (public viewing of others' spaces)
CREATE POLICY "Buckets are viewable by everyone"
  ON buckets
  FOR SELECT
  USING (true);

-- Only bubble world owners can create buckets in their world
CREATE POLICY "Users can create buckets in own world"
  ON buckets
  FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM bubble_worlds
      WHERE id = bubble_world_id AND user_id = auth.uid()
    )
  );

-- Only creators can update their buckets
CREATE POLICY "Users can update own buckets"
  ON buckets
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- Only creators can delete their buckets
CREATE POLICY "Users can delete own buckets"
  ON buckets
  FOR DELETE
  USING (auth.uid() = creator_id);

-- Bucket_nodes policies
-- Everyone can view bucket contents
CREATE POLICY "Bucket nodes are viewable by everyone"
  ON bucket_nodes
  FOR SELECT
  USING (true);

-- Bucket owner can add nodes to their buckets
CREATE POLICY "Bucket owners can add nodes"
  ON bucket_nodes
  FOR INSERT
  WITH CHECK (
    auth.uid() = added_by_id
    AND EXISTS (
      SELECT 1 FROM buckets
      WHERE id = bucket_id AND creator_id = auth.uid()
    )
  );

-- Bucket owner can remove nodes from their buckets
CREATE POLICY "Bucket owners can remove nodes"
  ON bucket_nodes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM buckets
      WHERE id = bucket_id AND creator_id = auth.uid()
    )
  );

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bucket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_buckets_updated_at
  BEFORE UPDATE ON buckets
  FOR EACH ROW
  EXECUTE FUNCTION update_bucket_updated_at();

-- Grant permissions
GRANT SELECT ON buckets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON buckets TO authenticated;
GRANT SELECT ON bucket_nodes TO anon, authenticated;
GRANT INSERT, DELETE ON bucket_nodes TO authenticated;
