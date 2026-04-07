# Requirements: Login Session Propagation for Trade and Watchlist Operations

Date: 2026-04-07
Feature Number: 1
Status: Done
Owner: product-manager
Status Transition: Drafting -> Ready (2026-04-07)

#### 1. Research Findings and Product Assumptions
- Reference patterns reviewed:
  - Robinhood and eToro session model: authenticated users can trade and mutate watchlist immediately after login without manual refresh.
  - Interactive Brokers and Fidelity web flows: server-authoritative session cookie/token is consistently included on all account-scoped API calls.
- Key findings:
  - Trade submit (buy/sell) and watchlist mutation are account-scoped actions and must share one auth pipeline.
  - Most regressions in this area are caused by frontend request clients not forwarding session artifacts after login, or backend guards not reading the same session source across routes.
  - Clear 401 handling is required for expired sessions, but authenticated users should never see `Authentication required` due to missing propagation immediately after successful login.
- Product assumptions:
  - Login remains the single source of session creation.
  - Trade and watchlist endpoints are both protected by server authorization.
  - MVP continues using existing auth mechanism (cookie or token), not introducing new auth provider.
#### 2. Problem Statement
- New regression: authenticated users are blocked from core actions.
- Current failing regression scope (tests): backend auth integration coverage for login-session propagation across markets summary, watchlist mutation, trade mutation, and logout invalidation flows.
- Specific regression under investigation: `POST /markets/buy` returns HTTP 401 Unauthorized even after successful login.
- Buy and sell actions throw `Error: Authentication required.` even after successful login.
- Add/remove watchlist actions throw `Error: Failed to update watchlist: Unauthorized` for signed-in users.
- In some flows, client displays a logged-in state even when no valid server session exists (missing or expired), causing false confidence and failed protected actions.
- Logout/session-invalidation coverage is not consistently enforced, risking stale access to protected markets/watchlist/trade routes after sign-out.
- Impact:
  - Breaks critical trading workflow and user trust.
  - Creates false unauthorized state and potential support/compliance escalations.
  - Increases abandonment risk during high-intent actions.

#### 3. Goals and Success Metrics
- Goals:
  - Restore reliable authenticated behavior for trade and watchlist mutations.
  - Ensure session created at login is propagated to all protected API clients and requests.
  - Preserve strict unauthorized behavior only for genuinely missing/expired sessions.
- Success metrics:
  - 100% pass rate on backend auth integration tests covering markets summary, watchlist mutation, trade mutation, and logout invalidation in requirement-login-watchlist scope.
  - 0 reproducible auth failures for buy/sell and add/remove watchlist in authenticated QA flows.
  - 100% of authenticated mutation requests include expected session credentials artifact.
  - 100% of genuinely unauthenticated mutation requests return 401 with safe error body.
  - <1% post-login mutation failures attributable to auth propagation in first 7 days after release.

#### 4. Scope and Non-Goals
- In scope:
  - Authenticated buy/sell API behavior.
  - Authenticated watchlist add/remove API behavior.
  - Session propagation from login to all protected API calls.
  - Unified frontend handling for 401/expired-session responses.
  - Backend guard/session parsing consistency across trade and watchlist endpoints.
- Non-goals:
  - New login UX redesign.
  - Signup, password reset, MFA, social login.
  - Changes to pricing/order execution business logic beyond auth gating.

#### 5. Prioritized Requirements (P0/P1/P2)
- P0:
  - Regression fix: `POST /markets/buy` must not return HTTP 401 for a valid active session established via login.
  - Markets summary endpoint(s) used by authenticated portfolio/watchlist surfaces must resolve successfully for a valid active session and must not return unauthorized for valid sessions.
  - After successful login, all protected trade requests (buy/sell) must include authenticated session context and succeed when business validation passes.
  - After successful login, all protected watchlist mutation requests (add/remove) must include authenticated session context and succeed when payload is valid.
  - Frontend must use one canonical authenticated API client/configuration for all protected mutation calls.
  - Frontend must not mark user as authenticated until session bootstrap validation confirms an active server-recognized session.
  - Backend must enforce the same authorization/session extraction logic on trade and watchlist mutation routes.
  - Unauthorized error response contract must be standardized (HTTP 401, safe message), and used only for missing/invalid/expired sessions.
  - Logout must reliably invalidate active session so subsequent protected markets summary/watchlist/trade requests are rejected with 401 until user logs in again.
  - Session created at login must be immediately usable without requiring manual page reload.
- P1:
  - On expired session, frontend must clear auth state, route to login, and preserve intended return path.
  - Frontend error messaging must distinguish session-expired flow from business/validation errors.
  - Add instrumentation/logging fields to isolate auth propagation failures (without logging credentials/tokens).
- P2:
  - Add silent session revalidation on app bootstrap to reduce false negatives after refresh.

#### 6. Acceptance Criteria (Given/When/Then)
- Given a user logs in with valid credentials, when login response is successful, then session credentials are stored/applied and immediately available to protected API clients.
- Given a user is authenticated with a valid active session, when markets summary data is requested for portfolio/watchlist surfaces, then response returns authorized summary data and not HTTP 401.
- Given app bootstrap runs and local auth state says logged in, when server session validation fails (missing/expired/invalid), then frontend must reset auth state to logged out before enabling protected trading/watchlist actions.
- Given an authenticated user submits a buy order, when the request is sent, then backend authorizes it and request is not rejected with `Authentication required`.
- Given a user has just logged in successfully, when `POST /markets/buy` is submitted with valid business payload, then response is not HTTP 401 and order proceeds to normal validation/processing.
- Given an authenticated user submits a sell order, when the request is sent, then backend authorizes it and request is not rejected with `Authentication required`.
- Given an authenticated user adds a symbol to watchlist, when the request is sent, then backend authorizes it and response is not `Unauthorized`.
- Given an authenticated user removes a symbol from watchlist, when the request is sent, then backend authorizes it and response is not `Unauthorized`.
- Given a request is sent without valid session context, when backend authorization runs on trade or watchlist mutation endpoints, then backend returns HTTP 401 and no mutation is applied.
- Given a user logs out successfully, when any subsequent protected markets summary/watchlist/trade request is sent without re-login, then backend returns HTTP 401 and frontend keeps user in logged-out state.
- Given a session has expired, when user triggers buy/sell/watchlist mutation, then frontend routes user to login, shows session-expired message, and no stale success state is rendered.
- Given user re-authenticates after expiry, when login succeeds, then user can retry intended trade/watchlist mutation without manual refresh.

