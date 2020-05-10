## ❗ Extension does not conform to the [todo.txt](https://github.com/todotxt/todo.txt) spec.
## ❗ Extension is in Alpha phase

![demo](https://raw.githubusercontent.com/usernamehw/vscode-todo-md/master/img/demo.png)

By default works for files with names `todo.md` & `todo.archive.md` (But can be changed with `activatePattern` setting).

# Features

## Projects

```
+Project
```

Nested projects are ok `+Project\nested` but at the same time they do not get treated differently in any way.

## Context

```
@context
```

## Tags

```
#tag1#tag2
```

## Priority

Priority is a single UPPERCASE letter surrounded by round brackets. It can be (A-Z). Only the first 6 (A-F) have unique colors though.

```
(A)
```

## Special tag:value pairs

```
{due:2020-04-30}
```

List of special tags:

tag | description | example
---|---|---
`due`|Due date|`{due:2020-05-15}`
`cm`|Completion date|`{cm:2020-05-15}`
`cr`|Creation date|`{cr:2020-05-15}`
`t`|(threshold) Task is not visible in Tree Views until the specified date|`{t:2020-05-15}`
`h`|(hidden) Task is not visible in Tree Views|`{h}`
`count`|Instead of completing the task increases count by 1. When the number matches the goal - the task is considered completed|`{count:0/3}`
`link`|Adds context menu in Tree View to follow link|`{link:https://www.google.com}`

<!--
- ❌ id (UUID)
- ❌ id/p (dependent task / blocked task?)
- ❌ f/star (favorite/starred)
- ❌ note
-->

### Due as range `..`

```
{due:2020-05-08..2020-05-12}
```

<!-- ### Multiple due dates `,`

```
{due:Sun,Mon}
``` -->

## Comments

Comment is not considered a task. It starts with a sharp sign `#` followed by a space.

```
# comment
```

## Filter

- `#tag` - tag
- `+project` - project
- `@context` - context
- `$A` - Priority
- `$done` - Completed task
- `$due` - Due or Overdue task
- `$overdue` - Overdue task
- `$noTag` - Task with no tags
- `$noProject` - Task with no projects
- `$noContext` - Task with no contexts
- `"TEXT_TO_SEARCH"` - Search only in task title (not in special fields, like tag or project)

# Commands

- `todomd.toggleDone` <kbd>Alt</kbd>+<kbd>D</kbd> - Toggle Done (Completion)
- `todomd.getNextTask` - Get due task from main file. If none are due - get one with the highest priority.
- `todomd.getFewNextTasks` - Get several tasks. Due tasks are on top. Number of shown can be configured with `getNextNumberOfTasks`.
- `todomd.getRandomTask` - Get random due task if exists. If none are due, get random task out of non-due tasks. (Taken from main file).
- `todomd.sortByPriority` - Sort selected lines by priority
- `todomd.createSimilarTask` - Create similar task (same tags, projects, contexts).
- `todomd.setDueDate` - Helper command to set due date relative to now. Possible values: `+0` (today), `-1` (yesterday), `+1` (tomorrow) etc. (NOTE: plus and minus signs are important)

# Settings

|Name|Default|Description|
| --- | --- |--- |
|activatePattern|`"**/{todo,todo.archive}.md"`|Choose files that extension will operate on. By default activated on 2 files (`todo.md` & `todo.archive.md`). This format is called `Glob`. Examples:<br>Activate on any (.txt) file - `**/*.txt`.<br>Activate only on single file (todo.txt) - `**/todo.txt`<br>Activate on 2 files (todo.txt or task.txt) - `**/{todo,task}.txt`|
|addCompletionDate|**true**|When completing a task add completion date to it: `{cm:2020-04-30}`|
|completionDateIncludeTime|**false**|When `addCompletionDate` setting enabled, includes date and time: `{cm:2020-04-30T09:11:17}`|
|creationDateIncludeTime|**false**|When `addCreationDate` setting enabled, includes date and time: `{cr:2020-04-30T09:11:17}`|
|useLocalDateTime|**true**|Calculate offset from UTC to use local date/time.|
|defaultPriority|**"Z"**|Used in sorting for tasks without priority.|
|getNextNumberOfTasks|**5**|Number of tasks returned by `getFewNextTasks` command.|
|todomd.projects|[]|Projects added to autocomplete.|
|todomd.contexts|[]|Contexts added to autocomplete.|
|todomd.tags|[]|Tags added to autocomplete.|
|treeViews|[...]|Tree Views that have predefined filters (3 max).|
|savedFilters|[...]|Filters that you can pick when applying a filter.|

# Colors

Can be configured in `settings.json` (**`workbench.colorCustomizations`** section)

- `todomd.tagForeground`
- `todomd.contextForeground`
- `todomd.projectForeground`
- `todomd.notDueForeground`
- `todomd.dueForeground`
- `todomd.overdueForeground`
- `todomd.tagDelimiterForeground`
- `todomd.commentForeground`
- `priorityAForeground`
- `priorityBForeground`
- `priorityCForeground`
- `priorityDForeground`
- `priorityEForeground`
- `priorityFForeground`

## Recommended settings

```js
"workbench.dialogs.customEnabled": true,
```

## Please upvote the following upstream vscode issues:

- [#83911 Support WebViews in extension contributed custom views](https://github.com/microsoft/vscode/issues/83911)
- [#32813 \[theming\] Access theme's colors programmatically](https://github.com/microsoft/vscode/issues/32813)