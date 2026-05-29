# Problem Default Description Workflow

Automated issue description template injector for fresh issues in YouTrack 2021.4+.

> **Package Name:** `@alexbocharov/youtrack-workflow-problem-default-description-ru`\
> **Rule Name:** `default-description`\
> **Compatibility:** YouTrack 2021.4.40426+ (Legacy JS API Compatible)


## 📝 Overview

This workflow automates the creation of high-quality bug reports and change requests by dynamically injecting a standardized description template into newly opened issues. 

It ensures that users provide step-by-step reproduction scenarios, expected results, and actual behavior before submitting a ticket. This drastically cuts down on triage overhead for developers and product owners.

## 🏎️ Workflow Logic & Guard Conditions

The script operates silently in the background during the issue creation phase. It evaluates the following strict conditions:

1. **`!issue.isReported`** & **`!issue.becomesReported`**: Ensures the rule executes exclusively *during* the draft creation phase in the user UI. It never modifies existing or already submitted issues.
2. **`issue.description === null`**: Only injects the template if the user has not pasted or written any text yet, preventing data loss.

## 📦 Injected Template Layout (Russian)

When a user clicks **Create Issue**, the description field is automatically pre-populated with the following localized structure:

```text
Дорогой пользователь,
Прежде чем создавать новый запрос, ознакомьтесь с открытыми проблемами.
Если вы нашли этот запрос, проголосуйте за него или оставьте комментарий.

**Какие шаги позволят воспроизвести проблему?**

1.
2.
3.

**Каков ожидаемый результат?**


**Что происходит вместо этого?**


Дополнительную информацию можно предоставить ниже.
Предоставьте журналы, скриншоты, скринкасты и т.д. если возможно.
После заполнения удалите, пожалуйста, первый и последний абзацы.
```

## 🛠️ Requirements & Setup

This workflow is entirely independent and has zero dependencies on custom fields, making it universally applicable to any project.

### Manual Deployment Steps:
1. Navigate to your YouTrack instance: **Administration ──► Workflows**.
2. Click **Create workflow** and use the namespace identifier: `problem-default-description-ru`.
3. Add a new **On-change** JS module named `default-description`.
4. Copy the entire code block from `default-description.js` in this repository and paste it into the YouTrack web editor.
5. Hit **Save**.
6. Attach the workflow to your target project and ensure it is marked as **Active**.

---
*Maintained by the DevOps Platform Architecture Team.*
