# Product Requirements Log

This file is maintained by the `product-manager` agent.
Product-manager owns requirement content updates.
Product-manager should update or add requirements immediately when the user requests changes.
Developers may edit only the `Status:` line.
QA may edit only the `Status:` line.
Only the `qa-engineer` agent may create or edit `*.e2e.test.ts` files.
Each request should be added as a new dated section.

## Status Lifecycle

- perparing: Product owner is preparing requirements.
- ready: Product owner confirms requirement is ready for implementation.
- in progress: Developer is implementing.
- ready to test: Developer finished implementation and hands over to QA.
- in test: QA has started testing.
- done: QA confirms requirement implemented successfully.

## Entry Template

### Request: <short title>
Date: <YYYY-MM-DD>
Status: perparing | ready | in progress | ready to test | in test | done
Owner: product-manager

#### 1. Problem Statement
- <what user/business problem this solves>

#### 2. Goals and Success Metrics
- Goal(s):
- KPI(s):

#### 3. Research Summary
- Reference products/sites reviewed:
- Key findings:
- Assumptions:

#### 4. Scope
- In scope:
- Out of scope:

#### 5. Prioritized Requirements
- P0:
- P1:
- P2:

#### 6. Acceptance Criteria (Given/When/Then)
- Given ... When ... Then ...

#### 7. Frontend Handoff
- UI/UX requirements:
- States and validation:
- Tracking/analytics:

#### 8. Backend Handoff
- API/data requirements:
- Validation/business rules:
- Error handling:

#### 9. Dependencies and Risks
- Dependencies:
- Risks:

#### 10. Open Questions
- <question>

#### 11. Rollout and Validation Plan
- Rollout steps:
- Post-release checks:


## Page Requirement Files

- Holdings P&L page requirements: `reqirement-holdings-pnl.md`
- Landing and My Portfolio page requirements: `reqirement-landing-portfolio.md`
