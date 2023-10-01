import { commands, TextEditor, TextEditorEdit, window } from 'vscode';
import { addTaskToActiveFile } from './commands/addTaskToActiveFile';
import { addTaskToActiveFileWebview } from './commands/addTaskToActiveFileWebview';
import { addTaskToDefaultFile } from './commands/addTaskToDefaultFile';
import { applyFilterToTreeViewCommand } from './commands/applyFilterToTreeView';
import { archiveCompletedTasks } from './commands/archiveCompletedTasks';
import { clearGlobalState } from './commands/clearGlobalState';
import { clearTreeViewFilter } from './commands/clearTreeViewFilter';
import { collapseAllNestedTasks } from './commands/collapseAllNestedTasks';
import { completeTask } from './commands/completeTask';
import { createSimilarTask } from './commands/createSimilarTask';
import { decrementPriority } from './commands/decrementPriority';
import { deleteTask } from './commands/deleteTask';
import { expandAllNestedTasks } from './commands/expandAllNestedTasks';
import { focusTasksWebviewAndInput } from './commands/focusTasksWebviewAndInput';
import { followLinkCommand } from './commands/followLinkCommand';
import { getFewNextTasksCommand } from './commands/getFewNextTasks';
import { getNextTask } from './commands/getNextTask';
import { getRandomTask } from './commands/getRandomTask';
import { goToLine } from './commands/goToLine';
import { goToLineInArchived } from './commands/goToLineInArchived';
import { hideTask } from './commands/hideTask';
import { incrementPriority } from './commands/incrementPriority';
import { mainStatusBarCommand } from './commands/mainStatusBarCommand';
import { moveToSomeday } from './commands/moveToSomeday';
import { openDefaultArchiveFile } from './commands/openDefaultArchiveFile';
import { openDefaultFile } from './commands/openDefaultFile';
import { openSomedayFile } from './commands/openSomedayFile';
import { removeAllOverdue } from './commands/removeAllOverdue';
import { removeOverdue } from './commands/removeOverdue';
import { resetAllRecurringTasksCommand } from './commands/resetAllRecurringTasks';
import { setDueDate } from './commands/setDueDate';
import { setDueDateWithArgs } from './commands/setDueDateWithArgs';
import { setLastVisit } from './commands/setLastVisit';
import { showGlobalState } from './commands/showGlobalState';
import { showWebviewSettings } from './commands/showWebviewSettings';
import { specifyDefaultArchiveFileCommand } from './commands/specifyDefaultArchiveFile';
import { specifyDefaultFileCommand } from './commands/specifyDefaultFile';
import { specifyDefaultSomedayFileCommand } from './commands/specifyDefaultSomedayFile';
import { startTask } from './commands/startTask';
import { toggleComment } from './commands/toggleComment';
import { toggleContextsTreeViewSorting } from './commands/toggleContextsTreeViewSorting';
import { toggleDone } from './commands/toggleDone';
import { toggleFavoriteTask } from './commands/toggleFavoriteTask';
import { toggleProjectsTreeViewSorting } from './commands/toggleProjectsTreeViewSorting';
import { toggleTagsTreeViewSorting } from './commands/toggleTagsTreeViewSorting';
import { webviewToggleShowRecurringUpcoming } from './commands/webviewToggleShowRecurringUpcoming';
import { appendTaskToFile } from './documentActions';
import { $config } from './extension';
import { SortProperty, sortTasks } from './sort';
import { TheTask } from './TheTask';
import { getDateInISOFormat } from './time/timeUtils';
import { formatTask, getTaskAtLineExtension } from './utils/taskUtils';
import { followLinks, getFullRangeFromLines } from './utils/vscodeUtils';

/**
 * All commands contributed by this extension.
 */
