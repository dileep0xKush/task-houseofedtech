# KnowledgeSync

A Notion-inspired local-first collaborative knowledge workspace built to demonstrate advanced distributed systems concepts.

## Overview

KnowledgeSync is a production-ready MVP that showcases a comprehensive approach to building collaborative applications with offline-first architecture, real-time synchronization, and deterministic conflict resolution.

### Key Features

- **Local-First Architecture**: All edits are written immediately to IndexedDB for instant responsiveness
- **Offline Support**: Full functionality when disconnected; automatic syncing when reconnected
- **Real-Time Collaboration**: Socket.IO-based real-time updates for collaborators
- **Operation-Based Sync**: Deterministic merge algorithm for conflict resolution
- **Version History**: Immutable snapshots with ability to restore previous versions
- **Rich Text Editing**: TipTap editor with headings, lists, tables, code blocks, images
- **AI Assistant**: Powered by Groq API for writing assistance
- **Role-Based Access**: Owner, Editor, Viewer roles with granular permissions
- **Authentication**: Google OAuth via Auth.js
- **Production-Ready**: Security validated, rate-limited APIs, comprehensive error handling

## Architecture

### Frontend Stack

- **Next.js 16** (App Router) - React server and client components
- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Component library
- **TipTap** - Rich text editor
- **Zustand** - State management
- **TanStack Query** - Data fetching and caching
- **Dexie** - IndexedDB wrapper
- **Socket.IO Client** - Real-time communication

### Backend Stack

- **Next.js 16 Route Handlers** - API endpoints
- **Prisma** - ORM for database operations
- **PostgreSQL** - Primary data store
- **Auth.js** - Authentication
- **Socket.IO** - Real-time server
- **Zod** - Input validation

### Infrastructure

- **Vercel** - Deployment platform
- **Neon PostgreSQL** - Managed database
- **Socket.IO** - WebSocket server

## Directory Structure

```
knowledge-sync/
├── app/
│   ├── api/                    # API route handlers
│   │   ├── auth/              # Authentication routes
│   │   ├── workspaces/        # Workspace CRUD
│   │   ├── documents/         # Document CRUD
│   │   ├── sync/              # Synchronization
│   │   └── ai/                # AI assistant
│   ├── dashboard/             # Main app interface
│   ├── auth/                  # Auth pages
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Homepage
│   └── providers.tsx          # App providers
├── components/
│   ├── ui/                    # Base UI components
│   ├── Layout/                # Layout components
│   ├── Editor/                # Editor components
│   ├── AI/                    # AI components
│   └── VersionHistory/        # Version timeline
├── features/
│   ├── offline/               # IndexedDB utilities
│   └── socket/                # Socket.IO setup
├── hooks/                     # Custom React hooks
├── lib/
│   ├── auth.ts               # Authorization utilities
│   ├── db.ts                 # Prisma client
│   ├── errors.ts             # Error classes
│   ├── sync-utils.ts         # Sync algorithm
│   ├── utils.ts              # Helper functions
│   └── validations.ts        # Zod schemas
├── store/                     # Zustand stores
├── types/                     # TypeScript types
├── prisma/
│   └── schema.prisma         # Database schema
├── tests/
│   ├── sync-engine.test.ts   # Unit tests
│   └── e2e/                  # E2E tests
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── playwright.config.ts
└── vitest.config.ts
```

## Offline-First Architecture

### How It Works

1. **Immediate Local Storage**: Every edit is written to IndexedDB before syncing
2. **Pending Operations**: Changes are stored as operations with a pending status
3. **Background Sync**: When online, operations are sent to the server
4. **Conflict Resolution**: Server merges operations deterministically
5. **Content Reconciliation**: UI updates reflect the merged state

### Data Flow

```
User Edit
    ↓
IndexedDB (immediate)
    ↓
Sync Store (pending operation added)
    ↓
Auto-Sync (every 5 seconds if online)
    ↓
Server (operations stored and merged)
    ↓
Broadcast to collaborators (Socket.IO)
    ↓
Update local state
```

## Synchronization Design

### Operation-Based Sync

Rather than syncing the entire document, KnowledgeSync sends operations:

```typescript
interface Operation {
  operationId: string;        // Unique ID
  clientId: string;           // Client that created it
  documentId: string;         // Which document
  version: number;            // Document version
  timestamp: Date;            // When created
  operationType: "insert" | "delete" | "update" | "merge";
  payload: Record<string, any>; // Operation details
}
```

### Deterministic Merge Algorithm

Operations are merged using a deterministic priority system:

1. **Version**: Higher version = newer
2. **Timestamp**: Later timestamp = newer
3. **Client ID**: Lexicographical order for tie-breaking

This ensures the same operations always produce identical results regardless of order.

### Example

```typescript
// Two clients make edits simultaneously
const clientA = {
  version: 1,
  timestamp: "2024-01-01T10:00:00Z",
  clientId: "client-a",
  operationType: "insert"
};

const clientB = {
  version: 1,
  timestamp: "2024-01-01T10:00:00Z",
  clientId: "client-b",
  operationType: "insert"
};

// Merge priority: same version → same timestamp → client-a < client-b
// Result: clientA's operation is applied first, then clientB's
```

### Tradeoffs vs. CRDT

KnowledgeSync uses a simpler operation-based sync with timestamp/version priority. For production systems requiring stronger guarantees, consider:

- **Yjs** - Efficient, production-tested CRDT library
- **Automerge** - Rich CRDT with time travel support
- **DeltaV** - Operational transformation alternative

## Version History

### How Snapshots Work

1. **Immutable Record**: Each snapshot captures the complete document state
2. **Point-in-Time Recovery**: Restore any previous version
3. **Creating New Version**: Restoring creates a new snapshot (not a reset)
4. **Metadata**: Includes timestamp, author, and optional message

