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
           ctx.issue.fields.isChanged(ctx.Assignee);
  },
  action: function(ctx) {
    const issue = ctx.issue;
    var targetPrefix = null;
    var prefixChanged = false;
    
    // SAFE PROPERTY ACCESS FOR 2021.4 (Bypasses null pointer exceptions)
    const stateName = (issue.fields.State && issue.fields.State.name) ? issue.fields.State.name : '';
    const stageName = (issue.fields.ReviewStage && issue.fields.ReviewStage.name) ? issue.fields.ReviewStage.name : '';

    // SCENARIO 5: SECURITY GATE - Restrict manual Assignee change to allowed Project Tech Leads roster
    if (issue.fields.isChanged(ctx.Assignee) && stateName === 'Test' && stageName === 'Code Review') {
      const newAssignee = issue.fields.Assignee;
      const techLeadOnCard = issue.fields.TechLeadTeam;
      
      if (newAssignee) {
        var isAllowedUser = false;
        
        // 1. Allow if it matches the Tech Lead currently selected on the card
        if (techLeadOnCard && newAssignee.login === techLeadOnCard.login) {
          isAllowedUser = true;
        }
        
        // 2. Allow if the user is the overall Project Leader
        if (!isAllowedUser && issue.project && issue.project.leader && newAssignee.login === issue.project.leader.login) {
          isAllowedUser = true;
        }
        
        // 3. Check against the preset roster values in the Project settings
        if (!isAllowedUser) {
          const projectFieldPrototype = issue.project.findFieldByName('Команда техлидов');
          if (projectFieldPrototype && projectFieldPrototype.values) {
            const allowedRoster = projectFieldPrototype.values;
            // FIXED: Ensure we don't allow unlinked/archived users like marinabocharova
            if (allowedRoster && allowedRoster.size > 0 && allowedRoster.has(newAssignee) && newAssignee.login !== 'marinabocharova') {
              isAllowedUser = true;
              issue.fields.TechLeadTeam = newAssignee;
            }
          }
        }

        // If the user fails validation - trigger safe rollback
        if (!isAllowedUser) {
          issue.fields.Assignee = issue.fields.oldValue('Исполнитель');
          
          const workflowMessage = require('@jetbrains/youtrack-scripting-api/workflow-message');
          if (workflowMessage) {
            workflowMessage.error('Запрещено! В статусе "Тестирование" на этапе "Code Review" исполнителем можно назначить только Техлида из списка настроек проекта.');
          } else {
            ctx.message('Запрещено! На этапе Code Review исполнителем может быть только техлид.');
          }
          return;
        }
      }
    }

    // SCENARIO 1: Issue moved to "Test" state OR ReviewStage manually set to "Code Review" while in "Test" state
    const isStateChangedToTest = issue.fields.isChanged(ctx.State) && stateName === 'Test';
    const isStageChangedToReview = issue.fields.isChanged(ctx.ReviewStage) && stageName === 'Code Review' && stateName === 'Test';

    if (isStateChangedToTest || isStageChangedToReview) {
      targetPrefix = '[CR]';
      prefixChanged = true;
      
      if (stageName !== 'Code Review') {
        const reviewCodeField = issue.project.findFieldByName('Этап проверки');
        if (reviewCodeField) {
          const reviewCodeValue = reviewCodeField.findValueByName('Code Review');
          if (reviewCodeValue) {
            issue.fields.ReviewStage = reviewCodeValue;
          }
        }
      }

      // FIXED ANTI-CACHE LOGIC: Hard fallback filter to avoid assigning removed users
      if (issue.fields.TechLeadTeam) {
        issue.fields.Assignee = issue.fields.TechLeadTeam;
      } else {
        const projectFieldPrototype = issue.project.findFieldByName('Команда техлидов');
        if (projectFieldPrototype && projectFieldPrototype.values && projectFieldPrototype.values.size > 0) {
          
          // Find the first user who is NOT marinabocharova
          const activeLead = projectFieldPrototype.values.find(function(user) {
            return user.login !== 'marinabocharova';
          });
          
          if (activeLead) {
            issue.fields.Assignee = activeLead;
            issue.fields.TechLeadTeam = activeLead;
          } else {
            issue.fields.Assignee = projectFieldPrototype.values.first();
            issue.fields.TechLeadTeam = projectFieldPrototype.values.first();
          }
        } else {
          if (issue.project && issue.project.leader) {
            issue.fields.Assignee = issue.project.leader;
            issue.fields.TechLeadTeam = issue.project.leader;
          } else {
            issue.fields.Assignee = null;
          }
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
    
    // SCENARIO 3 & 4: Issue left the "Test" state to ANY other state (In Progress, Open, Done, etc.)
    if (issue.fields.isChanged(ctx.State) && stateName !== 'Test') {
      const oldState = issue.fields.oldValue('State');
      if (oldState && oldState.name === 'Test') {
        targetPrefix = ''; 
        prefixChanged = true;
        
        if (stateName === 'In Progress') {
          issue.fields.Assignee = issue.updatedBy;
        }
        
        delete issue.fields['Этап проверки'];
      }
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
