# Requirements: Expo Mobile App Parity

Date: 2026-04-10
Status: Ready
Owner: product-manager

#### 1. Research Findings and Product Assumptions
- Reference products/sites reviewed:
  - Robinhood public product site: emphasizes intuitive trading tools, portfolio monitoring, on-the-go account access, and visible security posture.
  - Fidelity mobile overview: emphasizes mobile access to trading, portfolio management, and secure account access on iOS and Android.
  - Existing repository requirement files: current web product scope includes login-protected access, all-markets discovery, backend-owned watchlist behavior, inline buy/sell actions, shared portfolio/watchlist state, holdings P&L trade actions, and live market pricing.
- Key findings:
  - Trading mobile apps succeed when they preserve the same core jobs-to-be-done as web: monitor markets, manage watchlist, review portfolio, and place simple orders quickly.
  - Mobile parity does not require literal component reuse; it requires behavioral parity on the same backend contracts with mobile-native navigation and touch interactions.
  - Security and trust cues are more prominent on mobile because users expect persistent login but low tolerance for ambiguous auth state or stale account data.
  - Portfolio, watchlist, and trade actions must remain synchronized through one backend source of truth; mobile-local state must never become the authority for account data.
  - Compliance-sensitive surfaces on mobile should avoid implying guaranteed execution, guaranteed real-time pricing, or hiding risk/error states behind animations or transient toasts only.
- Product assumptions:
  - The current web app is the source of truth for MVP feature parity.
  - Mobile delivery should create a new root `mobile/` application using Expo and React Native, not a webview wrapper.
  - The mobile app should reuse existing backend APIs wherever practical and should not fork product rules for watchlist, portfolio, holdings, or trading behavior.
  - If the current auth/session model is browser-specific, backend work may be required to support an equivalent mobile-safe session flow.
  - MVP focuses on parity with current user-facing functionality, not new mobile-only features.

#### 2. Problem Statement
- The repository currently provides a web frontend and backend, but no mobile application surface.
- Users who want to monitor markets, manage watchlist symbols, review portfolio performance, and place simple trades on mobile devices cannot do so in a native app workflow.
- A direct code port from React/Vite web to React Native is not realistic; the product requirement must define parity at the behavior and journey level so the mobile team can implement a correct Expo app without drifting from the current trading experience.
- Without a clear mobile requirement, implementation risk is high around auth persistence, route parity, backend compatibility, and differences between desktop table patterns and mobile list/detail interaction patterns.

#### 3. Goals and Success Metrics
- Goals:
  - Deliver an Expo-based React Native mobile app in a new root `mobile/` folder that mirrors the current web app's core user-facing functionality as closely as practical.
  - Preserve one coherent trading experience across web and mobile for login, market discovery, watchlist management, portfolio review, holdings actions, and basic buy/sell flows.
  - Reuse existing backend contracts wherever possible so web and mobile stay behaviorally aligned.
  - Ensure the mobile experience is trustworthy, explicit about auth/session state, and safe in how market/trade/account information is presented.
- Success metrics:
  - 100% of current MVP web user journeys have an equivalent mobile journey or an explicitly approved mobile adaptation.
  - 0 Sev-1 functional gaps between released web MVP scope and mobile MVP scope for login, market discovery, watchlist management, portfolio review, and buy/sell actions.
  - 95%+ success rate in QA completion of core mobile happy paths on both iOS and Android simulators/devices.
  - 0 known cases where mobile shows authenticated account state after the backend considers the session invalid.
  - 0 data-consistency mismatches between mobile and web for portfolio holdings, watchlist state, and market summary data when refreshed from the backend.

#### 4. Scope and Non-Goals
- In scope:
  - Create a new Expo React Native app in a repository-root `mobile/` folder.
  - Reproduce the current web app's core user-facing flows in mobile-native navigation and layouts.
  - Support login, logged-out state, protected-route behavior, and authenticated session persistence appropriate for mobile.
  - Support markets discovery, watchlist management, portfolio viewing, holdings P&L visibility, and simple buy/sell actions that match current web business behavior.
  - Support shared backend data contracts for markets, watchlist, holdings, portfolio summary, and trade mutations.
  - Support mobile QA coverage for the primary flows on iOS and Android.
