## 🚀 Automated Scrum Pipeline: Lifecycle & Handoff Automation

> **Official Documentation & Integration Guide**\
> **Package Namespace:** @alexbocharov/youtrack-scrum-automation\
> **Release Target:** YouTrack 2021.4+ (Legacy JS API / Reflection Compatible)\
> **Published:** May 2026

## 🌌 Introduction & Core Philosophy
In modern engineering ecosystems, manual issue management is a bottleneck. High-velocity development requires platforms to act as autonomous coordinators rather than passive data stores. This workflow package transforms YouTrack 2021.4+ into an active orchestrator of your deployment pipeline.
By binding issue text metadata to state-machine execution phases, this workflow injects real-time visibility anchors ([CR], [READY QA], [QA]) directly into Agile card headers. It dynamically aligns personnel tasks, sets up transaction gates, and enforces structural handoffs—freeing product and engineering teams from administrative routing overhead.

```
       [ Upstream Product Backlog ]
         (Draft & Tech Review Phases)
                     │
                     ▼
           [ Column 1: OPEN ] ◄──────────────────────────────┐
                     │                                       │
                     ▼                                       │
        [ Column 2: IN PROGRESS ]                            │
                     │                                       │
                     ▼                                       │
           [ Column 3: TEST ]                                │
                     │                                       │
                     ├─► (Sub-Stage: Code Review) ──► [CR]   │ (Regression)
                     │                                       │
                     ├─► (Sub-Stage: Ready QA) ──► [READY QA]│
                     │                                       │
                     └─► (Sub-Stage: In Testing) ──► [QA]    │
                               │                             │
            ┌──────────────────┴──────────────────┐          │
            ▼                                     ▼          │
    [ Verification Passed ]             [ Defect Detected ] ─┘
            │
            ▼
    [ Column 4: DONE ]
(Summary Sanitized & Helper States Purged)
```

## 🛠️ System Prerequisites & Configuration Schema
Before attaching this package to a destination project, ensure the project's data schema is prepared with the following custom fields.
## 1. Primary Lifecycle State (state)

* Type: EnumField.fieldType (Single-value State)
* Target Board Columns: Open ──► In Progress ──► Test ──► Done
* Note: Upstream phases (Draft, Tech Review) should remain hidden from active sprint board views.

## 2. Transient Verification Stage (ReviewStage)

* Type: EnumField.fieldType (Single-value, Must allow empty/null selections)
* Dictionary Entries (Case-Sensitive):
* Code Review — Triggers Tech Lead routing and [CR] flag.
   * Ready QA — Strips active asignee, locks summary with [READY QA].
   * In Testing — Signals active validation with [QA].

## 3. Allocation Node (TechLeadTeam)

* Type: User.fieldType (Single-value)
* Scope: Per-Project configuration property. Set this value in project settings to define the engineer handling automated code reviews. If unassigned, the pipeline falls back to the native Project Leader parameter.

## 🏎️ Interactive Sprint Execution Flow

```
+-----------------------------------------------------------------------------------+

|                            AGILE BOARD SPRINT STATE MACHINE                       |
+-------------------+-------------------+-------------------+-----------------------+

|    1. OPEN        |   2. IN PROGRESS  |     3. TEST       |       4. DONE         |
+-------------------+-------------------+-------------------+-----------------------+

| [Task] Feature A  |                   |                   |                       |
|                   | ──► (Dev starts)  |                   |                       |
|                   |                   |                   |                       |
|                   | [Task] Feature A  |                   |                       |
|                   |                   | ──► (Code Done)   |                       |
|                   |                   |                   |                       |
|                   |                   | [CR] Feature A    |                       |
|                   |                   | (Assigned: Lead)  |                       |
|                   |                   |                   |                       |
|                   |                   | ──► (Review Pass) |                       |
|                   |                   |                   |                       |
|                   |                   | [READY QA] Feat A |                       |
|                   |                   | (Assigned: Null)  |                       |
|                   |                   |                   |                       |
|                   |                   | ──► (QA Pull)     |                       |
|                   |                   |                   |                       |
|                   |                   | [QA] Feature A    |                       |
|                   |                   | (Assigned: QA)    |                       |
|                   |                   |                   | ──► (All Tests Pass)  |
|                   |                   |                   |                       |
|                   |                   |                   | [Task] Feature A      |
|                   |                   |                   | (Sanitized for Prod)  |
+-------------------+-------------------+-------------------+-----------------------+
```

