# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Qui est le plus" is a multiplayer social party game built with React (client) and Node.js/Socket.IO (server). Players join rooms via codes, answer questions about each other by voting, and see who gets the most votes for each trait.

## Monorepo Structure

This is a monorepo with three main directories:
- `client/` - React + TypeScript + Vite frontend
- `server/` - Express + Socket.IO backend
- `shared/` - Shared TypeScript types between client and server

**Important**: Always work from the repository root. Build commands must be run from within each package directory.

## Build Commands

### Client (from `/client` directory)
```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # TypeScript compile + Vite production build
npm run lint     # ESLint check
npm run preview  # Preview production build
```

### Server (from `/server` directory)
```bash
npm run dev      # Start dev server with tsx watch (port 3000)
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled server from dist/
```

### Building Both
When modifying types or shared code, rebuild both:
```bash
cd client && npm run build
cd ../server && npm run build
```

## Architecture

### Real-Time Communication (Socket.IO)

All game state synchronization happens through Socket.IO events defined in `shared/types.ts`. The server is the single source of truth for all game state.

**Key Socket Events:**
- `room:*` - Room management (create, join, update, leave, kick, transferHost)
- `game:*` - Game flow (start, vote, nextQuestion, results, finished, timer)
- `custom:*` - Custom questions mode

**Critical Pattern**: The server stores all room state in `RoomManager` and broadcasts updates via `io.to(room.code).emit('room:updated', room)`. Clients receive updates and re-render automatically through the `SocketContext`.

### State Management

**Server-side** (`server/src/roomManager.ts`):
- `RoomManager` class manages all rooms in memory (Map-based storage)
- No database - everything is in-memory and ephemeral
- Tracks: rooms, player-to-room mappings, question timers, vote counts

**Client-side** (`client/src/context/SocketContext.tsx`):
- React Context provides global access to socket connection and game state
- State: `room`, `currentQuestion`, `currentResult`, `allResults`, `timeRemaining`
- All pages use `useSocket()` hook to access game state

### Game Flow

1. **Lobby** → Host creates room, players join via code, host configures settings
2. **Playing** → Display question, 15-second timer, players vote
3. **VoteReveal** → 3-second countdown, animated reveal of votes one by one
4. **Results** → Show ranking for current question
5. **FinalRecap** (when finished) → Summary of all questions with winners

**Navigation is triggered by room.status changes:**
- `lobby` → `/lobby`
- `custom-questions` → `/custom-questions`
- `playing` → `/game`
- `results` → `/results`
- `finished` → `/final-recap` (via manual button click)

### Timer System

Each question has a 15-second countdown timer:
- Managed server-side in `RoomManager.startTimer()`
- Broadcasts `game:timerUpdate` every second
- Auto-calculates results on `game:timeExpired`
- Timer stops when everyone votes or time expires

### Critical Implementation Details

**Question Index Management**: When advancing to the next question, the server checks if `currentQuestionIndex + 1 >= allQuestions.length` BEFORE incrementing. This prevents showing "6/5" at the end.

**Vote Collection**:
- Votes stored as `room.votes: Record<playerId, votedForPlayerId>`
- Server checks `hasEveryoneVoted()` after each vote
- Auto-triggers results calculation when all votes are in

**No-Vote Handling**: If no one votes on a question:
- VoteReveal shows "Personne n'a voté" message
- Still navigates to Results after timeout
- Results shows "Aucun vote" indicator

**Host Transfer**: The host role can be transferred to any other player in the lobby. This updates `room.hostId` and the `isHost` flag on both players.

## Shared Types

The `shared/types.ts` file is the contract between client and server. When modifying:
1. Update `shared/types.ts`
2. Rebuild server (it imports directly from `../../shared/types.js`)
3. Rebuild client (it has a symlinked copy at `client/src/types.ts`)

## Styling

Uses custom "neo-brutalism" design system with Tailwind CSS:
- Components use classes like `neo-card`, `neo-button`, `neo-avatar`
- Organic shapes and animations defined in `client/src/index.css`
- Primary colors: accent (brownish), secondary, neutral tones

## Common Patterns

**Adding a new socket event:**
1. Add to `ClientToServerEvents` or `ServerToClientEvents` in `shared/types.ts`
2. Add handler in `server/src/index.ts` (for client→server events)
3. Add listener in `client/src/context/SocketContext.tsx` (for server→client events)
4. Expose function in SocketContext if needed
5. Use in components via `useSocket()` hook

**Adding a new page:**
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation logic based on `room.status` in appropriate pages

**Modifying room state:**
1. Only server can modify room state (via RoomManager methods)
2. Client sends request via socket event
3. Server validates, updates state, broadcasts via `room:updated`
4. All clients receive update and re-render

## Development Workflow

1. Start server: `cd server && npm run dev`
2. Start client: `cd client && npm run dev`
3. Open http://localhost:5173
4. For production: Build both, server serves client static files from `client/dist`

## Important Notes

- Socket IDs are used as player IDs throughout the application
- Rooms are deleted when empty (last player leaves)
- No persistence - server restart clears all rooms
- Avatar support: base64 or URLs stored in player objects
- Question categories: soft, classique, humour-noir, hard, politiquement-incorrect, custom