- Non-goals:
  - Pixel-perfect UI duplication of the existing web app.
  - Reusing web DOM/table components directly in React Native.
  - New advanced order types, margin, options, crypto, banking, social, or mobile-only alert systems unless already part of current web MVP.
  - Offline trading, background trade execution, widget support, or push-notification infrastructure.
  - A full design-system rewrite for web and mobile.

#### 5. Prioritized Requirements (P0/P1/P2)
- P0:
  - The repository must include a new root `mobile/` app implemented with Expo and React Native.
  - Launching the mobile app through Expo from the repository workspace must resolve the `mobile/` app entrypoint correctly so the app boots without manual path overrides or workspace-specific launch workarounds.
  - Mobile must provide the same top-level product journeys as the current web MVP: login, landing/market discovery, watchlist interactions, portfolio review, holdings visibility, and simple buy/sell actions.
  - Mobile must use the same backend-owned source of truth for authentication, watchlist state, portfolio state, holdings, and market data.
  - Mobile auth state must be server-authoritative: the app must not present the user as logged in if the backend session is missing, expired, or invalid.
  - Any currently protected web route/flow must remain protected on mobile, with clear redirect or re-auth behavior.
  - Mobile must adapt large web table interactions into mobile-appropriate list, row expansion, or detail-sheet patterns without removing user capability.
  - All existing business validations for buy/sell and watchlist mutation must remain enforced through the same backend APIs or equivalent approved backend contract.
  - The app must support both iOS and Android through Expo-managed delivery for MVP.
  - Error states for trading, watchlist updates, session expiry, and market loading must be visible, actionable, and not silently swallowed.
  - Market prices, watchlist state, portfolio state, and holdings data must refresh from the backend and remain consistent with web after account changes.
  - Any 5-second or similarly frequent in-app auto-refresh used for market, watchlist, portfolio, or holdings screens must update in place without visible flicker, full-screen loading replacement, scroll-position jump, or temporary removal of already loaded content when the user remains on the same screen.
- P1:
  - Mobile should preserve intended destination after authentication when a logged-out user requests a protected screen.
  - Mobile should persist session state across app restarts when the backend session is still valid.
  - Mobile should present loading, empty, and degraded-network states explicitly for major account screens.
  - Shared product copy, error semantics, and action naming should stay aligned with web unless mobile constraints require a deliberate exception.
  - Common cross-platform UI primitives should be organized so future parity work is maintainable.
- P2:
  - Add mobile-specific analytics hooks for entry point, watchlist mutation, trade initiation, trade completion/failure, and auth failure reasons.
  - Evaluate optional device-biometric unlock for reopening an already-authenticated session after MVP, without replacing backend authentication.

#### 6. Acceptance Criteria (Given/When/Then)
- Given the repository is cloned, when engineers inspect the product structure, then a new Expo React Native app exists in the root `mobile/` folder.
- Given an engineer launches the Expo mobile app from the repository workspace, when the app starts, then Expo resolves the `mobile/` app entrypoint correctly and renders the mobile app shell instead of failing on workspace entrypoint resolution.
- Given a logged-out user opens the mobile app, when the app loads, then the user sees the logged-out experience and cannot access protected account actions without authentication.
- Given a user authenticates successfully on mobile, when login completes, then they can access the same protected account functionality currently available on web MVP.
- Given a user has an active valid backend session, when they relaunch the mobile app, then authenticated account screens remain available without requiring unnecessary re-login.
- Given a user has stale or invalid local mobile auth state, when the app validates session state with the backend, then the app clears the stale state and shows the logged-out experience.
- Given the user views market discovery on mobile, when market data loads, then they can browse the same current product market set and perform the same watchlist and trade entry actions that web currently supports.
- Given the user updates watchlist membership on mobile, when the mutation succeeds, then the change is reflected in both mobile and subsequent web sessions from the shared backend source of truth.
- Given the user views portfolio or holdings on mobile, when account data loads, then they can review the same current portfolio and holdings information that web exposes for MVP.
- Given the user remains on a mobile market, watchlist, portfolio, or holdings screen while periodic auto-refresh runs, when the scheduled refresh succeeds, then visible content updates in place without a full-screen flicker, loading-state flash, scroll reset, or temporary disappearance of previously loaded data.
- Given the user initiates a buy or sell action from a supported mobile surface, when the request is valid and authorized, then the backend processes it using the same business rules as web.
- Given the backend rejects a trade or watchlist mutation, when the mobile app receives the error, then the user sees a clear error message and the app does not present a false success state.
- Given a protected mobile action returns unauthorized because the session expired, when the response is handled, then the app clears authenticated state, prompts re-login, and preserves the intended destination when feasible.
- Given QA runs the primary regression suite for mobile, when tests complete on iOS and Android, then login, market discovery, watchlist changes, portfolio review, holdings view, and buy/sell actions all pass.

