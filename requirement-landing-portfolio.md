# Requirements: Landing and My Portfolio Pages

## Feature 1: Trading Landing Page and Portfolio Page Split
Date: 2026-04-05
Feature Number: 1
Status: done
Owner: product-manager
QA Evidence: Unit PASS (`src/App.test.tsx` with route CTA navigation); E2E PASS (`frontend/tests/playwright/landing-portfolio.e2e.test.ts`, 2/2 tests).

## Feature 2: Landing Markets, Watchlist, and Inline Trading
Date: 2026-04-05
Feature Number: 2
Status: done
Owner: product-manager
QA Evidence: Existing Unit PASS (`src/pages/LandingPage.test.tsx` covers favourites/watchlist, sorting, fixed-width scroll container, held-symbol tooltip protection, row expansion, and inline buy flow); E2E PASS (`frontend/tests/playwright/landing-portfolio.e2e.test.ts`, route/navigation only). Landing shared-error-banner coverage pending for this refinement.

#### 1. Problem Statement
- The previous landing requirement assumed local-only favourites persistence and no backend watchlist contract changes, but the implemented experience now depends on a shared backend watchlist model, inline market actions, and held-symbol protection.

#### 2. Goals and Success Metrics
- Goal(s):
  - Show all markets on the landing page as the primary discovery surface.
  - Let users sort, favourite, and expand markets without leaving the landing page.
  - Keep landing and portfolio watchlists aligned from a single backend source of truth.
  - Let users place inline buy/sell actions from expanded market rows.
- KPI(s):
  - +20% increase in interactions from landing market rows.
  - +15% increase in users reaching first trade action from the landing page.
  - 0 watchlist consistency mismatches between landing and portfolio views.

#### 3. Research Summary
- Reference products/sites reviewed:
  - TradingView market discovery tables.
  - eToro instrument watchlist workflows.
  - IG market list interaction patterns.
- Key findings:
  - Discovery tables perform best when sorting and quick actions are available in place.
  - Watchlist state must feel durable and consistent across views.
  - Users need a clear explanation when position-based rules block a removal action.
- Assumptions:
  - Users benefit from lightweight inline actions before moving into deeper portfolio workflows.

#### 4. Scope
- In scope:
  - Show all markets on landing.
  - Support sortable landing market headers.
  - Render All Markets inside a fixed-width table container.
  - Support horizontal scrolling when the All Markets table overflows the available width.
  - Cap the All Markets table area with a maximum height and show a vertical scrollbar when content exceeds that height.
  - Support backend-owned heart toggle watchlist behaviour.
  - Prevent removal of held symbols from the watchlist and explain why on hover.
  - Support row expansion with chevron controls.
  - Show inline Buy/Sell controls inside expanded rows.
  - Auto-add newly bought symbols to the watchlist.
  - Use the same backend-owned watchlist on the portfolio page.
- Out of scope:
  - Advanced order types beyond the existing Buy/Sell controls.
  - Separate watchlist management screens.
  - New analytics implementation beyond requirement definition.

#### 5. Prioritized Requirements
- P0:
  - Landing displays all backend markets.
  - Landing markets can be sorted from headers.
  - The All Markets table keeps a stable fixed-width layout instead of compressing columns based on viewport width.
  - When the All Markets table exceeds the available width, the table container scrolls horizontally.
  - When the All Markets table exceeds the allowed vertical space, the table area keeps its max height and scrolls vertically.
  - Landing page trade errors use the same top `error-banner` notification pattern as My Portfolio.
  - Landing error notifications must not hide the All Markets table or other primary page content.
  - Heart toggle adds/removes non-held symbols from the backend watchlist.
  - Held symbols remain on the watchlist and cannot be removed.
  - Portfolio uses the same backend-owned watchlist as landing.
- P1:
  - Market rows expand and collapse with chevrons.
  - Expanded rows include inline Buy/Sell controls.
  - Successful buy actions ensure the symbol is included in the watchlist.
- P2:
  - Add end-to-end coverage for favourites/watchlist persistence and inline trading interactions.

