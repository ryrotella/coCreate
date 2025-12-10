-- Connections table (user-to-user relationships)
CREATE TABLE public.connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  connection_type TEXT NOT NULL DEFAULT 'follow', -- 'follow', 'collaboration', 'inspiration'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate connections and self-follows
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_connection UNIQUE (follower_id, following_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_connections_follower ON public.connections(follower_id);
CREATE INDEX idx_connections_following ON public.connections(following_id);
CREATE INDEX idx_connections_type ON public.connections(connection_type);
CREATE INDEX idx_connections_created ON public.connections(created_at DESC);

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Everyone can view connections (needed for network visualization)
CREATE POLICY "Connections are viewable by everyone"
  ON public.connections FOR SELECT
  USING (true);

-- Users can only create connections where they are the follower
CREATE POLICY "Users can create their own connections"
  ON public.connections FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can only delete their own connections (unfollow)
CREATE POLICY "Users can delete their own connections"
  ON public.connections FOR DELETE
  USING (auth.uid() = follower_id);

-- Users can update their own connections (change type)
CREATE POLICY "Users can update their own connections"
  ON public.connections FOR UPDATE
  USING (auth.uid() = follower_id);
