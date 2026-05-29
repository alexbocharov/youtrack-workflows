# YouTrack Custom Workflows Library

Monorepo containing enterprise-grade JavaScript workflows and automation rules for YouTrack 2021.4+.

## 📂 Repository Structure

All workflows are located inside the `src/` directory. Each workflow is isolated within its own folder containing the production JavaScript rules and a dedicated specification file:

```text
youtrack-workflows/
├── README.md               # Global repository guide (This file)
└── src/
    ├── youtrack-scrum-automation/   # Development & QA delivery pipeline
    │   ├── README.md       # Specific field mappings & workflow state machine
    │   └── pipeline-control.js
    └── [other-workflow]/   # Future automation rules
```

## 🛠️ Development Principles for YouTrack 2021.4

Since this repository targets **YouTrack 2021.4**, all developers must strictly adhere to the legacy JavaScript Workflow API constraints:

1. **Direct Property Binding Limitation:** Direct updates to textual system fields (like `issue.summary` or `issue.description`) will be silently rolled back by the JetBrains Xodus DB if triggered in the same transaction as custom enum updates. Always use distinct action phases or strict variable caching.
2. **Strict Property Types (`.fieldType`):** Do not declare generic types (like `entities.EnumField`) inside the `requirements` block for system fields (State, Assignee, Type). Instead, use the exact internal properties via reflection: `entities.EnumField.fieldType` or `entities.User.fieldType`.
3. **Locale-Sensitive Core Mapping:** While internal JavaScript code inside `action` blocks should use immutable technical names (`stateName === 'Test'`), the `requirements` section must match the exact visible localized string names configured in your YouTrack instance (e.g., `name: 'Состояние'`).
4. **No External Utils Library:** The package `@jetbrains/youtrack-scripting-api/utils` is unavailable in version 2021.4. Do not import it. Implement native string parsers and clear custom enum states by utilizing standard JS references or structural destructuring (`delete issue.fields['FieldName']`).

## 📦 How to Deploy a Workflow manually

To move a workflow from this repository into a production YouTrack environment, follow these steps:

1. Navigate to your YouTrack instance: **Administration (Gear Icon) ──► Workflows**.
2. Click **Create workflow** and enter the workflow title (found in the specific workflow's README, e.g., `Scrum-Automation`).
3. Click **Add module** inside the new workflow container, choose **On-change**, and name it according to the rule file (e.g., `pipeline-control`).
4. Open the JavaScript file from this repository (`src/[workflow-name]/[rule-name].js`), copy its entire contents, and paste it into the YouTrack web code editor.
5. Click **Save**.
6. Go to **Administration ──► Projects**, select your target project, navigate to the **Workflows** tab, click **Attach workflow**, and check the **Enabled** box for the rule.
7. Verify project configuration criteria (ensure all custom fields and value dictionaries required by the specific script are created and attached to the project structure beforehand).

## 🪵 Code Style Guidelines

* **Comments:** Keep all standard source code comments strictly in **English**.
* **Variable Naming:** Use `camelCase` for variable definitions and execution flags.
* **Localization Safety:** Keep all localized strings isolated within the `requirements` metadata block at the bottom of the script. Do not leak localized UI text into logical evaluation scopes.

## 📜 License

All code in this repository is licensed under the [MIT License](LICENSE).

---
*Maintained by the DevOps Platform Architecture Team. For any issues or feature requests, please open a pull request.*