#### 6. Acceptance Criteria (Given/When/Then)
- Given the user opens the landing page, when market data loads, then all markets are displayed.
- Given the user selects a sortable header, when sorting is applied, then the market list updates to the requested order.
- Given the All Markets table content exceeds the available horizontal space, when the page renders, then the table remains fixed-width and a horizontal scrollbar is shown on the table container.
- Given the All Markets table content fits within the available horizontal space, when the page renders, then no horizontal scrollbar is shown.
- Given the All Markets table content exceeds the allowed vertical space, when the page renders, then the table area keeps its maximum height and a vertical scrollbar is shown.
- Given the user is on the Landing page and a market buy or sell request fails, when the error is returned, then the page shows the shared top `error-banner` with text formatted as `Error: {message}`.
- Given a Landing page market error is present, when the page renders, then the All Markets table remains visible and usable.
- Given a symbol is not on the watchlist, when the user selects the heart toggle, then the symbol is added to the backend-owned watchlist.
- Given a symbol is on the watchlist and is not held, when the user selects the heart toggle, then the symbol is removed from the backend-owned watchlist.
- Given a symbol has held shares, when the user attempts to remove it from the watchlist, then the symbol remains on the watchlist and the UI explains why removal is blocked.
- Given the user selects a row chevron, when the row expands, then inline Buy/Sell controls are shown.
- Given the user completes a buy action from an expanded row, when the trade succeeds, then the symbol is present in the watchlist.
- Given the watchlist is updated from landing, when the user views portfolio, then the same backend-owned watchlist is reflected there.
- Given the user horizontally scrolls the All Markets table, when they interact with sorting, watchlist controls, expansion, or inline trading, then those interactions remain usable.

#### 7. Frontend Handoff
- UI/UX requirements:
  - Present all markets in a sortable table on landing.
  - Keep the All Markets table on a fixed-width column layout for readability.
  - Handle narrow viewports with horizontal scrolling at the table-container level.
  - Keep the All Markets area within a defined maximum height and use vertical scrolling for overflow.
  - Preserve enough right-side inset inside the scroll area so the vertical scrollbar does not cover inline Buy/Sell controls.
  - Use the same `error-banner` visual treatment and `Error: {message}` text format as My Portfolio for landing trade failures.
  - Use heart controls for watchlist toggling.
  - Use chevron expand/collapse affordances per row.
  - Show inline Buy/Sell controls only in expanded rows to preserve scan density.
  - Keep held-symbol protection understandable through hover help.
- States and validation:
  - Preserve loading, error, and trade-status states during market fetch and inline trade actions.
  - Keep the All Markets list rendered after trade or watchlist errors whenever market data is already available.
  - Keep landing and portfolio watchlist presentation consistent after refresh and trade updates.
  - Disable watchlist removal for held symbols.
- Tracking/analytics:
  - Track `landing_market_sort`, `landing_watchlist_toggle`, and `landing_inline_trade` when analytics are added.

#### 8. Backend Handoff
- API/data requirements:
  - `GET /markets/summary` returns both `watchlist` and `allMarkets`.
  - `POST /markets/watchlist` supports watchlist heart toggle changes.
  - Existing buy/sell endpoints continue to power inline market trades.
- Validation/business rules:
  - Backend watchlist ownership is the product source of truth.
  - Held-share protection rules must be enforced consistently with returned watchlist data.
  - Successful buy actions must ensure the symbol is included in the watchlist.
- Error handling:
  - Preserve actionable errors for invalid trades and watchlist update failures.

#### 9. Dependencies and Risks
- Dependencies:
  - Stable backend support for shared watchlist ownership through `GET /markets/summary` and `POST /markets/watchlist`.
  - Consistent held-position data so watchlist protection rules are trustworthy.
- Risks:
  - Missing E2E coverage for watchlist and inline trading leaves regression risk across page boundaries.
  - Inconsistent watchlist updates would degrade trust quickly if landing and portfolio diverge.

#### 10. Open Questions
- Should watchlist toggle and inline trade flows receive dedicated E2E coverage now that the behavior is backend-owned?
- Should sell actions from landing also enforce any additional visibility rule beyond current held-symbol protection?
- Do we want a dedicated visual state for protected held symbols beyond the tooltip?

#### 11. Rollout and Validation Plan
- Rollout steps:
  - Treat the feature as complete for MVP based on current implementation and unit coverage.
  - Add follow-up end-to-end coverage for watchlist toggling, held-symbol protection, expansion, and inline trade flow.
- Post-release checks:
  - Validate landing and portfolio remain consistent after watchlist changes and buy actions.
  - Confirm no regression in inline trade success/error handling from landing rows.

## Feature 3: Shared Feedback Messages for Landing and Portfolio
Date: 2026-04-05
Feature Number: 3
Status: done
Owner: product-manager
QA Evidence: Unit PASS (`src/components/MessageBanner.test.tsx`, `src/pages/LandingPage.test.tsx`, `src/pages/PortfolioPage.test.tsx`, 8/8 total); Build PASS (`npm run build`).

#### 1. Problem Statement
- Landing and My Portfolio currently duplicate page-level feedback markup for success and error states, while Portfolio also uses a separate connection-status presentation.
- This duplication increases the risk of inconsistent behavior, copy treatment, and styling when feedback patterns change across pages.

#### 2. Goals and Success Metrics
- Goal(s):
  - Standardize page-level feedback messaging across Landing and My Portfolio.
  - Introduce one reusable feedback message component that supports error, success, info, and warning variants.
  - Preserve current user-visible trade and connection feedback while reducing UI drift and maintenance cost.
