## 2.4.0 `07 Feb 2021`

- ✨ [webview] Change inline code style
- ✨ [webview] Add Reveal to context menu
- ✨ [webview] Add button styled link `[btn:But](https://www.google.com)`
- ✨ [editor] Advanced decorations: add completed task
- ✨ Calculate and show number of days the task is overdue in webview and in hover
- ✨ Show text of deleted tasks in task deletion confirmation dialog
- 💥 Remove defaultPriority setting

## 2.3.1 `20 Jan 2021`

- 🐛 Update everything after executing collapse/expand all

## 2.3.0 `20 Jan 2021`

- ✨ [webview] Collapse All / Expand All (alt) icon
- ✨ [webview] Add visual indent size config `todomd.webview.indentSize`
- ✨ Archive task also archives nested tasks
- ✨ Toggle completion for multiple selected tasks
- ✨ Add priority colors to advanced decorations
- 💥 Set due date function removes `{overdue}` tag & adds to the end of the line instead of the start
- 💥 Get random task no longer starts with due tasks

## 2.2.7 `21 Dec 2020`

- ✨ Hover: Show due date icon and count special tag
- ✨ Add option `confirmTaskDelete` with values: [`always`, `never`, `hasNestedTasks`]
- ✨ Setting to hide status bar task counter
- ✨ Add ability to use advanced decorations for due date

## 2.2.6 `11 Dec 2020`

- ✨ [Tree View] Use markdown hover

## 2.2.5 `20 Nov 2020`

- ✨ [Tree View] tag/context/project should render nested tasks
- 🐛 [webview] Add a task icon should use active file instead of default
- 🐛 [editor] Autocomplete tag/context/project should honor word prefix

## 2.2.4 `18 Nov 2020`

- 💥 [webview] Remove `markdownEnabled` setting
- ✨ [webview] Add first version of context menu
- ✨ [Tree View] Show icon for completed tasks

## 2.2.3 `16 Nov 2020`

- 🐛 [webview] Try to fix Up/Down arrow conflicts of suggest and selection
- ✨ Set due date helper - support recurring date of the format `e2d`

## 2.2.2 `10 Nov 2020`

- ✨ Filter: Double quotes to search only in task title
- ✨ [webview] <kbd>Delete</kbd> key to delete selected task
- 🐛 [webview] Up/Down arrows should not cause scrolling

## 2.2.1 `09 Nov 2020`

- ✨ [webview] Add task selection <kbd>↓</kbd>, <kbd>↑</kbd>, <kbd>LMouseButton</kbd>
- ✨ [webview] Toggle collapsed state of nested tasks <kbd>→</kbd>
- ✨ [webview] Toggle selected task completion <kbd>Alt</kbd>+<kbd>D</kbd>

## 2.2.0 `06 Nov 2020`

- 🔨 [webview] Use Vue framework
- 💥 [webview] Enable markdown rendering by default
- ✨ [webview] Allow to change tag colors (targeted by tag name) `todomd.webview.tagStyles`

## 2.1.2 `01 Nov 2020`

- ✨ [webview] Option to prevent autocomplete popping up `todomd.webview.autoShowSuggest`. (When disabled suggest can be called by <kbd>Ctrl</kbd>+<kbd>Space</kbd>)
- ✨ [webview] Add option to hide recurring tasks that are not due `todomd.webview.showRecurringNotDue`
- ✨ [webview] <kbd>Ctrl</kbd>+<kbd>Click</kbd> on tag/project/context adds it to filter instead of replacing
- ✨ [Tree View] Deleting a task that has subtasks now showing modal dialog to choose whether to delete all nested tasks or not
- ✨ When task has multiple links `followLink` should show a Quick Pick to choose which one of the links to open

## 2.1.1 `29 Oct 2020`

- ✨ [webview] Show nested tasks
- ✨ [webview] Save collapsed state of nested tasks

## 2.1.0 `28 Oct 2020`

- ✨ [Tree View] Show nested tasks

## 2.0.14 `25 Oct 2020`

