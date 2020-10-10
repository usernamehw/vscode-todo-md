## 2.0.3 `10 Oct 2020`

- ✨ **[webview]** Add task dialog
- ✨ **[webview]** Reuse filter logic from extension
- ✨ **[webview]** Add constant filters to autocomplete

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
