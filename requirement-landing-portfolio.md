# Requirements: Landing and My Portfolio Pages

## Feature 1: Trading Landing Page and Portfolio Page Split
Date: 2026-04-05
Feature Number: 1
Status: Done
Owner: product-manager
QA Evidence: Unit PASS (`src/App.test.tsx` with route CTA navigation); E2E PASS (`frontend/tests/playwright/landing-portfolio.e2e.test.ts`, 2/2 tests).

## Feature 2: Landing Markets, Watchlist, and Inline Trading
Date: 2026-04-05
Feature Number: 2
Status: Done
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
Status: Done
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

## Feature 4: Portfolio Watchlist Heart Toggle Parity
Date: 2026-04-05
Feature Number: 4
Status: Done
Owner: product-manager

#### 1. Problem Statement
- The My Portfolio watchlist currently lacks the heart affordance already used on Landing, so users cannot manage watchlist membership consistently from the page where they monitor owned and saved symbols.

#### 2. Goals and Success Metrics
- Goal(s):
  - Add the same heart toggle affordance to each My Portfolio watchlist row.
  - Keep Landing and My Portfolio watchlist actions aligned to one backend-owned rule set.
  - Preserve held-share protection so users cannot remove symbols that must remain watchlisted because they still hold shares.
- KPI(s):
  - 100% parity between Landing and My Portfolio for watchlist add/remove behavior.
  - 0 watchlist state mismatches after toggling from either page.
  - 0 successful removals of symbols that still have held shares.

#### 3. Research Summary
- Reference products/sites reviewed:
  - Robinhood watchlist/list management help flow.
  - Common broker workflow pattern of letting users save or remove instruments from both discovery and monitoring surfaces.
- Key findings:
  - Watchlist controls are most usable when the save/remove affordance is available anywhere the instrument is listed, not only on discovery screens.
  - Watchlist state must remain consistent across views because users treat it as a durable personal list rather than page-local UI state.
  - Position-based removal restrictions need a clear disabled or explanatory state to avoid looking broken.
- Assumptions:
  - The existing backend watchlist toggle contract and held-share protection remain the source of truth and do not need new API behavior for this refinement.

#### 4. Scope
- In scope:
  - Add a heart button to each My Portfolio watchlist row.
  - Use the existing backend-owned watchlist toggle behavior from Landing.
  - Reflect add/remove results in both Landing and My Portfolio without divergence.
  - Apply the same held-share protection rule and user explanation on My Portfolio when removal is blocked.
  - Keep existing expand and Buy/Sell controls usable alongside the new heart action.
- Out of scope:
  - New watchlist endpoints or backend rule changes.
  - Watchlist reordering, grouping, or multi-list support.
  - Any redesign of Landing watchlist behavior beyond parity fixes required by this addition.

#### 5. Prioritized Requirements
- P0:
  - Every My Portfolio watchlist row must include a heart button.
  - The heart button must call the existing backend-owned watchlist toggle flow.
  - A symbol removed from My Portfolio must also be absent on Landing after data refresh or shared state update.
  - A symbol added or preserved by backend rules must render as watchlisted on both pages.
  - Symbols with held shares must not be removable from My Portfolio watchlist.
- P1:
  - My Portfolio must show the same explanatory protected state used on Landing when a held symbol cannot be removed.
  - The heart control placement must not conflict with row expansion or Buy/Sell actions.
- P2:
  - Add regression coverage for watchlist toggling from My Portfolio, including the protected held-symbol path.

#### 6. Acceptance Criteria (Given/When/Then)
- Given the user views My Portfolio watchlist rows, when the list renders, then each row shows a heart button representing current watchlist state.
- Given a symbol in My Portfolio is watchlisted and not held, when the user selects the heart button, then the symbol is removed through the existing backend watchlist toggle flow.
- Given a symbol in My Portfolio is not watchlisted, when the user selects the heart button, then the symbol is added through the existing backend watchlist toggle flow.
- Given a symbol in My Portfolio has held shares, when the user attempts to remove it with the heart button, then the symbol remains watchlisted and the UI explains why removal is blocked.
- Given the user changes watchlist state from My Portfolio, when the user navigates to Landing or the shared data refreshes, then the same watchlist state is shown there.
- Given the user expands a My Portfolio watchlist row or opens Buy/Sell controls, when the row actions render, then the heart button remains visible and usable without overlapping those controls.

