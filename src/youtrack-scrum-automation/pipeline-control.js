/**
 * Copyright (c) 2026 Alexander Bocharov.
 * Licensed under the MIT License.
 */

const entities = require('@jetbrains/youtrack-scripting-api/entities');

// Helper function to remove old tags from the issue summary
function cleanSummary(summary) {
  if (!summary) return '';
  return summary
    .replace(/^\[CR\]\s*/i, '')
    .replace(/^\[READY QA\]\s*/i, '')
    .replace(/^\[QA\]\s*/i, '');
}

exports.rule = entities.Issue.onChange({
  title: 'Automated Development and Testing Pipeline',
  guard: function(ctx) {
    return ctx.issue.fields.isChanged(ctx.State) || 
           ctx.issue.fields.isChanged(ctx.ReviewStage) || 
           ctx.issue.fields.isChanged(ctx.Assignee); // Added trigger for Assignee changes
  },
  action: function(ctx) {
    const issue = ctx.issue;
    var targetPrefix = null;
    var prefixChanged = false;
    
    // SAFE PROPERTY ACCESS FOR 2021.4 (Bypasses null pointer exceptions)
    const stateName = (issue.fields.State && issue.fields.State.name) ? issue.fields.State.name : '';
    const stageName = (issue.fields.ReviewStage && issue.fields.ReviewStage.name) ? issue.fields.ReviewStage.name : '';

    // SCENARIO 5: SECURITY GATE - Restrict manual Assignee change during Code Review
    if (issue.fields.isChanged(ctx.Assignee) && stateName === 'Test' && stageName === 'Code Review') {
      const newAssignee = issue.fields.Assignee;
      const techLead = issue.fields.TechLeadTeam;
      
      // If someone tries to set an assignee that doesn't match the Tech Lead field
      if (newAssignee && techLead && newAssignee.login !== techLead.login) {
        // Rollback the change immediately
        issue.fields.Assignee = issue.fields.oldValue('Исполнитель');
        
        // Show an enterprise-grade error message on the user's screen
        const workflowMessage = require('@jetbrains/youtrack-scripting-api/workflow-message');
        if (workflowMessage) {
          workflowMessage.error('Запрещено! В статусе "Тестирование" на этапе "Code Review" исполнителем можно назначить ТОЛЬКО Техлида проекта (' + techLead.fullName + ').');
        } else {
          // Fallback for older API notations
          ctx.message('Запрещено! На этапе Code Review исполнителем может быть только техлид.');
        }
        return; // Halt further execution of the script
      }
    }

    // SCENARIO 1: Issue moved to "Test" state OR ReviewStage manually set to "Code Review" while in "Test" state
    const isStateChangedToTest = issue.fields.isChanged(ctx.State) && stateName === 'Test';
    const isStageChangedToReview = issue.fields.isChanged(ctx.ReviewStage) && stageName === 'Code Review' && stateName === 'Test';

    if (isStateChangedToTest || isStageChangedToReview) {
      targetPrefix = '[CR]';
      prefixChanged = true;
      
      // Automatically set the ReviewStage field to "Code Review" on first transition
      if (stageName !== 'Code Review') {
        const reviewCodeField = issue.project.findFieldByName('Этап проверки');
        if (reviewCodeField) {
          const reviewCodeValue = reviewCodeField.findValueByName('Code Review');
          if (reviewCodeValue) {
            issue.fields.ReviewStage = reviewCodeValue;
          }
        }
      }

      // FIXED FOR SINGLE USER FIELD: Directly assign the user from the field
      if (issue.fields.TechLeadTeam) {
        issue.fields.Assignee = issue.fields.TechLeadTeam;
      } else {
        if (issue.project && issue.project.leader) {
          issue.fields.Assignee = issue.project.leader;
          issue.fields.TechLeadTeam = issue.project.leader;
        } else {
          issue.fields.Assignee = null;
        }
      }
    }
    
    // SCENARIO 2: Tech Lead approved the code and changed the stage to "Ready QA" (State is still Test)
    if (stateName === 'Test' && issue.fields.isChanged(ctx.ReviewStage) && stageName === 'Ready QA') {
      const typeName = (issue.fields.Type && issue.fields.Type.name) ? issue.fields.Type.name : '';
      if (typeName === 'Bug' || typeName === 'Ошибка') {
        targetPrefix = '[QA]';
        prefixChanged = true;
        issue.fields.Assignee = issue.reporter; 
        
        const reviewStageField = issue.project.findFieldByName('Этап проверки');
        if (reviewStageField) {
          const inTestingValue = reviewStageField.findValueByName('In Testing');
          if (inTestingValue) {
            issue.fields.ReviewStage = inTestingValue;
          }
        }
      } else {
        targetPrefix = '[READY QA]';
        prefixChanged = true;
        issue.fields.Assignee = null; 
      }
    }

    // SCENARIO 2.5: QA Engineer manually picked up a task and changed stage to "In Testing"
    if (stateName === 'Test' && issue.fields.isChanged(ctx.ReviewStage) && stageName === 'In Testing') {
      targetPrefix = '[QA]';
      prefixChanged = true;
    }
    
    // SCENARIO 3: Tester found a bug and rejected the task back to "In Progress"
    if (issue.fields.isChanged(ctx.State) && stateName === 'In Progress') {
      const oldState = issue.fields.oldValue('State');
      if (oldState && oldState.name === 'Test') {
        targetPrefix = ''; 
        prefixChanged = true;
        issue.fields.Assignee = issue.updatedBy;
        delete issue.fields['Этап проверки'];
      }
    }
    
    // SCENARIO 4: Issue moved to the final "Done" state
    if (issue.fields.isChanged(ctx.State) && stateName === 'Done') {
      targetPrefix = ''; 
      prefixChanged = true;
      delete issue.fields['Этап проверки'];
    }

    // Apply the summary change safely as a direct string assignment
    if (prefixChanged) {
      const baseText = cleanSummary(issue.summary);
      issue.summary = targetPrefix ? targetPrefix + ' ' + baseText : baseText;
    }
  },
  requirements: {
    State: { 
      type: entities.EnumField.fieldType,
      name: 'Состояние'
    },
    ReviewStage: { 
      type: entities.EnumField.fieldType,
      name: 'Этап проверки'
    },
    TechLeadTeam: { 
      type: entities.User.fieldType,
      name: 'Команда техлидов'
    },
    Assignee: { 
      type: entities.User.fieldType,
      name: 'Исполнитель'
    },
    Type: { 
      type: entities.EnumField.fieldType,
      name: 'Тип'
    }
  }
});
