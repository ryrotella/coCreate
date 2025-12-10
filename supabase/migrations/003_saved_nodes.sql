-- Migration: Add saved_nodes table for saving other users' nodes to your collection
-- Created: 2024-12-09

-- Create saved_nodes table
CREATE TABLE IF NOT EXISTS saved_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  original_creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure a user can only save each node once
  UNIQUE(user_id, node_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_saved_nodes_user_id ON saved_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_nodes_node_id ON saved_nodes(node_id);
CREATE INDEX IF NOT EXISTS idx_saved_nodes_original_creator ON saved_nodes(original_creator_id);

-- Enable RLS
ALTER TABLE saved_nodes ENABLE ROW LEVEL SECURITY;

-- Users can see their own saved nodes
CREATE POLICY "Users can view own saved nodes"
  ON saved_nodes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can save nodes (but not their own)
CREATE POLICY "Users can save others' nodes"
  ON saved_nodes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() != original_creator_id
  );

-- Users can delete their own saved nodes
CREATE POLICY "Users can unsave nodes"
  ON saved_nodes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON saved_nodes TO authenticated;