#### 7. Frontend Handoff
- UI/UX requirements:
  - Add a heart button to the My Portfolio watchlist row action set using the same visual selected and unselected states as Landing.
  - Place the heart control so it remains easy to scan and tap without displacing expand or Buy/Sell controls.
  - Reuse the same protected held-symbol explanation pattern already established on Landing.
- States and validation:
  - Keep heart state synchronized with backend watchlist data after toggle, refresh, and trade updates.
  - Disable or block removal interaction for held symbols in the same way as Landing while still explaining the reason.
  - Preserve existing row expansion and trade interaction behavior after adding the heart control.
- Tracking/analytics:
  - Track `portfolio_watchlist_toggle` when analytics are available.

#### 8. Backend Handoff
- API/data requirements:
  - No new endpoints are required.
  - My Portfolio uses the existing backend watchlist toggle and watchlist state returned by current market summary data.
- Validation/business rules:
  - Existing held-share protection remains authoritative for both Landing and My Portfolio.
  - Backend watchlist ownership remains the single source of truth across pages.
- Error handling:
  - Preserve current watchlist toggle failure responses so My Portfolio can show actionable feedback consistent with Landing.

#### 9. Dependencies and Risks
- Dependencies:
  - Existing backend watchlist toggle behavior remains reusable from My Portfolio.
  - Frontend shared state or refresh logic must keep Landing and My Portfolio visually synchronized.
- Risks:
  - Adding another row action can create crowding or mis-taps if spacing is not adjusted carefully.
  - If page-level state sync is incomplete, users may see different watchlist states between Landing and My Portfolio.

#### 10. Open Questions
- Should My Portfolio use exactly the same tooltip or helper copy as Landing for protected held symbols, or can copy be shortened for denser row layouts?

#### 11. Rollout and Validation Plan
- Rollout steps:
  - Implement the My Portfolio heart control using the existing watchlist toggle integration.
  - Validate parity across Landing and My Portfolio before moving the status out of Ready.
- Post-release checks:
  - Confirm toggling from My Portfolio updates Landing watchlist state correctly.
  - Confirm held symbols remain protected from removal on both pages.

## Feature 5: Portfolio Connection Status Dot Indicator
Date: 2026-04-05
Feature Number: 5
Status: In Review
Owner: product-manager

#### 1. Problem Statement
- My Portfolio currently communicates market connection state with text-first messaging such as `Live prices connected`, which adds noise in a high-density trading view.
- Users requested a compact visual indicator: a green or red status dot instead of the current text-style connection message.

#### 2. Goals and Success Metrics
- Goal(s):
  - Replace text-first connection status messaging with a compact dot indicator on My Portfolio.
  - Preserve clear state signaling for connected and disconnected conditions without reducing page scanability.
- KPI(s):
  - 100% of default portfolio connection-state renders use dot-only status treatment.
  - 0 regressions in connection-state detection and state transitions in QA validation.

#### 3. Research Summary
- Reference products/sites reviewed:
  - TradingView compact status indicators in dense market layouts.
  - eToro portfolio status affordances for non-blocking system state.
- Key findings:
  - Traders prefer low-friction status signaling in portfolio monitoring contexts.
  - Color-coded status dots reduce visual weight while preserving rapid state recognition.
- Assumptions:
  - Green maps to connected/live and red maps to disconnected/unavailable for MVP.

#### 4. Scope
- In scope:
  - Replace the existing portfolio connection text banner/state copy with a color status dot.
  - Use green dot for connected/live and red dot for disconnected/unavailable.
  - Keep status rendering non-blocking and visible near existing portfolio header/status area.
- Out of scope:
  - New backend connection APIs or websocket protocol changes.
  - Additional status colors (amber/gray) in MVP.
  - Expanded uptime diagnostics or system-health detail panels.

#### 5. Prioritized Requirements
- P0:
  - My Portfolio connection state must render as a dot indicator instead of the `Live prices connected` text-style message.
  - Connected/live state must render a green dot.
  - Disconnected/unavailable state must render a red dot.