export const enum CommandId {
	ToggleDone = 'todomd.toggleDone',
	ToggleFavorite = 'todomd.toggleFavorite',
	HideTask = 'todomd.hideTask',
	CollapseAllNestedTasks = 'todomd.collapseAllNestedTasks',
	ExpandAllTasks = 'todomd.expandAllTasks',
	FocusTasksWebviewAndInput = 'todomd.focusTasksWebviewAndInput',
	DeleteTask = 'todomd.deleteTask',
	ArchiveCompletedTasks = 'todomd.archiveCompletedTasks',
	ArchiveSelectedCompletedTasks = 'todomd.archiveSelectedCompletedTasks',
	StartTask = 'todomd.startTask',
	RemoveOverdue = 'todomd.removeOverdue',
	MoveToSomeday = 'todomd.moveToSomeday',
	// ────────────────────────────────────────────────────────────
	SortByDefault = 'todomd.sortByDefault',
	SortByPriority = 'todomd.sortByPriority',
	SortByProject = 'todomd.sortByProject',
	SortByTag = 'todomd.sortByTag',
	SortByContext = 'todomd.sortByContext',
	SortByCreationDate = 'todomd.sortByCreationDate',
	SortByCompletionDate = 'todomd.sortByCompletionDate',
	SortByDueDate = 'todomd.sortByDueDate',
	// ────────────────────────────────────────────────────────────
	CreateSimilarTask = 'todomd.createSimilarTask',
	GetNextTask = 'todomd.getNextTask',
	GetFewNextTasks = 'todomd.getFewNextTasks',
	GetRandomTask = 'todomd.getRandomTask',
	AddTaskToDefaultFile = 'todomd.addTaskToDefaultFile',
	AddTaskToActiveFile = 'todomd.addTaskToActiveFile',
	AddTaskToActiveFileWebview = 'todomd.addTaskToActiveFileWebview',
	SetDueDate = 'todomd.setDueDate',
	SetDueDateWithArgs = 'todomd.setDueDateWithArgs',
	OpenDefaultFile = 'todomd.openDefaultFile',
	OpenDefaultArchiveFile = 'todomd.openDefaultArchiveFile',
	OpenSomedayFile = 'todomd.openSomedayFile',
	SpecifyDefaultFile = 'todomd.specifyDefaultFile',
	SpecifyDefaultArchiveFile = 'todomd.specifyDefaultArchiveFile',
	SpecifyDefaultSomedayFile = 'todomd.specifyDefaultSomedayFile',
	CompleteTask = 'todomd.completeTask',
	ApplyFilterToTreeView = 'todomd.applyFilterToTreeView',
	ClearTreeViewFilter = 'todomd.clearTreeViewFilter',
	GoToLine = 'todomd.goToLine',
	GoToLineInArchived = 'todomd.goToLineInArchived',
	ResetAllRecurringTasks = 'todomd.resetAllRecurringTasks',
	FollowLink = 'todomd.followLink',
	IncrementPriority = 'todomd.incrementPriority',
	DecrementPriority = 'todomd.decrementPriority',
	ShowWebviewSettings = 'todomd.showWebviewSettings',
	WebviewToggleShowRecurringUpcoming = 'todomd.webview.toggleShowRecurringUpcoming',
	ToggleComment = 'todomd.toggleComment',
	ToggleTagsTreeViewSorting = 'todomd.toggleTagsTreeViewSorting',
	ToggleProjectsTreeViewSorting = 'todomd.toggleProjectsTreeViewSorting',
	ToggleContextsTreeViewSorting = 'todomd.toggleContextsTreeViewSorting',
	// ──── Dev ───────────────────────────────────────────────────
	SetLastVisit = 'todomd.dev.setLastVisit',
	ClearGlobalState = 'todomd.dev.clearGlobalState',
	ShowGlobalState = 'todomd.dev.showGlobalState',
	RemoveAllOverdue = 'todomd.dev.removeAllOverdue',
	// ──── Internal ──────────────────────────────────────────────
	MainStatusBarCommand = 'todomd.mainStatusBarCommand',
}

/**
 * Register all commands. Names should match **"commands"** in `package.json`
 */
