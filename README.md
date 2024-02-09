[![Version](https://img.shields.io/visual-studio-marketplace/v/usernamehw.todo-md)](https://marketplace.visualstudio.com/items?itemName=usernamehw.todo-md)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/usernamehw.todo-md)](https://marketplace.visualstudio.com/items?itemName=usernamehw.todo-md)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/usernamehw.todo-md)](https://marketplace.visualstudio.com/items?itemName=usernamehw.todo-md)

# Todo MD

## ❗ Extension does NOT conform to the [todo.txt](https://github.com/todotxt/todo.txt) spec.

![demo](https://raw.githubusercontent.com/usernamehw/vscode-todo-md/master/img/demo.png)

![webview demo](https://raw.githubusercontent.com/usernamehw/vscode-todo-md/master/img/webview_demo.png)

By default works for files with names `todo.md`, `someday.md` & `todo.archive.md` (Can be configured with `todomd.activatePattern` setting).

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
#tag1 #tag2
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
`f`|Favorite|`{f}`
`due`|Due date|`{due:2020-05-15}`
`overdue`|Oldest overdue date (only for recurring tasks). Added automatically.|`{overdue:2020-05-15}`
`cm`|Completion date|`{cm:2020-05-15}`
`cr`|Creation date|`{cr:2020-05-15}`
`h`|(hidden) Task is not visible in Tree Views and webview (unless due)|`{h}`
`c`|(collapsed) State of folding in Tree View or webview for nested tasks|`{c}`
`count`|Instead of completing the task increases count by 1. When the number matches the goal - the task is considered completed|`{count:0/3}`
`start`|Datetime when task was started|`{start:2021-04-08T16:17:15}`
`duration`|After completing task with `{start}` tag - calculate task duration|`{duration:1h2m}`

### Recurring due date

Recurring due dates should not be archived and their completion state should be reset every day.

```bash
# Recurring due date that is due every monday:
{due:monday}
# Short form:
{due:mon}
# Recurring date that is due every 2nd day (starting date required)
{due:2020-06-28|e2d}
# Recurring date that is due every 2nd month at the 31th (or last day of the month if it has less than 31 days)
{due:2020-02-31|e2m}
# Recurring date that is due every 2nd year at the last day of Feb
{due:2020-02-31|e2y}
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
- `$upcoming` - Task with due date, that is not due (equal to this filter: `-$noDue -$due`)
- `$recurring` - Recurring tasks
- `$hidden` - Task with `{h}` special tag
- `$favorite` - Task with `{f}` special tag
- `$started` - Not completed task with `{start:...}` tag
- `$noDue` - Due date is specified in any way
- `$noProject` - Task with no projects
- `$noTag` - Task with no tags
- `$noContext` - Task with no contexts
- `TEXT_TO_SEARCH` - Search in raw text (anything in the line)
- `"TEXT_TO_SEARCH"` - Search only in task title (not in special entities, like tag or project)
- `-#tag` - (Negation) Task doesn't contain tag `#tag`

<!-- COMMANDS_START -->
## Commands (44)

|Command|Description|
|-|-|
|todomd.toggleComment|Todo MD: Toggle comment. <kbd>Ctrl/Cmd</kbd>+<kbd>/</kbd> (Only when in todo.md file)|
|todomd.toggleTagsTreeViewSorting|Todo MD: Toggle Tags Tree View Sorting|
|todomd.toggleProjectsTreeViewSorting|Todo MD: Toggle Projects Tree View Sorting|
|todomd.toggleContextsTreeViewSorting|Todo MD: Toggle Contexts Tree View Sorting|
|todomd.showWebviewSettings|Todo MD: Show Webview Settings|
|todomd.webview.pickSort|Sort|
|todomd.webview.toggleShowRecurringUpcoming|Todo MD: Toggle setting to show recurring upcoming tasks in webview.|
|todomd.focusTasksWebviewAndInput|Todo MD: Supports arguments {"selectInputText": boolean, "fillInputValue": string}|
|todomd.collapseAllNestedTasks|Todo MD: Collapse all nested tasks.|
|todomd.expandAllTasks|Todo MD: Expand all tasks.|
|todomd.incrementPriority|Todo MD: Increment priority|
|todomd.decrementPriority|Todo MD: Decrement priority|
|todomd.toggleDone|Todo MD: <kbd>Alt</kbd>+<kbd>D</kbd> - Toggle Done (Completion)|
|todomd.hideTask|Todo MD: Hide the Task|
|todomd.deleteTask|Todo MD: Delete the Task|
|todomd.addTaskToDefaultFile|Todo MD: Add a Task to DEFAULT file|
|todomd.addTaskToActiveFile|Todo MD: Add a Task to ACTIVE file|
|todomd.sortByDefault|Todo MD: Sort by Due Date & Priority (default sort)|
|todomd.sortByPriority|Todo MD: Sort by Priority|
|todomd.sortByProject|Todo MD: Sort by Project|
|todomd.sortByTag|Todo MD: Sort by Tag|
|todomd.sortByContext|Todo MD: Sort by Context|
|todomd.sortByCreationDate|Todo MD: Sort by Creation Date|
|todomd.sortByDueDate|Todo MD: Sort by Due Date|
|todomd.sortByCompletionDate|Todo MD: Sort by Completion Date|
|todomd.setDueDate|Todo MD: Helper command to set due date relative to now. [Docs](https://github.com/usernamehw/vscode-todo-md/blob/master/docs/docs.md#set-due-date-helper-function-todomdsetduedate)|
|todomd.setDate|Todo MD: Set date|
|todomd.archiveCompletedTasks|Todo MD: Move completed tasks to Archive file|
|todomd.startTask|Todo MD: Start task (when completed adds `{duration}` special tag)|
|todomd.toggleFavorite|Todo MD: Toggle Favorite (`{f}` special tag).|
|todomd.openDefaultFile|Todo MD: Open default file|
|todomd.openDefaultArchiveFile|Todo MD: Open default Archive file|
|todomd.openSomedayFile|Todo MD: Open Someday file|
|todomd.createSimilarTask|Todo MD: Create similar task (same tags, projects, contexts).|
|todomd.completeTask|Todo MD: Complete a Task|
|todomd.getNextTask|Todo MD: Get due task from main file. If none are due - get one with the highest priority.|
|todomd.getFewNextTasks|Todo MD: Get several tasks. Due tasks are on top.|
|todomd.getRandomTask|Todo MD: Get random task|
|todomd.applyFilterToTreeView|Todo MD: Apply Filter|
|todomd.clearTreeViewFilter|Todo MD: Clear Filter|
|todomd.resetAllRecurringTasks|Todo MD: Reset all Recurring tasks|
|todomd.followLink|Todo MD: Follow link|
|todomd.removeOverdue|Todo MD: Remove overdue|
|todomd.moveToSomeday|Todo MD: Move to Someday file|
<!-- COMMANDS_END -->

<!-- SETTINGS_START -->
## Settings (62)

> **Todo MD** extension settings start with `todomd.`

|Setting|Default|Description|
|-|-|-|
|webview.showCompleted|**true**|Whether completed tasks are shown or not in the webview.|
|webview.completedStrikeThrough|**false**|Whether completed tasks should have a line drawn on them in the webview.|
|webview.showRecurringCompleted|**true**|Whether recurring completed tasks are shown or not in the webview.|
|webview.showRecurringUpcoming|**true**|Whether recurring upcoming (not due) tasks are shown or not in the webview.|
|webview.showPriority|**true**|Controls whether priority is shown in the webview.|
|webview.showCheckbox|**true**|Controls whether checkbox is shown in the webview.|
|webview.showNestedTaskCount|**false**|Controls whether nested tasks indicator (like `0/10`) is shown in the webview.|
|webview.showTaskDetails|**false**|When true - show box on the bottom of the webview that shows selected task details.|
|webview.notificationsEnabled|**false**|When true - show notification after some actions (like task completion) in a webview.|
|webview.fontSize|"15px"|Controls font size in the webview. [CSS Units](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size)|
|webview.fontFamily|"..."|Controls font family in the webview. [CSS Units](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family)|
|webview.lineHeight|**1.4**|Controls line height in the webview.|
|webview.padding|"2px"|Controls top & bottom padding. [CSS Units](https://developer.mozilla.org/en-US/docs/Web/CSS/padding)|
|webview.indentSize|"1.8em"|Controls visual indent of nested elements in a webview.|
|webview.customCheckboxEnabled|**true**|Whether checkbox is rendered as native input element or a custom styled element.|
|webview.autoShowSuggest|**true**|Show autocomplete when typing. (When disabled suggest can be called by `Ctrl`+`Space`)|
|webview.focusFilterInputOnClick|**true**|Focus filter input after clicking(selecting) any task.|
|webview.customCSSPath|""|Absolute path to custom CSS for the webview.|
|webview.tagStyles|\{\}|Set different color for any tag in a webview.|
|defaultFile|""|Absolute path to file that Tree Views or commands use when no editor is open that matches `#todomd.activatePattern#`.<br>[**Pick default file**](command:todomd.specifyDefaultFile). Supports using `${workspaceFolder}` variable substitution.|
|defaultArchiveFile|""|Absolute path to file that all archived tasks will be moved to.<br>[**Pick archive file**](command:todomd.specifyDefaultArchiveFile).  Supports using `${workspaceFolder}` variable substitution.|
|defaultSomedayFile|""|Absolute path to file that is used as the "someday" file.<br>[**Pick someday file**](command:todomd.specifyDefaultSomedayFile)|
|durationIncludeSeconds|**false**|When enabled - duration (editor, hover) includes seconds.|
|autoArchiveTasks|**false**|When enabled - will move tasks to archive file (on completion).|
|confirmTaskDelete|"always"|Show confirmation when deleting task from Tree View or Webview.|
|activatePattern|"\*\*/\{todo,someday,todo.archive\}.md"|Choose files that extension will operate on. By default activated on 3 files (todo.md, someday.md & todo.archive.md). Uses [Glob](https://code.visualstudio.com/docs/editor/glob-patterns). Examples:<br>Activate on any (.txt) file - `**/*.txt`.<br>Activate only on single file (todo.txt) - `**/todo.txt`<br>Activate on 2 files (todo.txt or task.txt) - `**/{todo,task}.txt`|
|getNextNumberOfTasks|**5**|Number of tasks returned by `getFewNextTasks` command.|
|sortTagsView|"alphabetic"|Controls tags Tree View sorting.|
|sortProjectsView|"alphabetic"|Controls projects Tree View sorting.|
|sortContextsView|"alphabetic"|Controls contexts Tree View sorting.|
|sortNestedTasks|"default"|Controls nested tasks sorting in Tree Views.|
|suggestItems|\{\}|This extension will only autocomplete tags/projects/contexts located in **1** file. This setting allows you to add items and their description(markdown) to autocomplete in all files (where extension is active). Examples: `#tag`, `+project`, `@context`.|
|counterBadgeEnabled|**false**|Shows small badge to show a number of times the tag/project/context is present in the active document.|
|progressChartEnabled|**true**|Controls whether editor nested task decoration (pie chart) is shown or not.|
|progressBackground|"\#c6cdd3"|Editor decoration for nested tasks progress (pie chart) background.|
|progressForeground|"\#0077AA"|Editor decoration for nested tasks progress (pie chart) foreground.|
|mainStatusBarItem|{...}|Configure appearance/behavior of main status bar item (shows next task to complete).|
|progressStatusBarItem|{...}|Configure appearance/behavior of the progress status bar item (shows only when active text editor matches `#todomd.activatePattern#`) with text format: `1/3 33%`.|
|addCreationDate|**false**|When creating a task add creation date to it: `{cr:2020-04-30}`|
|completionDateIncludeDate|**true**|Whether to include date when completing a task: `{cm}` vs `{cm:2020-04-30}`|
|completionDateIncludeTime|**false**|When completing a task add date and time: `{cm:2020-04-30T09:11:17}`|
|creationDateIncludeTime|**false**|When creating a task add date and time: `{cr:2020-04-30T09:11:17}`|
|closestDueDateIncludeWeekday|**false**|When enabled - editor decoration that shows number of days to the due date adds the weekday name.|
|autoBumpRecurringOverdueDate|**false**|When completing overdue recurring task - replace the starting date with today's date.|
|isDev|**false**|For emulating dev mode. Most likely of no use to anyone, except the extension author.|
|tabSize|**4**|Number used for parsing nested tasks when indentation cannot be guessed (file is not opened in editor).|
|savedFilters|\[\]|Filters that you can pick when applying a filter.|
|treeViews|\[\]|Add more tree views with predefined filters.|
|treeView.showBadge|**true**|Whether or not to show due tasks counter badge for tree view container.|
|treeView.useVscodeCheckboxApi|**true**|When checked - will use vscode api to show checkboxes https://github.com/microsoft/vscode/issues/116141.|
|labelDueSymbol|"📗&nbsp;"|Prefix for task that is due in labels (tree view, notification, modal, quick pick).|
|labelNotDueSymbol|"📅&nbsp;"|Prefix for task that that is not due in labels (tree view, notification, modal, quick pick).|
|labelOverdueSymbol|"📕&nbsp;"|Prefix for task that is overdue in labels (tree view, notification, modal, quick pick).|
|labelInvalidDueSymbol|"🟣&nbsp;"|Prefix for task that has invalid due date in labels (tree view, notification, modal, quick pick).|
|labelFavorite|"&nbsp;❤️&nbsp;"|Label shown when task has favorite `{f}` special tag. (tree view, notification, modal, quick pick)|
|labelShowItems|**true**|Show projects/tags/contexts in labels (tree view, notification, modal, quick pick).|
|useBoldTextInLabels|**true**|Show projects/tags/contexts in labels in **BOLD**.|
|completedStrikeThrough|**true**|Show strike-through text decoration for completed tasks in editor.|
|setDueDateThisWeekDay|"Friday"|Week day when using set due date command or suggest `SET_DUE_THIS_WEEK`.|
|setDueDateNextWeekDay|"Friday"|Week day when using set due date command or suggest `SET_DUE_NEXT_WEEK`.|
|commentFormat|\{"start":"\# ", "end":""\}|Choose comment symbols (only works at the beginning of the line).|
|decorations|{...}|Advanced text editor decoration tweaking. [docs](https://github.com/usernamehw/vscode-todo-md/blob/master/docs/docs.md#advanced-editor-decorations)|
<!-- SETTINGS_END -->

<!-- COLORS_START -->
## Colors (21)

Can be specified in `settings.json` (**`workbench.colorCustomizations`** section)

|Color|Dark|Light|HC|Description|
|-|-|-|-|-|
|todomd.favoriteTaskBackground|`#f62caf18`|`#f62caf18`|`#f62caf18`|Entire line background color for favorite tasks `{f}`.|
|todomd.commentForeground|`#b4b4b4`|`#b4b4b4`|`#b4b4b4`|Color of comments `# Comment`|
|todomd.priorityAForeground|`#ec4f47`|`#ec4f47`|`#ec4f47`|`(A)`|
|todomd.priorityBForeground|`#fd9f9a`|`#fd9f9a`|`#fd9f9a`|`(B)`|
|todomd.priorityCForeground|`#ffb039`|`#ffb648`|`#ffb648`|`(C)`|
|todomd.priorityDForeground|`#e2cb00`|`#f1d900`|`#f1d900`|`(D)`|
|todomd.priorityEForeground|`#97c500`|`#ace000`|`#ace000`|`(E)`|
|todomd.priorityFForeground|`#00cfad`|`#00cfad`|`#00cfad`|`(F)`|
|todomd.tagForeground|`#1abaff`|`#029cdf`|`#1abaff`|Tag color `#Tag`|
|todomd.contextForeground|`#7284eb`|`#7284eb`|`#7284eb`|Context color `@Context`|
|todomd.specialTagForeground|`#c3ccfc`|`#7e8081`|`#c3ccfc`|Color of special tags `{h}`|
|todomd.projectForeground|`#36cc9a`|`#36cc9a`|`#36cc9a`|Project color `+Project`|
|todomd.notDueForeground|`#c3ccfc`|`#7e8081`|`#c3ccfc`|Not due|
|todomd.dueForeground|`#35c03a`|`#01c208`|`#37df3d`|Due|
|todomd.overdueForeground|`#d44343`|`#d44343`|`#f64f4f`|Overdue|
|todomd.invalidDueDateForeground|`#ffffff`|`#ffffff`|`#ffffff`|Due date that is either has an invalid format `2020-05` or an invalid date `2020-12-35`|
|todomd.invalidDueDateBackground|`#7284eb`|`#7284eb`|`#7284eb`|Due date that is either has an invalid format `2020-05` or an invalid date `2020-12-35`|
|todomd.nestedTasksCountBackground|`#e0d971`|`#f7f3c099`|`#e0d971`|Nested tasks counter editor decoration background.|
|todomd.nestedTasksCountForeground|`#000000`|`#000000`|`#000000`|Nested tasks counter editor decoration foreground.|
|todomd.nestedTasksCountBorder|`#fff0`|`#dfd987bd`|`#fff0`|Nested tasks counter editor decoration border.|
|todomd.treeViewCompletedTaskIcon|`#7cc54b`|`#7cc54b`|`#7cc54b`|Color of completed task icon in Tree View.|
<!-- COLORS_END -->

## More Documentation

https://github.com/usernamehw/vscode-todo-md/tree/master/docs/docs.md

## Please upvote the following upstream vscode issues:

- [#97190 Provide some richer (optional) UI for custom tree views](https://github.com/microsoft/vscode/issues/97190)
- [#32813 Access theme's colors programmatically](https://github.com/microsoft/vscode/issues/32813)
- [#115365 Allow TreeItem.label to support MarkdownString](https://github.com/microsoft/vscode/issues/115365)
- [#21611 Add option to always show word based suggestions](https://github.com/microsoft/vscode/issues/21611)
- [#85682 Api for editor insets](https://github.com/microsoft/vscode/issues/85682)
- [#32856 Inline text adornments break word wrapping](https://github.com/microsoft/vscode/issues/32856)
- [#25633 When completing color keys in settings, fill in current value](https://github.com/microsoft/vscode/issues/25633)
- [#5455 OnClick event on Gutter](https://github.com/microsoft/vscode/issues/5455)