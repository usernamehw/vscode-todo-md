## ❗ Extension does not conform to the [todo.txt](https://github.com/todotxt/todo.txt) spec.
## ❗ Extension is in Alpha phase

![demo](https://raw.githubusercontent.com/usernamehw/vscode-todo-md/master/img/demo.png)

By default works for files with names `todo.md` & `todo.archive.md` (But can be changed with `activatePattern` setting).

# Features

## Projects

```
+Project
```

Nested projects are ok `+Project\nested` but at the same time they do not get treated differently in any way (At least not yet).

## Context

```
@context
```

## Tags

```
#tag1#tag2
```

## Priority

Priority is a single UPPERCASE letter surrounded by round brackets. It can be (A-Z). Only the first 7 (A-G) have unique colors though.

```
(A)
```

## Special tag:value pairs

```
{due:2020-04-30}
```

List of special tags:

|tag | description | example|
--- | --- | --- |
|`due` | Due date| |
|`cm` | Completion date| |
|`count` | Instead of completing the task increases count by 1. When the number matches the goal - the task is considered completed| `{count:0/3}`|

<!-- - ❌ id (UUID)
- ❌ id/p (dependent task / blocked task?)
- ❌ t (threshold)
- ❌ rec (Recurrence)
- ❌ h (hide)
- ❌ f/star (favorite/starred)
- ❌ url/link
- ❌ count (count Finish a task and re-enter it with a decreased count, so that you can easily keep track of items.)
- ❌ e (effort)
- ❌ note
- ❌ cr - (creation date) -->

## Comments

Comment is not considered a task. It starts with a sharp sign `#` followed by a space.

```
# comment
```

# Commands

- `todomd.toggleDone` <kbd>Alt</kbd>+<kbd>D</kbd> - Toggle Done (Completion)

# Settings

|Name|Default|Description|
| --- | --- |--- |
|activatePattern|`"**/{todo,todo.archive}.md"`|Choose files that extension will operate on. By default activated on 2 files (`todo.md` & `todo.archive.md`). This format is called `Glob`. Examples:<br>Activate on any (.txt) file - `**/*.txt`.<br>Activate only on single file (todo.txt) - `**/todo.txt`<br>Activate on 2 files (todo.txt or task.txt) - `**/{todo,task}.txt`|
|addCompletionDate|**false**|When completing a task add completion date to it: `{cm:2020-04-30}`|
|completionDateIncludeTime|**false**|When `addCompletionDate` setting enabled, includes time time: `{cm:2020-04-30T09:11:17}`|
|useLocalDateTime|**true**|Calculate offset from UTC to use local date/time.|
|todomd.projects|[]|Projects added to autocomplete.|
|todomd.contexts|[]|Contexts added to autocomplete.|
|todomd.tags|[]|Tags added to autocomplete.|
|treeViews|[...]|Tree Views that have predefined filters|

# Colors

- `todomd.tagForeground`
- `todomd.contextForeground`
- `todomd.projectForeground`
- `todomd.notDueForeground`
- `todomd.dueForeground`
- `todomd.overdueForeground`
- `todomd.tagDelimiterForeground`
- `todomd.commentForeground`
- `priority1Foreground`
- `priority2Foreground`
- `priority3Foreground`
- `priority4Foreground`
- `priority5Foreground`
- `priority6Foreground`
- `priority7Foreground`

## Please upvote the following upstream vscode issues:

- [#83911 Support WebViews in extension contributed custom views](https://github.com/microsoft/vscode/issues/83911)
- [#32813 \[theming\] Access theme's colors programmatically](https://github.com/microsoft/vscode/issues/32813)