export function registerAllCommands() {
	commands.registerCommand(CommandId.ToggleDone, toggleDone);
	commands.registerCommand(CommandId.HideTask, hideTask);
	commands.registerCommand(CommandId.CollapseAllNestedTasks, collapseAllNestedTasks);
	commands.registerCommand(CommandId.ExpandAllTasks, expandAllNestedTasks);
	commands.registerCommand(CommandId.FocusTasksWebviewAndInput, focusTasksWebviewAndInput);
	commands.registerCommand(CommandId.DeleteTask, deleteTask);
	commands.registerCommand(CommandId.StartTask, startTask);
	commands.registerCommand(CommandId.GetNextTask, getNextTask);
	commands.registerCommand(CommandId.GetFewNextTasks, getFewNextTasksCommand);
	commands.registerCommand(CommandId.GetRandomTask, getRandomTask);
	commands.registerCommand(CommandId.AddTaskToDefaultFile, addTaskToDefaultFile);
	commands.registerCommand(CommandId.AddTaskToActiveFile, addTaskToActiveFile);
	commands.registerCommand(CommandId.AddTaskToActiveFileWebview, addTaskToActiveFileWebview);
	commands.registerCommand(CommandId.SetDueDateWithArgs, setDueDateWithArgs);
	commands.registerCommand(CommandId.OpenDefaultFile, openDefaultFile);
	commands.registerCommand(CommandId.OpenDefaultArchiveFile, openDefaultArchiveFile);
	commands.registerCommand(CommandId.OpenSomedayFile, openSomedayFile);
	commands.registerCommand(CommandId.SpecifyDefaultFile, specifyDefaultFileCommand);
	commands.registerCommand(CommandId.SpecifyDefaultArchiveFile, specifyDefaultArchiveFileCommand);
	commands.registerCommand(CommandId.SpecifyDefaultSomedayFile, specifyDefaultSomedayFileCommand);
	commands.registerCommand(CommandId.CompleteTask, completeTask);
	commands.registerCommand(CommandId.ApplyFilterToTreeView, applyFilterToTreeViewCommand);
	commands.registerCommand(CommandId.ClearTreeViewFilter, clearTreeViewFilter);
	commands.registerCommand(CommandId.ClearGlobalState, clearGlobalState);
	commands.registerCommand(CommandId.ShowGlobalState, showGlobalState);
	commands.registerCommand(CommandId.RemoveAllOverdue, removeAllOverdue);
	commands.registerCommand(CommandId.GoToLine, goToLine);
	commands.registerCommand(CommandId.GoToLineInArchived, goToLineInArchived);
	commands.registerCommand(CommandId.FollowLink, followLinkCommand);
	commands.registerCommand(CommandId.ShowWebviewSettings, showWebviewSettings);
	commands.registerCommand(CommandId.WebviewToggleShowRecurringUpcoming, webviewToggleShowRecurringUpcoming);
	commands.registerCommand(CommandId.ToggleTagsTreeViewSorting, toggleTagsTreeViewSorting);
	commands.registerCommand(CommandId.ToggleProjectsTreeViewSorting, toggleProjectsTreeViewSorting);
	commands.registerCommand(CommandId.ToggleContextsTreeViewSorting, toggleContextsTreeViewSorting);
	commands.registerCommand(CommandId.ToggleFavorite, toggleFavoriteTask);
	// ──── Require Text Editor ───────────────────────────────────
	commands.registerTextEditorCommand(CommandId.RemoveOverdue, removeOverdue);
	commands.registerTextEditorCommand(CommandId.SetLastVisit, setLastVisit);
	commands.registerTextEditorCommand(CommandId.IncrementPriority, incrementPriority);
	commands.registerTextEditorCommand(CommandId.ResetAllRecurringTasks, resetAllRecurringTasksCommand);
	commands.registerTextEditorCommand(CommandId.DecrementPriority, decrementPriority);
	commands.registerTextEditorCommand(CommandId.ToggleComment, toggleComment);
	commands.registerTextEditorCommand(CommandId.SortByDefault, (editor, edit) => sortTasksInEditor(editor, edit, SortProperty.Default));
	commands.registerTextEditorCommand(CommandId.SortByPriority, (editor, edit) => sortTasksInEditor(editor, edit, SortProperty.Priority));
	commands.registerTextEditorCommand(CommandId.SortByProject, (editor, edit) => sortTasksInEditor(editor, edit, SortProperty.Project));
	commands.registerTextEditorCommand(CommandId.SortByTag, (editor, edit) => sortTasksInEditor(editor, edit, SortProperty.Tag));
	commands.registerTextEditorCommand(CommandId.SortByContext, (editor, edit) => sortTasksInEditor(editor, edit, SortProperty.Context));
	commands.registerTextEditorCommand(CommandId.SortByCreationDate, (editor, edit) => sortTasksInEditor(editor, edit, SortProperty.CreationDate));
	commands.registerTextEditorCommand(CommandId.SortByCompletionDate, (editor, edit) => sortTasksInEditor(editor, edit, SortProperty.CompletionDate));
	commands.registerTextEditorCommand(CommandId.SortByDueDate, (editor, edit) => sortTasksInEditor(editor, edit, SortProperty.DueDate));
	commands.registerTextEditorCommand(CommandId.CreateSimilarTask, createSimilarTask);
	commands.registerTextEditorCommand(CommandId.ArchiveCompletedTasks, archiveCompletedTasks);
	commands.registerTextEditorCommand(CommandId.MoveToSomeday, moveToSomeday);
	commands.registerTextEditorCommand(CommandId.SetDueDate, setDueDate);
	// ──── Internal ──────────────────────────────────────────────
	commands.registerCommand(CommandId.MainStatusBarCommand, mainStatusBarCommand);
}
/**
 * Append task to the file.
 *
 * Optionally adds creation date if user configured `addCreationDate`.
 */
