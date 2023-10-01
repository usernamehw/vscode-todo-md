## 2.26.0 `30 Sep 2023`

- ✨ [Tree View] Add filter constants autocomplete when applying filter via Quick Pick
- ✨ Change emoji for Favorite and Not Due labels
- ✨ [Tree View] Update Archived tree view when typing in archived text editor
- ✨ [status bar] Highlight main status bar (`highlightOverdue/highlightDue` properties on `todomd.mainStatusBarItem` setting)
- ✨ [status bar] Truncate main status bar message (`truncate` property on `todomd.mainStatusBarItem` setting)
- 🐛 [Tree View] Properly update welcome view state on Archived tree view path change
- 💥 [webview] Enable `gfm` GitHub Flavored Markdown for markdown rendering in webview

## 2.25.0 `22 Sep 2023`

- ✨ [status bar] Add more control over main status bar item (`todomd.mainStatusBarItem` setting) - enabled/hoverEnabled/alignment/priority/onClick/targetTasks
- ✨ [webview] Tweak CSS styles
- ✨ [Tree View] Add welcome message for Archived Tree View to set file path if needed
- 🐛 [editor] Only draw overdue decoration when task is not completed
- 💥 [Tree View] Change default order of Views
- 💥 [editor] Disable text counter badge decoration by default (`todomd.counterBadgeEnabled` setting)
- 💥 [status bar] Disable counter (now named progress) status bar item by default (`todomd.progressStatusBarItem` setting)
- 💥 [webview] Disable nested task count by default (`todomd.webview.showNestedTaskCount` setting)

## 2.24.0 `22 Jul 2023`

- ✨ [Tree View] Use vscode checkbox api (`"todomd.treeView.useVscodeCheckboxApi"` setting)

## 2.23.0 `22 Mar 2023`

- ✨ [editor] Show more info on due date hover
- ✨ [webview] Tweak context menu style
- ✨ [webview] Allow `<video>` tag (from https)
- ✨ [webview] New setting to focus filter input on every task selection change `"todomd.webview.focusFilterInputOnClick"`
- 🐛 Fix `command:` & `app:///` links not working in Quick Pick (`todomd.completeTask`)

## 2.22.0 `27 Jan 2023`

- ✨ [webview] Select closest task after completing a task (if completed task gets hiden)
- ✨ [editor] Setting to control editor pie chart visibility `"todomd.progressChartEnabled"`
- 🐛 Nested tasks show in correct order in `todomd.completeTask` Quick Pick
- 💥 [editor] Don't add whitespace after accepting tag/project/context suggest completion

## 2.21.0 `25 Nov 2022`

- ✨ Add filters from `"todomd.savedFilters"` setting to webview autocomplete
- 🐛 Fix webview autocomplete for multiple filters

## 2.20.0 `20 Nov 2022`

- ✨ [webview] Add task or subtask in modal dialog <kbd>Insert</kbd> or <kbd>Ctrl</kbd>+<kbd>Insert</kbd>
- 🐛 Minor bug fixes

## 2.19.0 `09 Nov 2022`

