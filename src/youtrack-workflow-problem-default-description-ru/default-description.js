/**
 * Copyright (c) 2026 Alexander Bocharov.
 * Licensed under the MIT License.
 */

var entities = require('@jetbrains/youtrack-scripting-api/entities');
var workflow = require('@jetbrains/youtrack-scripting-api/workflow');

exports.rule = entities.Issue.onChange({
  title: 'Вставлять шаблон описания по умолчанию',
  guard: function(ctx) {
    var issue = ctx.issue;
    return !issue.isReported && !issue.becomesReported && issue.description === null;
  },
  action: function(ctx) {
    ctx.issue.description = "Дорогой пользователь," +
      "\nПрежде чем создавать новый запрос, ознакомьтесь с открытыми проблемами." +
      "\nЕсли вы нашли этот запрос, проголосуйте за него или оставьте комментарий." +
      "\n\n" +
      "\n**Какие шаги позволят воспроизвести проблему?**\n" +
      "\n\n1.\n2.\n3.\n\n" +
      "\n**Каков ожидаемый результат?**\n" +
      "\n\n" +
      "\n**Что происходит вместо этого?**\n" +
      "\n\n" +
      "\nДополнительную информацию можно предоставить ниже." +
      "\nПредоставьте журналы, скриншоты, скринкасты и т.д. если возможно." +
      "\nПосле заполнения удалите, пожалуйста, первый и последний абзацы.";
  },
  requirements: {}
});