- P1:
  - Dot indicator must be accessible with a semantic label describing current state (for example, `Connection status: connected` or `Connection status: disconnected`).
  - Dot placement must not displace key portfolio content or controls.
- P2:
  - Add explicit visual regression and interaction coverage for status-dot rendering across connection transitions.

#### 6. Acceptance Criteria (Given/When/Then)
- Given My Portfolio receives a connected/live status, when the page renders, then a green status dot is shown and the previous `Live prices connected` text-style status message is not shown.
- Given My Portfolio receives a disconnected/unavailable status, when the page renders, then a red status dot is shown.
- Given connection state changes while My Portfolio is open, when status updates are received, then the dot color updates to match the latest state without blocking portfolio interactions.
- Given assistive technology reads the status element, when focus or announcement occurs, then the current connection state is conveyed through an accessible label.

#### 7. Frontend Handoff
- UI/UX requirements:
  - Replace current connection status copy block with a compact circular indicator.
  - Use green for connected/live and red for disconnected/unavailable.
  - Preserve visual hierarchy so connection status remains secondary to holdings, P&L, and trading actions.
- States and validation:
  - Ensure the dot updates correctly on initial load and on subsequent connection-state transitions.
  - Remove or suppress `Live prices connected` text-style rendering for this status pattern in portfolio.
  - Ensure color contrast and accessible name/description meet baseline accessibility expectations.

#### 8. Backend Handoff
- API/data requirements:
  - No API contract changes required.
  - Continue emitting/returning existing connection-state signal used by My Portfolio.
- Validation/business rules:
  - Backend remains source of truth for connection status values consumed by frontend mapping.
  - Connection-state payload values must remain stable for deterministic green/red mapping.
- Error handling:
  - If connection state is temporarily unknown, preserve existing fallback behavior until a mapped state is available.

#### 9. Dependencies and Risks
- Dependencies:
  - Stable connection-state signal from existing portfolio data flow.
- Risks:
  - Color-only signaling can reduce clarity if accessibility labeling is omitted.
  - Inconsistent state naming could cause incorrect green/red mapping.

#### 10. Open Questions
- Should we add a neutral fallback dot color for unknown/reconnecting in a follow-up phase?

#### 11. Rollout and Validation Plan
- Rollout steps:
  - MVP: Ship green/red dot replacement for connected/disconnected states on My Portfolio.
  - Follow-up: Evaluate neutral/reconnecting state visual if telemetry or support feedback indicates ambiguity.
- Post-release checks:
  - Verify no residual `Live prices connected` text-style status message appears in portfolio.
  - Validate dot state transitions during simulated connect/disconnect flows.

## Feature 6: Portfolio Header Back Icon
Date: 2026-04-05
Feature Number: 6
Status: Done
Owner: product-manager

#### 1. Problem Statement
- My Portfolio currently uses a text link (`Back to Landing`) in the top navigation area.
- Users requested a compact back icon treatment to reduce header text weight and align with common trading-app navigation patterns.
- Change request: the back icon must sit visually to the left of the `My Portfolio` heading in the top header area so navigation intent is immediately clear.

#### 2. Goals and Success Metrics
- Goal(s):
  - Replace the My Portfolio top navigation text link with a back icon control.
  - Position the back icon immediately left of the `My Portfolio` heading text in the top header area.
  - Preserve clear and predictable navigation back to Landing.
  - Keep the header compact without reducing accessibility.
- KPI(s):
  - 100% of My Portfolio header back navigation renders as icon-based control in MVP.
  - 0 regressions in navigation success from My Portfolio to Landing.
  - 0 accessibility failures for the back navigation control name/role in QA validation.

#### 3. Research Summary
- Reference products/sites reviewed:
  - TradingView and broker mobile/desktop patterns for compact top-bar back navigation.
- Key findings:
  - Icon-first back controls reduce visual noise in dense portfolio headers.
  - Back icons remain discoverable when paired with an explicit accessible label and clear placement at top-left.
- Assumptions:
  - A single back icon button in the top-left header area is sufficient for user comprehension in MVP.

#### 4. Scope
- In scope:
  - Replace `Back to Landing` text link in My Portfolio top navigation with a back icon control.
  - Place the back icon visually left of the `My Portfolio` heading text in the top header area.
  - Keep navigation destination and behavior unchanged (returns to Landing).
  - Provide accessible name/label for screen readers.
  - Preserve existing keyboard and pointer interaction behavior.