- ✨ Recurring monthly/yearly due date `{due:2023-01-31|e1m}` [#67](https://github.com/usernamehw/vscode-todo-md/issues/67)
- ✨ More unified closest due date format in webview and editor input hover
- ✨ [webview] Toggle hidden status from context menu
- 🐛 Fix recurring due date being due even before starting date
- 🐛 Fix nested tasks not moved to archive file
- 🐛 [webview] Fix autocomplete not showing when using negation sign `-`
- 🐛 Show `>100` sign istead of `+100` when due date is in the future (not calculated)

## 2.18.0 `20 Oct 2022`

- ✨ Tree View counter badge for due tasks
- ✨ `{noOverdue}` special tag
- ✨ Label for not due task
- ✨ Show favorite status in labels
- 🐛 Only show sorting commands when todomd file is opened

## 2.17.0 `18 Jul 2022`

- ✨ [editor] Advanced editor decorations: allow targeting a specific project/tag/context [docs](https://github.com/usernamehw/vscode-todo-md/blob/master/docs/docs.md#advanced-editor-decorations)
- 🐛 [Tree View] Applying filter should change counter/percentage in title
- 🔨 [editor] Toggle done for multiple tasks should be done in one edit
- 🔨 Minor tweaks and refactoring

## 2.16.0 `15 Jul 2022`

- ✨ Someday file, move to someday command `todomd.moveToSomeday`
- ✨ Bind <kbd>Ctrl/Cmd</kbd>+<kbd>/</kbd> to toggle comments
- ✨ Replace `$hasDue` filter with `$noDue`; Add `$upcoming` filter
- ✨ Sort not due tasks above tasks without due date
- ✨ [webview] Deprioritize unmatched nested filtered tasks instead of removing them
- 🔨 [webview] Don't use background for favorite task

## 2.15.1 `07 Jul 2022`

- ✨ [webview] Show favorite icon
- ✨ [Tree View] Show completed percentage in title
- 🐛 Minor bug fixes

## 2.15.0 `05 Jul 2022`

- ✨ Add `{f}` (Favorite special tag), `$favorite` filter
- ✨ [editor] Command to remove overdue from selected lines
- 🔨 Tweak colors (due decoration is green)

## 2.14.0 `28 Jun 2022`

- ✨ [editor] Show problems as diagnostics (duplicated tag/project/context, invalid due date)
- ✨ Add `$hidden` filter
- ✨ Rename setting `tagCounterBadgeEnabled` to `counterBadgeEnabled` and show counter badge for project/context also
- 🐛 [editor] Fix illigal range edit when the line is empty

## 2.13.0 `25 Jun 2022`

- 💥 Tags without spaces in between - deprecated
- ✨ Filter also searches in subtasks [PR 57](https://github.com/usernamehw/vscode-todo-md/pull/57) by [dustinsterk](https://github.com/dustinsterk)
- ✨ [Tree View] Add inline button to complete task to Tags/Projects/Contexts #53
- ✨ [webview] Autocomplete shows for secondary filters #50
- 🐛 Remove extra whitespace added by document edits

## 2.12.1 `21 Jun 2022`

- 🐛 Minor bug fixes

## 2.12.0 `09 Jun 2022`

- 🔨 Refactor webview: Vue 2 => Vue 3
- ✨ Add setting `"todomd.autoBumpRecurringOverdueDate"`
- 🐛 Fix wrong setting used for status bar item

## 2.11.0 `06 May 2022`

- ✨ Editor hover shows other tasks with the same [project, tag, context]
- ✨ Sort by [due date, creation date, completion date, project, tag, context]
- ✨ Editor context submenu with some of the extension commands
- ✨ Support multi-cursor/selection for commands: [increment/decrement priority, set due date, start]
- ✨ Show closest due date in hover for non-due tasks
- ✨ Inline button to complete a task from the Quick Pick (`todomd.completeTask`)

## 2.10.0 `28 Apr 2022`

- ✨ Add badge decoration in editor showing tag count #46
- ✨ Add status bar item that shows due task `"todomd.statusBarMainEnabled": true,`
- ✨ Add completions in editor for `THIS_WEEK`, `NEXT_WEEK` and weekdays `SET_DUE_MONDAY`, ...
- 🐛 Fix problem when decorations activated on non-todomd file

## 2.9.2 `10 Mar 2022`

- ✨ Ignore yaml frontmatter header
- ✨ Use bold font weight for priority decoration
- ✨ Sort not due tasks above tasks without due date
- 💥 Remove `sortTaskParts` command

## 2.9.1 `06 Feb 2022`

- ✨ Use inline buttons in `todomd.completeTask` command
- 🐛 Update initial webview content only after its loaded
- 🐛 fix `todomd.webview.tagStyles` setting

## 2.9.0 `14 Nov 2021`

- ✨ Keep order of projects/tags/contexts in labels + webview #36
- ✨ Add setting to disable bold projects/tags/contexts in labels #37
- ✨ Add option to hide pie chart [b269ec57](https://github.com/usernamehw/vscode-todo-md/commit/b269ec574fa4d3248e75a85e282a660f89256534)

## 2.8.2 `02 Aug 2021`

- ✨ Show nested count in editor decoration #33

## 2.8.1 `31 Jul 2021`

- 💥 Remove colors `closestDueDateForeground` & `closestDueDateBackground`
- ✨ Show overdue in days in editor decoration
- ✨ Change style for closest due date editor decoration
- ✨ Add setting to disable strike-through decoration in editor for completed tasks `todomd.completedStrikeThrough`
- ✨ Allow advanced decorations for tags
- ✨ Add projects & contexts to labels (`todomd.labelShowItems` setting)
- ✨ Complete task command - add 2 buttons (follow link & reveal task)

## 2.8.0 `22 Jul 2021`

- 💥 Merge 3 autocomplete settings into 1 , show markdown description defined by user. #32
- ✨ Add setting `todomd.completionDateIncludeDate`
- ✨ Show tags in labels. Setting `todomd.labelShowTag`
- ✨ Show due prefix in labels. Settings: `todomd.labelDueSymbol`, `todomd.labelOverdueSymbol`, `todomd.labelInvalidDueSymbol`

## 2.7.1 `03 Jul 2021`

- 🐛 Trigger active editor event on settings change to update the state
- ✨ Collapse Tree Views on first extension install
- 🔨 [webview] Refactor CSS

## 2.7.0 `19 Jun 2021`

- ✨ [editor] Document highlight provider for tag/project/context
- ✨ [editor] Rename provider for tag/project/context
- ✨ [editor] Reference provider for tag/project/context
- ✨ [editor] Add special tag autocomplete
- ✨ [editor] Add whitespace after autocomplete for tag/project/context
- ✨ [webview] Setting to add custom css to webview `webview.customCSSPath`

## 2.6.2 `12 Jun 2021`

- 🐛 [webview] Fix codicons not loading in **1.57.0**
- ✨ [webview] <kbd>F2</kbd> Opens task details instead of a modal dialog
- 🐛 [Tree View] Fix reveal in file for archived tree view
- ✨ [Tree View] Sort nested tasks
- ✨ [editor] Sort task parts inside one line `todomd.sortTaskParts`

## 2.6.1 `04 May 2021`

- ✨ [Tree View] Sort tags/projects/contexts alphabetically (1st level); Add icon to toggle sorting (alphabetic, count)
- ✨ [webview] Setting to hide the checkbox
- 🐛 Autocomplete should take items even from nested tasks
- 💥 Remove `archiveSelectedCompletedTasks` command; sort and archive commands now use selected lines or entire document if no lines are selected.

## 2.6.0 `08 Apr 2021`

- 💥 Remove `{t}` special tag
- 💥 Remove `doneSymbol`, `addCompletionDate` settings
- 💥 Rename `showRecurringNotDue` to `showRecurringUpcoming`
- ✨ [Due Tree View] Use default sorting (by due)
- ✨ [webview, Tree View] add `Start` context menu (track how much time it took)
- ✨ [webview] Sort upcoming (non due) tasks by due
- ✨ [webview] Tasks have second sorting by priority (first by due)
- ✨ [webview] Add Set Due date context menu

## 2.5.3 `05 Mar 2021`

- 🐛 Again, active document is wrong, but this time after switching to Untitled file...
- ✨ [editor] Add default sort (by due date)
- 💥 Rename webview config `webview.completionNotificationEnabled` to `webview.notificationsEnabled`

## 2.5.2 `27 Feb 2021`

- 🐛 Again, active document is wrong after closing the file
- ✨ [webview] Option to show notification after task completion

## 2.5.1 `26 Feb 2021`

- 🐛 Active document is wrong after closing file

## 2.5.0 `26 Feb 2021`

- ✨ [webview] Automatically select first task
- ✨ [webview] Show nested tasks count indicator
- ✨ [webview] <kbd>Alt</kbd>+<kbd>Click</kbd> on twistie(folding icon) to recursively collapse/expand
- ✨ [webview] Show closest due date for future tasks
- ✨ [webview] Edit selected task by pressing <kbd>F2</kbd>
- ✨ [webview] New setting to control `line-height`
- ✨ New filter `$hasDue` - if due date is specified
- 💥 [webview] Delete selected task hotkey is <kbd>Shift</kbd> + <kbd>Delete</kbd> now

## 2.4.1 `19 Feb 2021`

- ✨ [webview] Tweak some styles
- 💥 [webview] Remove custom checkbox different options and make custom checkbox a default

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

- 🔨 Republish extension to marketplace

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

- 🔨 Initial release
