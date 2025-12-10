-- Phase 2: Streams table for Daily.co live streaming
CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  room_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  viewer_count INTEGER DEFAULT 0,

  -- Constraints
  CONSTRAINT unique_room_name UNIQUE (room_name)
);

-- Index for finding active streams quickly
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status) WHERE status = 'live';

-- Index for finding user's streams
CREATE INDEX IF NOT EXISTS idx_streams_creator ON streams(creator_id);

-- Enable RLS
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;

-- Anyone can view active streams
CREATE POLICY "Anyone can view streams" ON streams
  FOR SELECT USING (true);

-- Users can create their own streams
CREATE POLICY "Users can create own streams" ON streams
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Users can update their own streams (e.g., end stream, update viewer count)
CREATE POLICY "Users can update own streams" ON streams
  FOR UPDATE USING (auth.uid() = creator_id);

-- Users can delete their own streams
CREATE POLICY "Users can delete own streams" ON streams
  FOR DELETE USING (auth.uid() = creator_id);

-- Enable realtime for streams table
ALTER PUBLICATION supabase_realtime ADD TABLE streams;
