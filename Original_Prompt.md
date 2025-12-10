 I want to build a collaborative social neural network where each user has their own world. Each world functions like a 3D MySpace allowing users to decorate their space (like Animal Crossing) while also having curated collections of art/different social feeds they like that displays connections if referenced in other users’ worlds (similar to Are.na). Each person can also go live and broadcast what they’re doing/making (like Twitch). 

People discover each other through an interconnected network in the map of the base 3D world, which uses embeddings/user input to actually visualize the network someone is in different dimensions/topography. 

> wasd seems to rotate and move at same time, which is disorienting

also might consider implementing these FPS controls: https://github.com/JamesLMilner/threejs-fps-controls

https://github.com/jessehhydee/fly-by

and want bubbles to be beacons referencing the terrain like waypoints

maybe instead of bubble network, it's now called "Co-Create" 

want to alter framework to emphasize co-creation of world and space and have a co-working/curation tool 


CORE CONCEPT:
- Each user has a personal world - a 3D space they can decorate and arrange different things in
- Users can live stream themselves while visitors browse their bubble/chat with them (similar to Discord)
- The macro view shows all worlds on a network map, connected by inspiration/collaboration edges
- Seamless zoom transition between network view (macro) and interiors (micro)
- Real-time: see friends decorating, streaming, adding content live
- Starting with ~50 ITP students (invite-only pilot)

KEY FEATURES:

1. NETWORK VIEW (Macro)
   - 3D space with floating bubble spheres (each = a user)
   - Connections (edges) between related bubbles
   - Live indicators (glowing/pulsing) when someone is streaming
   - Click bubble → zoom into their world

2. BUBBLE WORLD (Micro - personal space)
   - Customizable 3D environment (colors, fog, lighting, presets)
   - Layout templates: gallery, garden, floating, spiral
   - Place nodes as 3D objects in your space
   - Live stream window (you streaming or watching others)
   - Decorations: 3D assets to personalize your space/gallery option to choose from existing or upload
   - 3D reactions: visitors leave signs/messages
   - Visitor list: see who's in your bubble

3. LIVE STREAMING (Phase 2)
   - Stream camera or screen share while working
   - Visitors can watch stream while browsing your bubble
   - Stream indicators visible in network view
   - Viewer count and list
   - Real-time text chat with reactions (use Stream Chat SDK)

4. NODE SYSTEM
   - Types: "like", "make", "making" (WIP), "inspiration", "person”, user defined
   - Content types: text, images, videos, links, code, 3D files, social media embeds
   - Display styles in bubble: card, frame, sculpture, hologram
   - Manual placement or template layouts
   - One curated hub of stuff you like, inspired by Are.na

5. REAL-TIME
   - See others streaming, adding nodes, decorating live
   - Supabase Realtime for all updates
   - Presence system (who's online, where they are)

TECH STACK:
- Next.js 14 (App Router)
- Supabase (PostgreSQL + Realtime + Auth + Storage)
- React Three Fiber + Drei for beautiful 3D visualization
- Daily.co for WebRTC streaming (Phase 2)
- Stream Chat SDK for chat functionality (Phase 2)
- OpenAI API for embeddings (Phase 3)
- Zustand for state management
- TailwindCSS + shadcn/ui
- d3-force-3d for graph layout calculations
