# Requirements: Holdings P&L Page

## Feature 1: Holdings P&L Position Actions MVP
Date: 2026-04-05
Feature Number: 1
Status: done
Owner: product-manager
QA Evidence: Unit PASS (`src/components/HoldingsPnl.test.tsx`, `src/components/Watchlist.test.tsx`); E2E N/A (no dedicated `*.e2e.test.ts` scenario for this isolated scope).

#### 1. Problem Statement
- Active traders can view holdings and lot history but cannot take quick action directly from the Holdings P&L section with a clearly defined product flow.

#### 2. Goals and Success Metrics
- Goal(s): Reduce friction from portfolio review to trade action.
- KPI(s):
  - +20% trade actions initiated from holdings context.
  - -30% median time from viewing holdings to placing a buy/sell action.

#### 3. Research Summary
- Reference products/sites reviewed: TradingView, eToro, IG (to be validated by PM run).
- Key findings:
  - Fast action placement near portfolio context improves engagement.
  - Clear position and lot-level details improve confidence before trading.
- Assumptions:
  - Users value speed and transparency more than advanced order types for MVP.

#### 4. Scope
- In scope:
  - Add reusable Buy/Sell controls under expanded holdings lots.
  - Keep quantity input constrained to positive integers.
- Out of scope:
  - Advanced order types (limit/stop), margin, short selling.

#### 5. Prioritized Requirements
- P0:
  - User can place buy/sell from expanded Holding P&L rows.
  - Quantity defaults to 1 and enforces minimum of 1.
- P1:
  - Display loading states on active trade action.
  - Keep trade controls consistent with Watchlist behavior.
- P2:
  - Add event tracking for action source = holdings.

#### 6. Acceptance Criteria (Given/When/Then)
- Given a user expands a holding, when they see Buy Lots, then Buy/Sell controls are visible beneath lots.
- Given a quantity below 1 is entered, when input updates, then quantity is corrected to 1.
- Given a trade is in progress, when user views controls, then action buttons reflect loading/disabled state.

#### 7. Frontend Handoff
- UI/UX requirements:
  - Reuse a shared BuySell component for consistency.
  - Place controls within expanded Holding lots section.
- States and validation:
  - Quantity min=1, integer input behavior.
  - Active trade state disables concurrent actions.
- Tracking/analytics:
  - Emit trade source metadata (holdings/watchlist) when analytics is introduced.

#### 8. Backend Handoff
- API/data requirements:
  - Use existing buy/sell endpoints with symbol + quantity.
- Validation/business rules:
  - Preserve existing quantity validations and balance/position checks.
- Error handling:
  - Return actionable error messages for insufficient funds/shares.

#### 9. Dependencies and Risks
- Dependencies:
  - Stable buy/sell API contract.
- Risks:
  - Confusion if concurrent trades from multiple areas are not clearly disabled.

#### 10. Open Questions
- Should quantity be shared between watchlist and holdings per symbol or managed independently?
- Should we support keyboard shortcuts for quick buy/sell in holdings?

#### 11. Rollout and Validation Plan
- Rollout steps:
  - Release behind a frontend feature toggle if needed.
  - Monitor action rates and error rates for first week.
- Post-release checks:
  - Validate no regression in watchlist trade flow.
  - Confirm analytics event parity across action sources.
