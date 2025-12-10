-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nodes table (content items)
CREATE TABLE public.nodes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'link'
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT, -- 'text', 'image', 'link', etc.
  content_data JSONB, -- Flexible storage: {url, text, metadata, etc.}
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bubble worlds table (user's 3D space)
CREATE TABLE public.bubble_worlds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT DEFAULT 'My Bubble',
  environment JSONB DEFAULT '{
    "skyColor": "#87ceeb",
    "groundColor": "#90ee90",
    "fogColor": "#ffffff",
    "fogDensity": 0.01,
    "lightIntensity": 1.0
  }'::jsonb,
  layout_type TEXT DEFAULT 'floating', -- 'gallery', 'garden', 'floating', 'room'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Node placements table (where nodes are in the bubble)
CREATE TABLE public.node_placements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE NOT NULL,
  bubble_world_id UUID REFERENCES public.bubble_worlds(id) ON DELETE CASCADE NOT NULL,
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  position_z REAL DEFAULT 0,
  scale REAL DEFAULT 1.0,
  rotation_y REAL DEFAULT 0,
  display_style TEXT DEFAULT 'card', -- 'card', 'frame', 'hologram'
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(node_id, bubble_world_id)
);

-- Indexes for better performance
CREATE INDEX idx_nodes_creator ON public.nodes(creator_id);
CREATE INDEX idx_nodes_type ON public.nodes(type);
CREATE INDEX idx_nodes_created ON public.nodes(created_at DESC);
CREATE INDEX idx_node_placements_bubble ON public.node_placements(bubble_world_id);
CREATE INDEX idx_node_placements_node ON public.node_placements(node_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bubble_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_placements ENABLE ROW LEVEL SECURITY;

-- Users: Everyone can read, users can update their own
CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Nodes: Everyone can read, creators can CUD their own
CREATE POLICY "Nodes are viewable by everyone"
  ON public.nodes FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own nodes"
  ON public.nodes FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own nodes"
  ON public.nodes FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own nodes"
  ON public.nodes FOR DELETE
  USING (auth.uid() = creator_id);

-- Bubble Worlds: Everyone can read, owners can update
CREATE POLICY "Bubble worlds are viewable by everyone"
  ON public.bubble_worlds FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own bubble world"
  ON public.bubble_worlds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bubble world"
  ON public.bubble_worlds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bubble world"
  ON public.bubble_worlds FOR DELETE
  USING (auth.uid() = user_id);

-- Node Placements: Everyone can read, bubble owners can modify
CREATE POLICY "Node placements are viewable by everyone"
  ON public.node_placements FOR SELECT
  USING (true);

CREATE POLICY "Bubble owners can create placements"
  ON public.node_placements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bubble_worlds
      WHERE id = bubble_world_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Bubble owners can update placements"
  ON public.node_placements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bubble_worlds
      WHERE id = bubble_world_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Bubble owners can delete placements"
  ON public.node_placements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bubble_worlds
      WHERE id = bubble_world_id AND user_id = auth.uid()
    )
  );

-- Function to automatically create bubble world on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.bubble_worlds (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'My Bubble') || '''s Bubble');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile and bubble on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_nodes
  BEFORE UPDATE ON public.nodes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_bubble_worlds
  BEFORE UPDATE ON public.bubble_worlds
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_node_placements
  BEFORE UPDATE ON public.node_placements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
