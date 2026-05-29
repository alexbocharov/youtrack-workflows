# YouTrack Scrum Automation Pipeline> Custom workflow package for YouTrack 2021.4 managing automated development, code review, and QA handoffs.

**Package Name:** `@alexbocharov/youtrack-scrum-automation`  
**Rule Name:** `pipeline-control`  
**Compatibility:** YouTrack 2021.4+ (Legacy JS API / `.fieldType` compatible)

## 📝 Overview
This repository contains an enterprise-grade automated Scrum pipeline tailored for dual-track platform development and complex integrations (e.g., integration platforms, backend components, database migrations). 

It eliminates manual routing overhead, enforces quality gates between code changes and testing phases, and provides visual progression anchors directly on the Scrum Agile Board by dynamically injecting lifecycle tags (`[CR]`, `[READY QA]`, `[QA]`) into issue summaries.

## ⚙️ Workflow State Machine Architecture

```
[Draft/Tech Review] ──► [Open] ──► [In Progress] ──► [Test] ──► [Done]
│
(ReviewStage) ▼
┌────────────────────────────────┐
│ Code Review ──► Ready QA ──► │
│ ([CR]) ([READY QA]) │
│ │
│ ┌◄───────────────────────────┤
│ │ In Testing ([QA]) │
└───┼────────────────────────────┘
│ (If Bug Found)
▼
[In Progress]
```

## 🛠️ Field Configurations & Requirements

To use this workflow, the target YouTrack project **must** have the following custom fields configured exactly as mapped below (case-sensitive technical names):

### 1. State / Состояние (`state`)
* **Type:** `EnumField` (State single value)
* **Allowed Values (Technical Names):** `Draft`, `Tech Review`, `Open`, `In Progress`, `Test`, `Done`.

### 2. ReviewStage / Этап проверки (`ReviewStage`)
* **Type:** `EnumField` (Single value, **Must be clearable / Can be empty**).
* **Allowed Values (Technical Names):**
  * `Code Review` — Triggers `[CR]` prefix and assigns the designated Tech Lead.
  * `Ready QA` — Triggers `[READY QA]` prefix and unassigns the card for general QA pool availability.
  * `In Testing` — Triggers `[QA]` prefix indicating active verification.

### 3. TechLeadTeam / Команда техлидов (`TechLeadTeam`)
* **Type:** `UserField` (Single value).
* **Usage:** Acts as a per-project configuration node determining which engineer handles automated code reviews. Falls back to the **Project Leader** instance if left empty.

## 🚀 Pipeline Scenarios Handled Dynamically

* **Scenario 1 (Automated Review Routing):** When an engineer moves a card to `Test` (or manually resets it to `Code Review` while in the test column), the script updates the summary with a `[CR]` tag, turns the stage field to `Code Review`, and instantly changes the `Assignee` to the project's designated Tech Lead.
* **Scenario 2 (QA Hand-off Allocation):** When the Tech Lead finishes checking the code and selects `Ready QA`, the script injects a `[READY QA]` tag and clears the assignee to allow a push/pull mechanism for QA engineers. If the task is a **Bug / Ошибка**, it bypasses the idle queue and auto-assigns back to the `Reporter` (Tester) while changing the stage to `In Testing` (`[QA]`).
* **Scenario 3 (Quality Gate / Security Lock):** If any user tries to manually tamper with the `Assignee` field during an active `Code Review` stage, the script completely halts the transaction, triggers an alert window, and rolls back the assignee to the locked Tech Lead profile.
* **Scenario 4 (Regression Refusal Loop):** If a Tester rejects a task from the `Test` column back into `In Progress`, the script remembers the last modifying developer, auto-assigns it back to them for fixes, and completely strips all workflow tags and stages to preserve history hygiene.
* **Scenario 5 (Final Delivery Sanitization):** When an issue successfully steps into `Done`, the script strips out any injected summary artifacts and safely purges the transient review helper stages.

## 💻 Manual Deployment into YouTrack 2021.4

1. Navigate to **Administration ──► Workflows**.
2. Click **Create workflow** and use the namespace identifier: `Scrum-Automation`.
3. Add a new **On-change** JS module named `pipeline-control`.
4. Replace the template file contents with the pure JS block located within `pipeline-control.js` in this repository.
5. Hit **Save**.
6. Access your target Project settings, navigate to the **Workflows** tab, and toggle the `pipeline-control` rule checkmark to **Enabled**.

---
*Maintained by the DevOps Platform Architecture Team.*