## Phase 1: Automated Review Routing

* Trigger: An engineer drag-and-drops an issue from In Progress to Test.
* Execution: The script intercepts the transaction, forces the ReviewStage to Code Review, and prepends [CR] to the issue summary.
* Routing: The card is automatically taken away from the developer and assigned to the user specified in the project's TechLeadTeam field.

## Phase 2: Code Review Hard-Gate

* Trigger: The Tech Lead reviews the codebase. Upon approval, they change the ReviewStage from Code Review to Ready QA.
* Execution: The issue tag updates to [READY QA].
* Routing: The Assignee field is automatically set to null (Unassigned). This signals the open QA pool that the card is ready for functional verification.
* Bug Bypass Exception: If the card type is an Ошибка / Bug, the script bypasses the public queue, automatically returns it to the original Reporter (the tester who uncovered it), and switches the stage to In Testing ([QA]).

## Phase 3: Active QA Ingestion

* Trigger: A QA engineer pulls an unassigned [READY QA] card, sets themselves as the Assignee, and sets the stage to In Testing.
* Execution: The header tag shifts to [QA], locking the issue into active verification.

## Phase 4: Resolution & Regression Handling
Depending on verification results, one of two native routines is executed:

* Scenario A (Passed): The tester moves the card to Done. The engine cleans the issue text (removes any [QA] or [CR] artifacts) and purges the helper stages using a safe delete operation.
* Scenario B (Failed/Regression): The tester rejects the card back to In Progress. The engine interrogates transaction history metadata (issue.updatedBy), re-assigns the card back to the original developer, clears the ReviewStage, and strips all header prefixes. The card appears back in the developer's queue in its original, clean format.

## 🔒 Security Gate & Validation Locks
To prevent accidental handoffs and out-of-order execution, the workflow acts as a system validator:

* Review Phase Lock: While an issue resides in the Test column with the stage set to Code Review, manual modifications to the Assignee field are forbidden. If a user attempts to change the assignee to a tester or alternative developer, the transaction is rejected. The workflow rolls back the assignee parameter to the locked Tech Lead profile and throws a native transaction error alert on the user's screen.

```
+-----------------------------------------------------------------------------------+

| ❌ TRANSACTION REJECTED                                                           |
+-----------------------------------------------------------------------------------+

| Error: Manual assignee override forbidden during active Code Review phases.       |
| Current Phase: [CR] Code Review                                                   |
| Enforced Role: Assigned Tech Lead                                                 |
| Action: Rolling back assignee parameters to preserve state integrity.              |
+-----------------------------------------------------------------------------------+
```

## 📊 Telemetry & Engineering Metrics
By implementing clean, bounded stages instead of scattered boards and columns, data analysts and engineering managers can extract clear operational metrics directly from YouTrack dashboards:

* Bottleneck Discovery: Counting cards containing [CR] immediately displays code review queue overhead without requiring sync meetings.
* QA Velocity: Tracking the time delta between [READY QA] issuance and task closure gives product managers precision insight into downstream deployment readiness.
* Regression Rate: Measuring how frequently cards drop back to In Progress using the automated fallback trigger flags quality issues in early-stage development cycles.

------------------------------
*Maintained under enterprise open-source licensing guidelines. For implementation queries, continuous integration hooks, or configuration adjustments, contact your local DevOps architecture group.*