- ✨ Set due date from autocomplete (using `$` sign at the end of the word)
- ✨ [webview] Add option to strike-through completed tasks
- 💥 [Tree View] Remove toggle done from context menu (There's still an inline button)
- 🐛 Fix some cases of date validation

## 2.0.13 `23 Oct 2020`

- ✨ Set due date helper - closest future date by month+date (e.g. `nov 20`)
- ✨ [webview] Style tweaks

## 2.0.12 `21 Oct 2020`

- 💥 Remove due date as range
- ✨ Set due date helper - closest future day of the week (e.g. `fri`)
- ✨ Reset recurring tasks should be working separately for every file

## 2.0.11 `19 Oct 2020`

- ✨ Set due date helper - support date as single number without signs (e.g. `20`)
- ✨ Show day of week and date diff in set due date helper
- ✨ [webview] Completed task should have different background

## 2.0.10 `17 Oct 2020`

- ✨ Add command to toggle comment
- ✨ Closest due date editor decoration - prepend short name of the day of the week (e.g. Sun)
- ✨ Set due date command should support adding/subtracting weeks (e.g. `+2w`)

## 2.0.9 `16 Oct 2020`

- ✨ [webview] Add welcome page asking to fill out default path when it's not defined
- ✨ Add hover for editor
- 🐛 Default sort no longer filters out not due items

## 2.0.8 `15 Oct 2020`

- ✨ Add option `webview.showRecurringCompleted`
- ✨ Show percentage of completed tasks in status bar
- 🔨🐛 Various bug fixes and refactorings

## 2.0.7 `14 Oct 2020`

- ✨ [webview] Try rendering tasks as markdown
- ✨ Filter should support multiple tag syntax: `#html#css`
- 🐛 [webview] Fix links replacing sometimes leaving text

## 2.0.6 `13 Oct 2020`

- 💥 Default priority is now `G`
- ✨ Add commands to increment/decrement priority
- 🐛 Fix when extension tries to use the wrong document

## 2.0.5 `12 Oct 2020`

- ✨ [webview] Allow changing font family
- ✨ [webview] Add first version of custom checkbox
- ✨ Add open default file icon to Tree Views

## 2.0.4 `11 Oct 2020`

- 🔨 Use fuzzysort instead of fuzzysearch (bc fuzzysearch doen't support highlighting)

## 2.0.3 `10 Oct 2020`

- ✨ [webview] Add task dialog
- ✨ [webview] Reuse filter logic from extension
- ✨ [webview] Add constant filters to autocomplete

## 2.0.2 `09 Oct 2020`

- 🐛 Remove aggressive notification when switching editors

## 2.0.1 `09 Oct 2020`

- 🐛 Remove markdown hover form Tree View

## 2.0.0 `09 Oct 2020`

- 💥 Version `2.0.0` does NOT mean that this extension is stable
- 💥 `{link:}` special tag is deprecated. Links should be now automatically parsed from the document
- ✨ Add Webview View with tasks from the default file (first version)
- ✨ Hide the Task from context menu in the Tree View
- ✨ Delete the Task from context menu in the Tree View
- ✨ Invalid due date highlighted with background instead of foreground

## 0.0.19 `17 Aug 2020`

- ✨ Add invalid due date state (highlighted in orange)
- ✨ Create special comment that adds tags to all tasks after it [#5](https://github.com/usernamehw/vscode-todo-md/issues/5)

## 0.0.18 `12 Aug 2020`

- ✨ Allow advanced decorations for comments
- ✨ Show prompt with date when setting due date via input box

## 0.0.17 `25 Jul 2020`

- 🔨 Refactor a bit
- ✨ Advanced decoration tweaking [#4](https://github.com/usernamehw/vscode-todo-md/issues/4)

## 0.0.16 `18 Jul 2020`

- ✨ Use different Activity Bar icon
- ✨ Use new event `onStartupFinished` to not take time from editor startup

## 0.0.15 `28 Jun 2020`

- ✨ Update Tree Views on startup
- 📚 Document recurring due dates

## 0.0.14 `27 Jun 2020`

- Republish extension to marketplace

## 0.0.13 `18 May 2020`

- ✨ Show closest due date as decoration
- ✨ Add archived tasks Tree View

## 0.0.12 `12 May 2020`

- 🐛 Fix complete a task doesn't work

## 0.0.11 `11 May 2020`

- 💥 Remove the setting and always use local time
- ✨ Set relative due date command
- ✨ Filter for priority more or less `>$C`

## 0.0.10 `10 May 2020`

- ✨ Create similar task
- ✨ Add creation date
- ✨ Due date as range
- ✨ Configure number of tasks for get a few next tasks command

## 0.0.9 `08 May 2020`

- ✨ Get next 10 tasks command
- ✨ Show filter value in Tree View title
- ✨ Populate Tree Views from the main file
- ✨ Add context menu item to archive selected completed

## 0.0.8 `07 May 2020`

- 💥 Set addCompletionDate to **true**
- ✨ Add `link` special tag
- ✨ Add `defaultPriority` config
- ✨ Add `savedFilters` config

## 0.0.7 `06 May 2020`

- 💥 Change priority colors and names and delete the 7th one
- ✨ Add `t` (threshold) special tag
- ✨ Add `h` (hidden) special tag

## 0.0.6 `05 May 2020`

- ✨ Add archive selected completed tasks command
- ✨ Get random task command

## 0.0.5 `04 May 2020`

- ✨ Add `count` special tag:value pair
- ✨ Add an option to include time to completion date
- Start working on filter feature

## 0.0.4 `02 May 2020`

- 💥 When `addCompletionDate` enabled - done symbol `x ` is not inserted
- ✨ Try to add TODAY item as completion
- ✨ Use local date/time
- ✨ Allow changing color of comments

## 0.0.2 / 0.0.3 `01 May 2020`

- ✨ Uncomplete task should remove completion date
- ✨ Sort selected tasks by priority
- ✨ Show number of completed tasks in status bar

## 0.0.1 `30 Apr 2020`

- Initial release