- KPI(s):
  - 100% of landing and portfolio top-level feedback messages render through the shared component.
  - 0 regressions in existing success and error banner behavior after the refactor.
  - 0 severity mismatches between intended feedback type and rendered message treatment in QA validation.

#### 3. Research Summary
- Reference products/sites reviewed:
  - TradingView platform status and trading feedback patterns.
  - eToro portfolio and order feedback treatments.
  - IG market and platform-status messaging patterns.
- Key findings:
  - Trading users trust feedback more when message placement and severity treatment stay consistent across views.
  - Informational and cautionary status messages should be visually distinct from blocking action failures.
  - Shared message primitives reduce UI drift faster than page-owned banner implementations.
- Assumptions:
  - Portfolio connection status remains a non-blocking state indicator rather than a modal interruption.

#### 4. Scope
- In scope:
  - Replace duplicated Landing and My Portfolio page-level error and success banner markup with one shared feedback message component.
  - Support `error`, `success`, `info`, and `warning` variants from the shared component API.
  - Preserve existing `error-banner` and `success-banner` styling hooks for current error and success states unless a separate design change is approved.
  - Migrate Portfolio connection-status presentation to the shared component family using `info` or `warning` treatment based on severity.
  - Keep existing page behavior and message text semantics intact unless explicitly updated in a later requirement.
- Out of scope:
  - A global toast or notification center.
  - Backend contract changes for message delivery.
  - Changes to trading, watchlist, or portfolio business rules.

#### 5. Prioritized Requirements
- P0:
  - Landing and My Portfolio must render top-level success and error feedback through one shared reusable component.
  - The shared component must support `error`, `success`, `info`, and `warning` variants with a consistent structure.
  - Existing Landing and My Portfolio error/success feedback must remain visible without hiding primary page content.
  - Portfolio connection-status feedback must use the shared component family instead of bespoke markup.
- P1:
  - Warning presentation must be used for non-blocking caution states such as degraded or reconnecting connection states.
  - The shared component API must allow consistent title/message rendering without page-specific wrapper duplication.
- P2:
  - The shared component should be reusable for future landing or portfolio notices outside the current set of states.

#### 6. Acceptance Criteria (Given/When/Then)
- Given the user is on Landing or My Portfolio and a top-level action fails, when the message is rendered, then it uses the shared feedback message component with the `error` variant.
- Given the user is on Landing or My Portfolio and a top-level action succeeds, when the message is rendered, then it uses the shared feedback message component with the `success` variant.
- Given My Portfolio shows a neutral connection update, when the status is rendered, then it uses the shared feedback message component family with the `info` variant.
- Given My Portfolio shows a non-blocking degraded or reconnecting connection state, when the status is rendered, then it uses the `warning` variant rather than the `error` variant.
- Given any shared feedback message is visible, when the page renders, then the primary page content remains visible and usable.

#### 7. Frontend Handoff
- UI/UX requirements:
  - Create one reusable feedback message component with variant-driven rendering for `error`, `success`, `info`, and `warning`.
  - Preserve the existing `error-banner` and `success-banner` visual treatment for current error and success states in MVP.
  - Apply consistent spacing, copy hierarchy, and placement wherever the shared component replaces duplicated page-level markup.
  - Use `info` and `warning` treatment for connection status without making it compete visually with blocking trade errors.
- States and validation:
  - Preserve current Landing and My Portfolio message text unless product copy is separately revised.
  - Use `error` for failed actions, `success` for completed actions, `info` for neutral status, and `warning` for cautionary non-blocking states.
  - Keep page content mounted and usable while feedback messages are shown.
- Tracking/analytics:
  - No new analytics are required for this MVP refinement.

#### 8. Backend Handoff
- API/data requirements:
  - No API changes are required for this refinement.
- Validation/business rules:
  - Existing response and connection-status data remain the source for message text and severity mapping.
- Error handling:
  - Preserve actionable trade and connection error text so the shared component can render it without loss of meaning.

#### 9. Dependencies and Risks
- Dependencies:
  - Alignment on which connection states map to `info` versus `warning`.
- Risks:
  - Visual regressions may occur if current error/success banner class behavior is not preserved.
  - Warning and info states may be applied inconsistently if severity rules are not explicit during implementation.

#### 10. Open Questions
- Should the shared feedback component remain non-dismissible for MVP, or should dismissal behavior be added now?
- Which current portfolio connection states should map to `info` versus `warning` in the first release?

#### 11. Rollout and Validation Plan
- Rollout steps:
  - Implement the shared feedback component on Landing and My Portfolio first.
  - Validate existing success/error behavior still works after the refactor before expanding reuse further.
- Post-release checks:
  - Confirm Landing and My Portfolio show consistent message structure and severity treatment.
  - Confirm connection-status feedback remains visible without obscuring portfolio content.
