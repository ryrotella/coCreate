# coCreate Enhancement Roadmap

## High Priority

### 1. Settings Page
- **Status**: Not implemented (TODO in `UserMenu.tsx:93`)
- **Description**: User preferences page for theme, notifications, privacy settings
- **Files to create/modify**:
  - `app/settings/page.tsx`
  - `components/settings/*`

### 2. User Search
- **Status**: Not implemented
- **Description**: Search functionality to find users by username or display name in network view
- **Files to modify**:
  - `components/network/D3NetworkScene.tsx`
  - `app/api/users/search/route.ts` (new)

### 3. Notifications System
- **Status**: Not implemented
- **Description**: Real-time notifications for follows, node saves, stream starts, mentions
- **Files to create**:
  - `app/api/notifications/route.ts`
  - `components/notifications/*`
  - `supabase/migrations/xxx_notifications.sql`
  - `hooks/useNotifications.ts`

### 4. Trending/Discovery Feed
- **Status**: Not implemented
- **Description**: Featured nodes, popular creators, or trending content feed
- **Files to create**:
  - `app/discover/page.tsx`
  - `app/api/discover/route.ts`
  - `components/discover/*`

---

## Medium Priority

### 5. Node Comments
- **Status**: Not implemented
- **Description**: Allow users to comment on individual nodes (separate from bubble chat)
- **Files to create**:
  - `supabase/migrations/xxx_comments.sql`
  - `app/api/nodes/[id]/comments/route.ts`
  - `components/bubble/NodeComments.tsx`

### 6. Node Search
- **Status**: Not implemented
- **Description**: Full-text search across own and saved nodes
- **Files to modify**:
  - `components/bubble/NodeLibrarySidebar.tsx`
  - `app/api/nodes/search/route.ts` (new)

### 7. Advanced Filtering
- **Status**: Not implemented
- **Description**: Filter nodes by type, creation date, creator
- **Files to modify**:
  - `components/bubble/NodeLibrarySidebar.tsx`
  - `stores/bubbleStore.ts`

### 8. Batch Operations
- **Status**: Not implemented
- **Description**: Multi-select nodes to move, delete, or organize into buckets
- **Files to modify**:
  - `components/bubble/NodesContainer.tsx`
  - `stores/uiStore.ts`
  - `components/bubble/BatchActionsToolbar.tsx` (new)

### 9. Profile Customization
- **Status**: Partial (basic profile exists)
- **Description**: Custom bios, banners, profile theme colors
- **Files to modify**:
  - `app/profile/[username]/page.tsx`
  - `supabase/migrations/xxx_profile_customization.sql`
  - `components/profile/ProfileEditor.tsx` (new)

### 10. Dark/Light Theme Toggle
- **Status**: Not implemented
- **Description**: UI theme switching with system preference detection
- **Files to create/modify**:
  - `contexts/ThemeContext.tsx`
  - `app/layout.tsx`
  - `tailwind.config.ts`

---

## Lower Priority (Polish)

### 11. Keyboard Shortcuts
- **Status**: Partial (WASD controls exist)
- **Description**: Cmd+K command palette, global shortcuts for common actions
- **Files to create**:
  - `components/ui/CommandPalette.tsx`
  - `hooks/useKeyboardShortcuts.ts`

### 12. Mobile Responsiveness
- **Status**: Desktop-focused currently
- **Description**: Better touch interactions, responsive layouts, mobile navigation
- **Files to modify**:
  - Various component files
  - `components/ui/MobileNav.tsx` (new)

### 13. Entrance/Exit Animations
- **Status**: Minimal animations
- **Description**: Smooth animations for nodes appearing, modals, transitions
- **Files to modify**:
  - `components/bubble/NodeObject.tsx`
  - `components/ui/Modal.tsx`

### 14. Accessibility (A11y)
- **Status**: Basic
- **Description**: ARIA labels, keyboard navigation, screen reader support
- **Files to modify**:
  - All interactive components

---

## Technical Improvements

### 15. Type Safety
- **Status**: Some `any` types present
- **Description**: Replace `any` types with proper TypeScript interfaces
- **Files to audit**:
  - `app/api/*/route.ts`
  - `hooks/*.ts`

### 16. Test Coverage
- **Status**: No tests
- **Description**: Add unit tests, integration tests, E2E tests
- **Files to create**:
  - `__tests__/*`
  - `jest.config.js` or `vitest.config.ts`

### 17. Error Handling
- **Status**: Basic error handling
- **Description**: Granular error messages, error boundaries, retry logic
- **Files to modify**:
  - `app/api/*/route.ts`
  - `components/ErrorBoundary.tsx` (new)

### 18. Performance Optimization
- **Status**: Not optimized for scale
- **Description**: Virtualization for large node lists, lazy loading, memoization
- **Files to modify**:
  - `components/bubble/NodesContainer.tsx`
  - `components/network/D3NetworkScene.tsx`

---

## Phase 3 Features (Future)

### 19. OpenAI Embeddings Integration
- **Status**: Planned
- **Description**: Intelligent network visualization based on semantic relationships
- **Dependencies**: OpenAI API key

### 20. AI-Powered Recommendations
- **Status**: Planned
- **Description**: Suggest node connections, similar creators, content recommendations
- **Dependencies**: Embeddings system

---

## Notes

- Priority levels are suggestions and can be adjusted based on user feedback
- Each enhancement should include proper error handling and loading states
- Consider mobile experience when implementing new features
- All new database tables need RLS policies
