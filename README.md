# Trading App

This repository is a multi-agent orchestration project for delivering a trading application end to end.

It combines:

- `frontend/`: React + TypeScript client
- `backend/`: NestJS + TypeScript API
- `.github/agents/`: specialist agent definitions for coordinated product, engineering, and QA work

## What This Project Is

This is not just a basic monorepo starter. It is structured so work can be coordinated through a manager-led multi-agent workflow.

The orchestration model is centered around a `manager` agent that delegates delivery across specialist roles:

- `manager`: the single entry point that coordinates the full workflow
- `product-manager`: prepares and updates requirements
- `frontend-engineer`: implements UI and frontend behavior
- `backend-engineer`: implements API and backend logic
- `qa-engineer`: validates behavior and testing before work is considered done

In practice, this means the project is designed for requirement-first delivery, clear handoffs, parallel frontend/backend execution, and QA validation before completion.

## Repository Structure

```text
trading/
  .github/agents/
  backend/
  frontend/
```

## How Delivery Works

1. Start with the `manager` agent.
2. The manager routes the request to `product-manager` to create or refine requirements.
3. Once requirements are ready, frontend and backend work can be delegated in parallel.
4. After implementation, `qa-engineer` verifies behavior and test coverage.
5. The workflow ends only when the feature is validated and marked done.

This setup makes the repository a good fit for agent-driven execution, feature coordination, and structured software delivery.

## Getting Started

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

## Current Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: NestJS, TypeScript
- Workspace management: npm workspaces
- Delivery model: multi-agent orchestration with manager, product, frontend, backend, and QA roles

## Use Cases

This project is well suited for:

- building trading platform features in a controlled workflow
- coordinating frontend and backend implementation through specialized agents
- requirement-driven development with explicit status handoffs
- QA-gated feature delivery in an agentic development environment