- Out of scope:
  - Route changes or navigation logic redesign.
  - Broader header redesign beyond this control swap.
  - New multi-step history behavior.

#### 5. Prioritized Requirements
- P0:
  - My Portfolio header must show a back icon instead of `Back to Landing` text.
  - The back icon must be visually positioned to the left of the `My Portfolio` heading text in the top header area.
  - Selecting the back icon must navigate the user to Landing.
  - The control must expose an accessible name (example: `Back to Landing`).
- P1:
  - Back icon hit area must remain usable on desktop and mobile viewport widths.
  - Icon visual state must remain clear for default, hover/focus, and active states.
- P2:
  - Add regression coverage for icon rendering and click/keyboard navigation.

#### 6. Acceptance Criteria (Given/When/Then)
- Given the user is on My Portfolio, when the header renders, then a back icon control is shown and `Back to Landing` text link is not shown.
- Given the user is on My Portfolio, when the header renders, then the back icon appears visually left of the `My Portfolio` heading text in the top header area.
- Given the user selects the back icon, when the action is triggered, then the app navigates to Landing.
- Given the user tabs to the back icon, when focus lands on the control, then it is keyboard-focusable and visually focus-indicated.
- Given assistive technology reads the control, when the back icon is announced, then it has a meaningful accessible label indicating navigation to Landing.
- Given the app is displayed on mobile-width and desktop-width viewports, when the header renders, then the back icon remains visible and tappable/clickable without overlapping primary header content.

#### 7. Frontend Handoff
- UI/UX requirements:
  - Replace text link content with a back icon in the existing My Portfolio top navigation position.
  - Keep the icon in the top header area and visually place it directly left of the `My Portfolio` heading text.
  - Preserve current visual hierarchy so holdings, P&L, and trade actions remain primary.
- States and validation:
  - Maintain consistent behavior for click and keyboard activation.
  - Ensure visible focus style and accessible label are present.
  - Validate responsive spacing so icon does not collide with adjacent header elements.
- Tracking/analytics:
  - No new analytics required for MVP.

#### 8. Backend Handoff
- API/data requirements:
  - No API or data contract changes are required.
- Validation/business rules:
  - Existing route destination for Landing remains unchanged.
- Error handling:
  - No backend error handling changes are required for this UI-only refinement.

#### 9. Dependencies and Risks
- Dependencies:
  - Existing frontend routing/navigation mechanism used by current `Back to Landing` link.
- Risks:
  - Icon-only controls can reduce discoverability if placement or accessible label is incorrect.
  - Too-small touch target could hurt usability on smaller screens.

#### 10. Open Questions
- Should MVP use a tooltip/title on hover for pointer users, or rely only on accessible label plus placement?

#### 11. Rollout and Validation Plan
- MVP:
  - Ship the back icon replacement with unchanged Landing navigation behavior.
- Follow-up:
  - Evaluate adding optional tooltip if usability feedback suggests discoverability issues.
- Non-goals:
  - No route architecture changes, no global header redesign.
- Post-release checks:
  - Verify no residual `Back to Landing` text link appears in My Portfolio header.
  - Verify icon navigation works via mouse/touch and keyboard.

## Feature 7: Landing All Markets Connection Status Indicator
Date: 2026-04-05
Feature Number: 7
Status: Done
Owner: product-manager

#### 1. Problem Statement
- Landing currently lacks a visible market-connection status cue near the primary `All Markets` heading.
- Users can see connection status in My Portfolio, but not in Landing where they first scan market data.
- This inconsistency reduces confidence that market prices are actively connected on the discovery page.

#### 2. Goals and Success Metrics
- Goal(s):
  - Add a connection-status indicator on Landing next to the `All Markets` heading.
  - Reuse the existing portfolio connection-status indicator pattern for consistent cross-page behavior.
  - Keep status non-blocking and lightweight so market discovery remains primary.
- KPI(s):
  - 100% of Landing renders show a connection-status indicator adjacent to `All Markets`.
  - 0 severity/visual mapping mismatches between Landing and My Portfolio connection states in QA.