export async function addTaskToFile(text: string, filePath: string) {
	const creationDate = $config.addCreationDate ? `{cr:${getDateInISOFormat(new Date(), $config.creationDateIncludeTime)}} ` : '';
	return await appendTaskToFile(`${creationDate}${text}`, filePath);
}
/**
 * Show formatted task in notification. Also show button to Follow link if links are present in this task.
 */
export async function showTaskInNotification(task: TheTask) {
	const formattedTask = formatTask(task);
	if (task.links.length) {
		const buttonFollowLink = 'Follow link';
		const shouldFollow = await window.showInformationMessage(formattedTask, buttonFollowLink);
		if (shouldFollow === buttonFollowLink) {
			followLinks(task.links);
		}
	} else {
		window.showInformationMessage(formattedTask);
	}
}
/**
 * Sort tasks in editor. Default sort is by due date. Same due date sorted by priority.
 */
export function sortTasksInEditor(editor: TextEditor, edit: TextEditorEdit, sortProperty: SortProperty) {
	const selection = editor.selection;
	let lineStart = selection.start.line;
	let lineEnd = selection.end.line;
	if (selection.isEmpty) {
		lineStart = 0;
		lineEnd = editor.document.lineCount - 1;
	}

	// Fetch only the top-level tasks within the selection to avoid messing up
	// nested tasks after sorting and to retain the tree structure.
	const tasks: TheTask[] = [];
	let lineno = lineStart;
	while (lineno <= lineEnd) {
		let task = getTaskAtLineExtension(lineno);
		if (task) {
			tasks.push(task);
			// Jump past all subtasks of this task
			while (task.subtasks.length) {
				task = task.subtasks[task.subtasks.length - 1];
				lineno = task.lineNumber;
			}
		}
		lineno++;
	}
	// If the selection includes a parent task but ends without including all of its subtasks,
	// manually extend the selection to avoid messing up the task list after sorting.
	lineEnd = lineno - 1;

	const sortedTasks = sortTasks(tasks, sortProperty);
	if (!sortedTasks.length) {
		return;
	}
	const result = sortedTasks.map(t => t.rawTextWithNestedTasks()).join('\n');
	edit.replace(getFullRangeFromLines(editor.document, lineStart, lineEnd), result);
}