```typescript
interface DocumentSnapshot {
  id: string;
  documentId: string;
  content: Record<string, any>;  // Full document content
  version: number;                // Snapshot version
  title: string;
  createdAt: Date;
  userId: string;                 // Who created it
  message?: string;               // Optional description
}
```

## Real-Time Collaboration

### Socket.IO Events

```typescript
// Client sends
socket.emit("join-document", documentId);
socket.emit("document-change", { documentId, operation, version });
socket.emit("cursor-move", { documentId, position, selection });
socket.emit("presence-update", { documentId, status });

// Client receives
socket.on("remote-change", (data) => { /* apply operation */ });
socket.on("cursor-position", (data) => { /* update cursor */ });
socket.on("presence", (data) => { /* update collaborators */ });
socket.on("user-joined", (data) => { /* show user */ });
socket.on("user-left", (data) => { /* hide user */ });
```

## Security

### Authorization Checks

Every API endpoint validates:

1. **Authentication**: User must be signed in
2. **Authorization**: User must have access to the resource
3. **Role-Based**: Operations checked against role permissions

```typescript
// Example: Only editors can sync
export function canSync(role: Role): boolean {
  return role !== "VIEWER";
}
```

### Input Validation

All requests validated with Zod schemas:

```typescript
export const createDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  workspaceId: z.string().cuid(),
  folderId: z.string().cuid().optional(),
});
```

### Protection Against Sync Attacks

- **Version Verification**: Operations must have valid document version
- **User Validation**: Operations attributed to authenticated user
- **Rate Limiting**: Sync endpoints rate-limited per user
- **Payload Size Limits**: Maximum operation payload enforced

## AI Features

Powered by Groq API with Vercel AI SDK:

- **Summarize**: Condense document or selected text
- **Improve Writing**: Enhance clarity and style
- **Grammar Fix**: Correct errors
- **Continue**: Auto-complete writing
- **Rewrite**: Change tone or phrasing
- **Explain**: Simplify complex text
- **Generate Notes**: Extract meeting notes
- **Generate Actions**: Extract action items

## Deployment

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI
GROQ_API_KEY="your-groq-api-key"

# Socket.IO
NEXT_PUBLIC_SOCKET_URL="https://yourdomain.com"
```

### Vercel Deployment

1. **Connect Repository**: Link GitHub repo to Vercel
2. **Set Environment Variables**: Configure in Vercel dashboard
3. **Database**: Create Neon PostgreSQL cluster
4. **Deploy**: Vercel automatically deploys on push

```bash
npm run build
npm start
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create/update database
npx prisma db push

# Open database browser
npx prisma studio
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Google OAuth credentials
- Groq API key

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/knowledge-sync.git
cd knowledge-sync

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local
# Edit .env.local with your credentials

# Setup database
npx prisma db push

# Start development server
npm run dev
```

Visit `http://localhost:3000` and sign in with Google.

## Testing

### Unit Tests

```bash
# Run all unit tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### E2E Tests

```bash
# Run Playwright tests
npm run test:e2e

# Headed mode (see browser)
npx playwright test --headed

# Specific test
npx playwright test tests/e2e/offline-editing.spec.ts
```

## Performance Optimizations

### Frontend

- **Code Splitting**: TipTap bundled separately
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Debouncing**: Editor updates debounced 2 seconds
- **Query Caching**: TanStack Query caches 5 minutes

### Backend

- **Database Indexing**: Key fields indexed
- **Connection Pooling**: Neon PostgreSQL
- **API Caching**: 5-minute cache on list endpoints
- **Compression**: gzip compression enabled

### IndexedDB

- **Selective Persistence**: Only active documents cached
- **Periodic Cleanup**: Old snapshots pruned
- **Indexed Queries**: Optimized database indexes
- **Batch Operations**: Bulk inserts/updates

## Monitoring

### Key Metrics

- Sync latency (pending → synced)
- Offline time detection
- Document conflict frequency
- API error rates
- IndexedDB size

### Recommended Tools

- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Datadog**: Infrastructure monitoring

## Future Improvements

1. **CRDT Migration**: Replace merge algorithm with Yjs CRDT
2. **Encryption**: End-to-end encryption for documents
3. **WebRTC**: Peer-to-peer sync as fallback
4. **Mobile Apps**: Native iOS/Android via React Native
5. **Teams**: Multi-team workspace support
6. **API Keys**: Personal API for integrations
7. **Webhooks**: Event-driven integrations
8. **Audit Logs**: Complete operation history
9. **Search**: Full-text search with Elasticsearch
10. **Analytics**: Document usage analytics

## Tradeoffs & Decisions

### Local-First Sync vs. Server-Centric

**Chosen: Local-First**
- ✅ Works offline
- ✅ Instant feedback
- ✅ Better UX
- ❌ More complex

### Operation-Based vs. CRDT

**Chosen: Operation-Based**
- ✅ Simpler implementation
- ✅ Lower bandwidth
- ✅ Faster sync
- ❌ Less guarantees than CRDT

### HTTP + Socket.IO vs. WebSocket-Only

**Chosen: HTTP + Socket.IO**
- ✅ Sync ops reliable (HTTP)
- ✅ Real-time updates (WebSocket)
- ✅ Better fallback support
- ❌ More infrastructure

### Zustand vs. Redux

**Chosen: Zustand**
- ✅ Simpler API
- ✅ Less boilerplate
- ✅ Smaller bundle
- ❌ Fewer devtools

## Contributing

This is an assessment project. Contributions are not accepted.

## License

MIT - Created for Full Stack Developer Assessment

## Support

For questions about the architecture or implementation, refer to the code comments and this README.

---

**Built with ❤️ by Dileep Kushwaha**
