## ❗ Extension does NOT conform to the [todo.txt](https://github.com/todotxt/todo.txt) spec.

![demo](https://raw.githubusercontent.com/usernamehw/vscode-todo-md/master/img/demo.png)

![webview demo](https://raw.githubusercontent.com/usernamehw/vscode-todo-md/master/img/webview_demo.png)

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

## Special {tag:value} pairs

```
{due:2020-04-30}
```

List of special tags:

tag | description | example
---|---|---
`due`|Due date|`{due:2020-05-15}`
`overdue`|Oldest overdue date (only for recurring tasks). Added automatically.|`{overdue:2020-05-15}`
`cm`|Completion date|`{cm:2020-05-15}`
`cr`|Creation date|`{cr:2020-05-15}`
`t`|(threshold) Task is not visible in Tree Views until the specified date|`{t:2020-05-15}`
`h`|(hidden) Task is not visible in Tree Views|`{h}`
`c`|(collapsed) State of folding in Tree View or webview for nested tasks|`{c}`
`count`|Instead of completing the task increases count by 1. When the number matches the goal - the task is considered completed|`{count:0/3}`

<!--
- ❌ id (UUID)
- ❌ id/p (dependent task / blocked task?)
- ❌ f/star (favorite/starred)
- ❌ note
-->

### Recurring due date

Recurring due dates should not be archived and their completion state should be reset every day.

```bash
# Recurring due date that is due every monday:
{due:monday}
# Short form:
{due:mon}
# Recurring date that is due every 2nd day (starting date required)
{due:2020-06-28|e2d}
```

### Multiple recurring due dates `,`

```bash
# Is due every Sunday and Monday
{due:mon,sun}
```

## Comments

Comment is not considered a task. It starts with a sharp sign `#` followed by a space.

```bash
# comment
```

## Filter (In Tasks Tree View and Webview View)

- `#tag` - tag
- `+project` - project
- `@context` - context
- `$A` - Priority
- `>$C` - Priority range (here it matches `$A`, `$B`, `$C`)
- `$done` - Completed task
- `$due` - Due or Overdue task
- `$overdue` - Overdue task
- `$recurring` - Recurring tasks
- `$noTag` - Task with no tags
- `$noProject` - Task with no projects
- `$noContext` - Task with no contexts
- `TEXT_TO_SEARCH` - Search in raw text (anything in the line)
- `"TEXT_TO_SEARCH"` - Search only in task title (not in special entities, like tag or project)
- `-#tag` - (Negation) Task doesn't contain tag `#tag`

## Commands

- `todomd.toggleDone` <kbd>Alt</kbd>+<kbd>D</kbd> - Toggle Done (Completion)
- `todomd.toggleComment` - Toggle comment. (Not binded by default). You can bind it only for active file: **{"key": "ctrl+/","command": "todomd.toggleComment","when": "editorFocus && todomd:isActive"},** in keybindings.json.
- `todomd.incrementPriority` - Increment priority.
- `todomd.decrementPriority` - Decrement priority.
- `todomd.getNextTask` - Get due task from main file. If none are due - get one with the highest priority.
- `todomd.getFewNextTasks` - Get several tasks. Due tasks are on top.
- `todomd.getRandomTask` - Get random not completed task.
- `todomd.sortByPriority` - Sort selected lines by priority
- `todomd.createSimilarTask` - Create similar task (same tags, projects, contexts).
- `todomd.setDueDate` - Helper command to set due date relative to now. [Docs](https://github.com/usernamehw/vscode-todo-md/blob/master/docs/docs.md#set-due-date-helper-function-todomdsetduedate)


## Settings (prefix `todomd.`)

<details><summary>Settings list</summary>

|Name|Default|Description|
| --- | --- |--- |
|activatePattern|`"**/{todo,todo.archive}.md"`|Choose files that extension will operate on. By default activated on 2 files (`todo.md` & `todo.archive.md`). This format is called `Glob`. Examples:<br>Activate on any (.txt) file - `**/*.txt`.<br>Activate only on single file (todo.txt) - `**/todo.txt`<br>Activate on 2 files (todo.txt or task.txt) - `**/{todo,task}.txt`|
|addCompletionDate|**`true`**|When completing a task add completion date to it: `{cm:2020-04-30}`|
|completionDateIncludeTime|**`false`**|When `addCompletionDate` setting enabled, includes date and time: `{cm:2020-04-30T09:11:17}`|
|addCreationDate|**`false`**|When creating a task add creation date to it: `{cr:2020-04-30}`|
|creationDateIncludeTime|**`false`**|When `addCreationDate` setting enabled, includes date and time: `{cr:2020-04-30T09:11:17}`|
|confirmTaskDelete|`"always"`|Show confirmation when deleting task from Tree View or Webview.|
|defaultPriority|`"G"`|Used in sorting for tasks without priority.|
|getNextNumberOfTasks|**`5`**|Number of tasks returned by `getFewNextTasks` command.|
|todomd.projects|`[]`|Projects added to autocomplete.|
|todomd.contexts|`[]`|Contexts added to autocomplete.|
|todomd.tags|`[]`|Tags added to autocomplete.|
|treeViews|`[...]`|Tree Views that have predefined filters (3 max).|
|savedFilters|`[...]`|Filters that you can pick when applying a filter.|
|tabSize|**`4`**|Number used for parsing nested tasks when indentation cannot be guessed (file is not opened in editor).|
|decorations|`{...}`|Advanced decoration properties for editor decorations.|
|webview.showCompleted|**`true`**|Whether completed tasks are shown or not in the webview.|
|webview.showRecurringCompleted|**`true`**|Whether recurring completed tasks are shown or not in the webview.|
|webview.showRecurringNotDue|**`true`**|Whether recurring not due tasks are shown or not in the webview.|
|webview.completedStrikeThrough|**`false`**|Whether completed tasks should have a line drawn on them in the webview.|
|webview.autoShowSuggest|**`true`**|Show autocomplete when typing. (When disabled suggest can be called by <kbd>Ctrl</kbd>+<kbd>Space</kbd>)|
|webview.showPriority|**`true`**|Controls whether priority is shown in the webview.|
|webview.customCheckboxEnabled|**`false`**|Whether checkbox is rendered as native input element or a custom styled element.|
|webview.checkboxStyle|`"rounded-square"`|Controls checkbox style (round, square...).|
|webview.fontSize|`"13px"`|Controls font size in the webview.|
|webview.padding|`"0px"`|Controls spacing between items in a list.|
|webview.indentSize|`"1.8em"`|Controls visual indent of nested elements in a webview.|
|webview.fontFamily|`'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'`|Controls font family in the webview.|
|webview.tagStyles|**`{}`**|Set different color for any tag in a webview. `"todomd.webview.tagStyles": { "inbox": { "color": "#000", "backgroundColor": "#00b7ff" } }`|

</details>

## Colors

<details><summary>Colors list</summary>

Can be specified in `settings.json` (**`workbench.colorCustomizations`** section)

- `todomd.tagForeground`
- `todomd.contextForeground`
- `todomd.projectForeground`
- `todomd.invalidDueDateForeground`
- `todomd.invalidDueDateBackground`
- `todomd.notDueForeground`
- `todomd.dueForeground`
- `todomd.overdueForeground`
- `todomd.tagDelimiterForeground`
- `todomd.commentForeground`
- `todomd.priorityAForeground`
- `todomd.priorityBForeground`
- `todomd.priorityCForeground`
- `todomd.priorityDForeground`
- `todomd.priorityEForeground`
- `todomd.priorityFForeground`
- `todomd.closestDueDateForeground`
- `todomd.closestDueDateBackground`
- `todomd.treeViewCompletedTaskIcon`

</details>

## Recommended settings

```js
"window.dialogStyle": "custom",
```

## More Documentation

https://github.com/usernamehw/vscode-todo-md/tree/master/docs/docs.md

## Please upvote the following upstream vscode issues:

- [#32813 \[theming\] Access theme's colors programmatically](https://github.com/microsoft/vscode/issues/32813)
- [#21611 Add option to always show word based suggestions](https://github.com/microsoft/vscode/issues/21611)
- [#54285 Contributed webview context menu actions](https://github.com/microsoft/vscode/issues/54285)
- [#25633 [theming] when completing color keys in settings, fill in current value](https://github.com/microsoft/vscode/issues/25633)
- [#5455 OnClick event on Gutter](https://github.com/microsoft/vscode/issues/5455)