#### 7. Frontend Handoff
- No mandatory web frontend feature changes are required to ship the mobile MVP if the existing backend contracts already cover the needed functionality.
- Frontend-engineer ownership is limited to coordination work where parity decisions affect shared product language, shared API typings/contracts, or design consistency between web and mobile.
- UI behavior requirements:
  - Confirm which current web journeys are treated as parity-critical for MVP and flag any web behavior that is not portable to mobile without redesign.
  - Provide reference behavior for login, protected-route handling, markets discovery, watchlist interaction, portfolio review, holdings expansion, and trade entry so the mobile app mirrors the current product rather than inventing new behavior.
  - Align message hierarchy, success/error copy tone, and empty-state semantics across web and mobile where practical.
- States and validation:
  - No separate mobile-only product rules should be introduced from the web frontend side for watchlist, portfolio, or trade flows.
  - If shared type packages or endpoint contract docs are needed to reduce parity drift, frontend-engineer should coordinate with backend-engineer and react-native-developer.
- Tracking/analytics:
  - No web analytics change is required for MVP unless the team decides to align event naming across web and mobile.

#### 8. Backend Handoff
- Backend work is required only where the current backend contract is insufficient for a native mobile client.
- API/data requirements:
  - Mobile must be able to authenticate, restore session state, fetch protected account data, and submit watchlist/trade mutations through stable backend contracts.
  - If the current auth model depends on browser-only cookies or web-specific redirect assumptions, backend-engineer must define and implement the minimum mobile-compatible auth/session approach that preserves current security posture.
  - Mobile must be able to fetch the same market summary, watchlist, portfolio, holdings, and trade-response data needed for current web MVP behavior.
  - Response contracts for unauthorized, validation failure, and successful mutations must remain explicit and consistent so mobile can implement reliable state transitions.
- Validation/business rules:
  - Preserve the existing backend source of truth for watchlist ownership, holdings, P&L-related data, and trade validation.
  - Preserve current business constraints for held-symbol watchlist behavior, quantity validation, insufficient funds/shares handling, and post-trade data consistency.
  - Ensure any endpoint used to determine authenticated state is consistent with the endpoint protection applied to trade and account mutations.
- Error handling:
  - Unauthorized responses must not leak sensitive account data and must allow mobile to deterministically reset auth state.
  - Validation and business-rule failures must remain actionable and clearly distinguishable from auth or transport failures.
  - Backend must not rely on web-only client behavior for correctness.

#### 9. Mobile Handoff
- Ownership: react-native-developer.
- Mobile app requirements:
  - Create a new Expo-managed React Native app in the repository root `mobile/` folder.
  - Implement mobile-native navigation that maps current web journeys into screens and protected flows rather than attempting a direct DOM layout port.
  - Mirror current user-facing functionality as closely as practical across login, market discovery, watchlist, portfolio, holdings, and simple buy/sell flows.
  - Reuse backend contracts and shared product semantics; do not reimplement trading logic locally.