#### 3. Research Summary
- Reference products/sites reviewed:
  - TradingView market overview status treatments near key list headers.
  - eToro and IG compact connection/system-state cues in discovery views.
- Key findings:
  - Traders expect connection visibility where real-time market lists are consumed, not only on portfolio screens.
  - Reusing one status pattern across pages improves trust and lowers interpretation friction.
- Assumptions:
  - Existing portfolio connection-state mapping is accepted and can be reused on Landing without backend changes.

#### 4. Scope
- In scope:
  - Show a connection-status indicator beside the `All Markets` heading on Landing.
  - Reuse the same indicator style, state mapping, and semantics used by the portfolio connection-status pattern.
  - Keep Landing table interactions (sorting, watchlist toggles, expansion, buy/sell) fully usable while the indicator is visible.
- Out of scope:
  - New connection-state backend contracts.
  - New status taxonomy beyond existing mapped states.
  - Global notification/toast changes.

#### 5. Prioritized Requirements
- P0:
  - Landing must render a connection-status indicator next to the `All Markets` heading.
  - Landing indicator state and visual treatment must match the existing portfolio connection-status pattern.
  - Connection status display on Landing must be non-blocking and must not hide or replace the All Markets table.
- P1:
  - Indicator must expose accessible status text/label equivalent to portfolio behavior.
  - Placement must remain clear on desktop and mobile widths without overlapping heading text or controls.
- P2:
  - Add/extend automated tests for landing connection-indicator rendering and state updates.

#### 6. Acceptance Criteria (Given/When/Then)
- Given the user opens Landing, when the page renders the `All Markets` heading, then a connection-status indicator appears adjacent to that heading.
- Given Landing receives a connected status, when the indicator renders, then it matches the connected-state visual and semantic treatment used on My Portfolio.
- Given Landing receives a disconnected or degraded status, when the indicator renders, then it matches the corresponding non-connected treatment used on My Portfolio.
- Given connection status changes while Landing is open, when new status is received, then the indicator updates without blocking interaction with the markets table.
- Given assistive technology reads the Landing header status element, when announced, then connection state is conveyed via accessible label/text consistent with portfolio behavior.

#### 7. Frontend Handoff
- UI/UX requirements:
  - Place the connection-status indicator inline with, or immediately adjacent to, the `All Markets` heading.
  - Reuse the existing portfolio indicator component/pattern and severity mapping to avoid visual drift.
  - Keep hierarchy clear: `All Markets` and table content remain primary; status remains secondary.
- States and validation:
  - Ensure initial render and live updates reflect current connection state.
  - Preserve full usability of sorting, watchlist, expansion, and inline trade controls while status is shown.
  - Ensure responsive layout keeps heading and indicator readable without overlap at smaller widths.
- Tracking/analytics:
  - No new analytics required for MVP.

#### 8. Backend Handoff
- API/data requirements:
  - No API changes required.
  - Landing should consume the existing connection-state signal already used by My Portfolio.
- Validation/business rules:
  - Connection-state mapping values must remain stable so Landing and My Portfolio stay aligned.
  - Portfolio mapping remains the reference behavior for Landing parity.
- Error handling:
  - If connection state is temporarily unavailable, preserve existing fallback behavior from the portfolio pattern.

#### 9. Dependencies and Risks
- Dependencies:
  - Availability of shared connection-status state in Landing data flow.
  - Reusable portfolio indicator pattern/component.
- Risks:
  - Divergence can reappear if Landing implements custom styling instead of reusing the shared pattern.
  - Header crowding risk on narrow screens if spacing rules are not applied.

#### 10. Open Questions
- Should Landing display exactly the same status copy/tooltip behavior as My Portfolio, or only parity at visual and semantic level for MVP?

#### 11. Rollout and Validation Plan
- MVP:
  - Ship Landing indicator beside `All Markets` with full parity to current portfolio connection-status behavior.
- Follow-up:
  - Expand test coverage if live status transitions prove flaky in integrated environments.
- Non-goals:
  - No backend protocol changes and no redesign of global status messaging.
- Post-release checks:
  - Verify Landing and My Portfolio show matching status treatment for identical states.
  - Verify All Markets interactions remain unaffected while status indicator updates.
