# Trading App

Monorepo starter for a trading application with:

- `backend/`: NestJS + TypeScript API
- `frontend/`: React + TypeScript app

## Structure

```text
trading/
  backend/
  frontend/
```

## Getting started

1. Install dependencies from the repo root:

   ```bash
   npm install
   ```

2. Start the backend:

   ```bash
   npm run dev:backend
   ```

3. In another terminal, start the frontend:

   ```bash
   npm run dev:frontend
   ```

Frontend runs on `http://localhost:5173` and calls the backend on `http://localhost:3000`.

## Next features you can build

- Authentication
- Live market prices via websocket
- Portfolio positions
- Order placement
- Trade history