- UX and behavior requirements:
  - Logged-out users should land in a clear unauthenticated experience with a direct path to login.
  - Authenticated users should be able to reach market discovery and portfolio/account surfaces with minimal friction.
  - Large web table behaviors must be translated into mobile-native list interactions, expandable cards, segmented views, or detail screens while preserving capabilities.
  - Watchlist add/remove interactions must feel immediate but remain backend-confirmed.
  - Trade entry must clearly show symbol, action, quantity input, loading state, and success/error result.
  - Holdings and portfolio data should remain readable on small screens without truncating critical financial context.
  - Periodic data refresh for parity-critical account and market screens should preserve visible content and scroll position, favoring in-place value updates over screen-level loading replacement.
  - Error, loading, empty, and unauthorized states must be first-class UI states, not debug-only fallbacks.
- Technical expectations:
  - Use Expo-compatible libraries and patterns suitable for long-term cross-platform maintenance.
  - Configure the Expo app entrypoint and workspace launch behavior so starting the mobile app from the repository workspace reliably resolves into the `mobile/` application.
  - Establish environment/config handling for backend base URL and mobile runtime needs.
  - Use secure mobile storage practices for any persisted auth/session artifacts permitted by the chosen backend auth model.
  - Structure the mobile app so screens, API access, auth state, and reusable UI primitives are maintainable by the react-native-developer agent and future engineers.
- Testing expectations:
  - Add mobile automated coverage for core auth and account journeys where practical in the Expo toolchain.
  - Validate critical flows manually on iOS and Android simulators/devices before MVP sign-off.

#### 10. User Personas and Jobs-to-be-Done
- Active retail trader:
  - Wants to check price movement quickly, manage a shortlist of symbols, and place simple orders without opening a laptop.
- Portfolio monitor:
  - Wants to review holdings, P&L context, and watchlist state several times per day from a phone.
- Returning authenticated user:
  - Wants the app to remember their signed-in state when appropriate, but never show stale account access after session expiry.
- Core jobs-to-be-done:
  - Monitor markets on mobile.
  - Review watchlist and holdings quickly.
  - Execute simple buy/sell actions with confidence.
  - Recover cleanly from auth expiry or backend errors without ambiguity.

#### 11. Dependencies and Risks
- Dependencies:
  - Stable backend contracts for auth, markets, watchlist, portfolio, holdings, and trade mutations.
  - A confirmed mobile-compatible auth/session approach.
  - React-native-developer agent ownership for Expo implementation.
  - Access to iOS and Android validation environments.
- Risks:
  - Current web auth may rely on browser assumptions that do not transfer cleanly to native mobile.
  - Attempting literal UI parity instead of behavioral parity could slow delivery and produce a poor mobile experience.
  - Missing agreement on which web behaviors are parity-critical could create scope drift.
  - Incomplete mobile QA coverage could hide platform-specific auth, keyboard, or network-state regressions.
  - Financial/trading copy may become misleading on mobile if risk/error states are reduced to transient notifications only.

#### 12. Open Questions
- Does the current backend auth/session contract already support native mobile clients, or is a mobile-safe auth adjustment required?
- Which current web flows are considered hard MVP parity requirements versus acceptable mobile adaptations?
- Should the first mobile release support both phone portrait layouts only, or include tablet optimization in MVP?
- Is a lightweight settings/account screen needed in mobile MVP for logout and environment diagnostics, even if web does not surface the same structure?

#### 13. Rollout and Validation Plan
- Rollout steps:
  - Finalize this requirement and confirm the backend auth approach for native mobile.
  - Create the new `mobile/` Expo app and implement core parity flows in phased order: auth, markets/watchlist, portfolio/holdings, trading.
  - Validate parity against current web behavior in staging using the same backend environment.
  - Run mobile regression coverage and manual sign-off on iOS and Android before promoting to release.
- Post-release checks:
  - Monitor auth failures, unauthorized responses, and trade/watchlist mutation failures separately for mobile.
  - Compare watchlist and portfolio consistency across mobile and web after common user actions.
  - Review qualitative feedback for mobile navigation clarity, trade confidence, and state recovery after session expiry.