# User Guide: Automated Problem Description Template

> **Scope:** Applied globally across all engineering and product teams.\
> **Process Version:** 1.0 (Compatible with YouTrack 2021.4+)

## 1. Purpose of the Process

The purpose of this automation is to establish a unified corporate standard for reporting system bugs, defects, and behavioral anomalies. 

By automatically injecting a standardized markdown template into fresh issue drafts, the system helps reporters supply critical context from the start. This drastically reduces turnaround time on issue triage, minimizes back-and-forth communication, and accelerates engineering resolution loops.

## 2. Injected Layout Structure

When you click the **Create Issue** button, the `Description` area is automatically pre-populated with the following dynamic layout:

* **Header Section (Guidance):** Contains a temporary notice reminding the reporter to look for duplicate tickets and leverage the voting system.
* **Reproduction Steps:** A structured numeric list (`1.`, `2.`, `3.`) to document exact step-by-step actions required to trigger the issue.
* **Expected Result:** A dedicated block to define how the system *should* behave according to documentation or specifications.
* **Actual Behavior:** A dedicated block to describe what *instead* happens in the application (including explicit system errors or incorrect UI output).
* **Footer Section (Attachments):** Reminds the user to attach vital telemetry data (server logs, screenshots, browser console dumps).

## 3. Step-by-Step Reporter Instructions

To ensure seamless issue processing, please follow these behavioral rules when submitting a new ticket:

1. **Keep the Structure:** Do not delete the bold headers (`**Какие шаги...**`, `**Каков ожидаемый результат?**`, `**Что происходит вместо этого?**`). Fill out your data directly beneath them.
2. **Be Specific in Steps:** Document your reproduction steps starting from a clean state (e.g., *1. Open the Employee Card; 2. Clear the SNILS field; 3. Click Save*).
3. **Clean Up Before Submitting:** The first paragraph (greeting/notice) and the last paragraph (attachment reminder) are helper hints. **Please delete the first and last paragraphs manually** once you have filled out the core details.
4. **Attach Evidence:** Drop your screenshots, video screencasts, or log snippets directly into the ticket description or files area.

---
*Maintained by the DevOps Platform Architecture Team.*
