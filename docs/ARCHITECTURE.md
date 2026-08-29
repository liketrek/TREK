# World-Travel Architecture

Last reviewed: 2026-08-28

## System context

```mermaid
flowchart LR
  Browser["React SPA<br/>client/src/"] --> API["Axios API client<br/>client/src/api/client.ts"]
  API --> Nest["Nest application<br/>server/src/bootstrap.ts"]
  Browser --> WS["Realtime WebSocket /ws"]
  Nest --> Modules["Domain modules/controllers<br/>server/src/nest/"]
  Modules --> Shared["Shared Zod contracts<br/>shared/src/"]
  Modules --> SQLite[("SQLite travel.db")]
  Modules --> Storage["Local / S3-compatible storage"]
  Modules --> External["Maps, weather, photos,<br/>email, LLM integrations"]
  Nest --> MCP["MCP transport and tools"]
  MCP --> Modules
  Modules --> Plugins["Plugins and addons"]
```

Evidence: `client/src/main.tsx`, `client/src/App.tsx`, `client/src/api/client.ts`, `server/src/bootstrap.ts`, `server/src/nest/app.module.ts`, `server/src/db/database.ts`, and `shared/src/`.

## Create-trip request

```mermaid
sequenceDiagram
  participant U as React UI
  participant C as client/src/api/client.ts
  participant N as Nest HTTP server
  participant G as Auth and Zod guards
  participant T as TripsController
  participant S as TripsService
  participant D as SQLite

  U->>C: tripsApi.create(data)
  C->>N: POST /api/trips
  N->>G: Authenticate + validate DTO
  G-->>T: Validated request
  T->>T: Normalize dates and day_count
  T->>S: create(user.id, trip)
  S->>D: Insert trip and generate days
  S->>D: Read created projection
  D-->>S: Trip row
  S-->>T: Created trip
  T-->>N: 201 { trip }
  N-->>C: JSON response
  C-->>U: Update UI
```

Evidence: `client/src/api/client.ts:377-384`, `server/src/nest/trips/trips.controller.ts:77-143`, `server/src/nest/trips/trips.service.ts:351-379`, and `server/src/db/schema.ts:81-100`.

Storage, external integrations, MCP, and WebSockets are architectural boundaries but are not required for this basic create-trip path.