#### 7. Frontend Handoff
- Adopt a single protected API request path for buy/sell and watchlist add/remove that always carries session credentials.
- Ensure session propagation occurs immediately after login success before enabling trade/watchlist action buttons.
- Implement startup session bootstrap validation against server-authenticated state before rendering authenticated experience.
- Enforce strict auth consistency rule: local `isAuthenticated` can only be true when last bootstrap/login validation confirms active server session.
- Add explicit client behavior for HTTP 401 on protected mutations:
  - Clear local auth state.
  - Redirect to login.
  - Preserve intended post-login return route and pending action context where feasible.
- Normalize error mapping:
  - `401/unauthorized` -> auth/session messaging.
  - non-401 failures -> action-specific validation/system messaging.
- Add automated frontend coverage:
  - App bootstrap with stale local auth and missing/expired server session resets to logged-out state.
  - Login success followed by buy/sell mutation call uses authenticated client.
  - Login success followed by `POST /markets/buy` does not fail with unauthorized when session is valid.
  - Login success followed by watchlist add/remove mutation call uses authenticated client.
  - Expired-session 401 path redirects to login and blocks false success UI.

#### 8. Backend Handoff
- Verify trade and watchlist mutation endpoints consume identical auth guard/session extraction strategy.
- Verify markets summary endpoint(s) used after login consume the same auth/session interpretation as protected mutation endpoints.
- Ensure login-created session artifact (cookie/token) is accepted by both endpoint groups without route-specific mismatch.
- Validate session bootstrap/check endpoint (or equivalent server-auth introspection path) uses same session verification source as mutation guards.
- Enforce strict auth consistency: any request path used by frontend to infer authenticated state must fail when mutation guards would fail, and succeed when mutation guards would succeed.
- Standardize unauthorized response shape and HTTP status on protected mutation endpoints.
- Ensure logout endpoint/session-destroy path invalidates session deterministically across all auth-guarded route groups.
- Reject unauthenticated requests deterministically and prevent partial mutation side effects.
- Add/extend backend tests:
  - Valid session after login can call `POST /markets/buy` without 401.
  - Valid session after login can retrieve markets summary endpoint(s) without 401.
  - Authenticated buy/sell succeeds.
  - Authenticated watchlist add/remove succeeds.
  - After logout, protected markets summary/watchlist/trade endpoints return 401 until re-authentication.
  - Missing/invalid session returns 401 for both endpoint groups.
  - Session bootstrap/check endpoint reflects missing/expired session consistently with mutation guard behavior.
  - Expired session behavior matches standardized unauthorized contract.

#### 9. QA Handoff
- Primary regression suite scope (must-pass before release):
  - Backend auth integration tests for login-session propagation to markets summary, watchlist mutation, trade mutation, and logout invalidation.
  - Frontend auth journey tests for login -> markets summary load, login -> buy/sell, login -> add/remove watchlist, logout -> protected-route rejection.
- Mandatory test scenarios:
  - Happy path: login success enables markets summary + watchlist + buy/sell without unauthorized errors.
  - Guard path: unauthenticated access to protected summary/watchlist/trade returns 401 and no side effects.
  - Logout path: once logout succeeds, previously available protected actions fail with expected unauthorized behavior until re-login.
  - Expiry path: expired session during protected action triggers login redirect and state cleanup.
- Evidence requirements for sign-off:
  - Capture backend test run artifact showing pass status for auth integration scope.
  - Capture frontend E2E/test evidence for login, mutation, and logout invalidation journey.
  - Confirm no unexpected unauthorized responses in authenticated happy-path logs.

#### 10. API and Data Requirements
- Authentication/session requirements:
  - Login returns session artifact required by protected routes.
  - Session artifact propagation mechanism must be documented for frontend client usage.
  - Session validation semantics are consistent across trade and watchlist modules.
- Protected mutation requirements:
  - Trade endpoints: require valid session; return 401 if invalid/missing.
  - Watchlist mutation endpoints: require valid session; return 401 if invalid/missing.
  - No endpoint should return 401 for a valid, active authenticated session.
- Compliance and data safety:
  - Never log raw credentials, raw tokens, or full session identifiers.
  - Unauthorized responses must not leak account-specific trading metadata.

#### 11. Open Questions, Dependencies, and Rollout Plan
- Open questions:
  - Is auth transport cookie-based, bearer token-based, or hybrid for current frontend clients?
  - Should pending trade intent be restored after re-login for expired-session flow, or only return user to page context?
- Dependencies:
  - Shared auth contract between frontend API layer and backend guards.
  - QA environment with deterministic session-expiry testing capability.
- Rollout and validation:
  - Validate in staging with targeted regression suite for login -> trade and login -> watchlist mutation journeys.
  - Monitor 401 rates by endpoint after release and compare authenticated vs unauthenticated cohorts.
  - Exit criteria: no reproducible auth regression in buy/sell and add/remove watchlist flows across supported browsers.
