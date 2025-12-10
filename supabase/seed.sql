-- This seed script assumes you've created a test user via Supabase Auth UI
-- Go to: Authentication > Users > Add User
-- Email: test@example.com
-- Password: testpassword123
-- Then get the user's UUID from the table and replace YOUR_USER_ID below

-- Or use this to find your user ID after creating via UI:
-- SELECT id, email FROM auth.users;

-- Replace this with your actual user ID from auth.users
DO $$
DECLARE
  test_user_id UUID;
  bubble_id UUID;
  node1_id UUID;
  node2_id UUID;
  node3_id UUID;
BEGIN
  -- Get the first user (or create a test user if none exists)
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please create a test user in Supabase Auth UI first.';
  END IF;

  -- Get their bubble world
  SELECT id INTO bubble_id FROM public.bubble_worlds WHERE user_id = test_user_id;

  -- Create sample nodes
  INSERT INTO public.nodes (id, creator_id, type, title, description, content_type, content_data)
  VALUES
    (
      uuid_generate_v4(),
      test_user_id,
      'text',
      'Welcome to Bubble Network',
      'This is my first node in my bubble world!',
      'text',
      '{"text": "Welcome to Bubble Network! This is a 3D social space where you can curate and share your creative work."}'::jsonb
    ),
    (
      uuid_generate_v4(),
      test_user_id,
      'image',
      'Cool Artwork',
      'A piece I found inspiring',
      'image',
      '{"url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400", "alt": "Abstract colorful art"}'::jsonb
    ),
    (
      uuid_generate_v4(),
      test_user_id,
      'link',
      'Inspiration Link',
      'A cool website I found',
      'link',
      '{"url": "https://are.na", "title": "Are.na", "description": "A platform for connecting ideas"}'::jsonb
    )
  RETURNING id INTO node1_id;

  -- Get all created node IDs
  SELECT id INTO node1_id FROM public.nodes WHERE creator_id = test_user_id ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO node2_id FROM public.nodes WHERE creator_id = test_user_id ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO node3_id FROM public.nodes WHERE creator_id = test_user_id ORDER BY created_at LIMIT 1 OFFSET 2;

  -- Place nodes in bubble world (arranged in a circle)
  INSERT INTO public.node_placements (node_id, bubble_world_id, position_x, position_y, position_z, scale, display_style)
  VALUES
    (node1_id, bubble_id, 0, 1.5, 0, 1.0, 'card'),
    (node2_id, bubble_id, -3, 1.5, 2, 1.2, 'frame'),
    (node3_id, bubble_id, 3, 1.5, 2, 1.0, 'card');

  RAISE NOTICE 'Seed data created for user: %', test_user_id;
END $$;
