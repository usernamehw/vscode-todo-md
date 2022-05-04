import { commands, TextEditor, TextEditorEdit, window } from 'vscode';
import { addTaskToActiveFile } from './commands/addTaskToActiveFile';
import { addTaskToDefaultFile } from './commands/addTaskToDefaultFile';
import { archiveCompletedTasks } from './commands/archiveCompletedTasks';
import { clearFilter } from './commands/clearFilter';
import { clearGlobalState } from './commands/clearGlobalState';
import { collapseAllNestedTasks } from './commands/collapseAllNestedTasks';
import { completeTask } from './commands/completeTask';
import { createSimilarTask } from './commands/createSimilarTask';
import { decrementPriority } from './commands/decrementPriority';
import { deleteTask } from './commands/deleteTask';
import { expandAllNestedTasks } from './commands/expandAllNestedTasks';
import { filter } from './commands/filter';
import { focusTasksWebviewAndInput } from './commands/focusTasksWebviewAndInput';
import { followLinkCommand } from './commands/followLinkCommand';
import { getFewNextTasksCommand } from './commands/getFewNextTasks';
import { getNextTask } from './commands/getNextTask';
import { getRandomTask } from './commands/getRandomTask';
import { goToLine } from './commands/goToLine';
import { goToLineInArchived } from './commands/goToLineInArchived';
import { hideTask } from './commands/hideTask';
import { incrementPriority } from './commands/incrementPriority';
import { openDefaultArchiveFile } from './commands/openDefaultArchiveFile';
import { openDefaultFile } from './commands/openDefaultFile';
import { removeAllOverdue } from './commands/removeAllOverdue';
import { replaceWithToday } from './commands/replaceWithToday';
import { resetAllRecurringTasksCommand } from './commands/resetAllRecurringTasks';
import { setDueDate } from './commands/setDueDate';
import { setDueDateWithArgs } from './commands/setDueDateWithArgs';
import { setLastVisit } from './commands/setLastVisit';
import { showDefaultFileSetting } from './commands/showDefaultFileSetting';
import { showGlobalState } from './commands/showGlobalState';
import { showWebviewSettings } from './commands/showWebviewSettings';
import { specifyDefaultArchiveFileCommand } from './commands/specifyDefaultArchiveFile';
import { specifyDefaultFileCommand } from './commands/specifyDefaultFile';
import { startTask } from './commands/startTask';
import { toggleComment } from './commands/toggleComment';
import { toggleContextsTreeViewSorting } from './commands/toggleContextsTreeViewSorting';
import { toggleDone } from './commands/toggleDone';
import { toggleProjectsTreeViewSorting } from './commands/toggleProjectsTreeViewSorting';
import { toggleTagsTreeViewSorting } from './commands/toggleTagsTreeViewSorting';
import { webviewToggleShowRecurringUpcoming } from './commands/webviewToggleShowRecurringUpcoming';
import { appendTaskToFile } from './documentActions';
import { $config } from './extension';
import { defaultSortTasks, SortProperty, sortTasks } from './sort';
import { TheTask } from './TheTask';
import { getDateInISOFormat } from './time/timeUtils';
import { formatTask, getTaskAtLineExtension } from './utils/taskUtils';
import { unique } from './utils/utils';
import { followLinks, getFullRangeFromLines } from './utils/vscodeUtils';

/**
 * All commands contributed by this extension.
 */
export const enum CommandId {
	ToggleDone = 'todomd.toggleDone',
	HideTask = 'todomd.hideTask',
	CollapseAllNestedTasks = 'todomd.collapseAllNestedTasks',
	ExpandAllTasks = 'todomd.expandAllTasks',
	FocusTasksWebviewAndInput = 'todomd.focusTasksWebviewAndInput',
	DeleteTask = 'todomd.deleteTask',
	ArchiveCompletedTasks = 'todomd.archiveCompletedTasks',
	ArchiveSelectedCompletedTasks = 'todomd.archiveSelectedCompletedTasks',
	StartTask = 'todomd.startTask',
	// ────────────────────────────────────────────────────────────
	SortByDefault = 'todomd.sortByDefault',
	SortByPriority = 'todomd.sortByPriority',
	SortByProject = 'todomd.sortByProject',
	SortByCreationDate = 'todomd.sortByCreationDate',
	// ────────────────────────────────────────────────────────────
	CreateSimilarTask = 'todomd.createSimilarTask',
	GetNextTask = 'todomd.getNextTask',
	GetFewNextTasks = 'todomd.getFewNextTasks',
	GetRandomTask = 'todomd.getRandomTask',
	AddTaskToDefaultFile = 'todomd.addTaskToDefaultFile',
	AddTaskToActiveFile = 'todomd.addTaskToActiveFile',
	SetDueDate = 'todomd.setDueDate',
	SetDueDateWithArgs = 'todomd.setDueDateWithArgs',
	OpenDefaultArchiveFile = 'todomd.openDefaultArchiveFile',
	OpenDefaultFile = 'todomd.openDefaultFile',
	SpecifyDefaultFile = 'todomd.specifyDefaultFile',
	SpecifyDefaultArchiveFile = 'todomd.specifyDefaultArchiveFile',
	CompleteTask = 'todomd.completeTask',
	Filter = 'todomd.filter',
	ClearFilter = 'todomd.clearFilter',
	GoToLine = 'todomd.goToLine',
	GoToLineInArchived = 'todomd.goToLineInArchived',
	ResetAllRecurringTasks = 'todomd.resetAllRecurringTasks',
	FollowLink = 'todomd.followLink',
	IncrementPriority = 'todomd.incrementPriority',
	DecrementPriority = 'todomd.decrementPriority',
	ShowWebviewSettings = 'todomd.showWebviewSettings',
	ShowDefaultFileSetting = 'todomd.showDefaultFileSetting',
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
	ReplaceWithToday = 'todomd.dev.replaceDateWithToday',
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
	commands.registerCommand(CommandId.SetDueDateWithArgs, setDueDateWithArgs);
	commands.registerCommand(CommandId.OpenDefaultArchiveFile, openDefaultArchiveFile);
	commands.registerCommand(CommandId.OpenDefaultFile, openDefaultFile);
	commands.registerCommand(CommandId.SpecifyDefaultFile, specifyDefaultFileCommand);
	commands.registerCommand(CommandId.SpecifyDefaultArchiveFile, specifyDefaultArchiveFileCommand);
	commands.registerCommand(CommandId.CompleteTask, completeTask);
	commands.registerCommand(CommandId.ClearFilter, clearFilter);
	commands.registerCommand(CommandId.ClearGlobalState, clearGlobalState);
	commands.registerCommand(CommandId.ShowGlobalState, showGlobalState);
	commands.registerCommand(CommandId.RemoveAllOverdue, removeAllOverdue);
	commands.registerCommand(CommandId.GoToLine, goToLine);
	commands.registerCommand(CommandId.GoToLineInArchived, goToLineInArchived);
	commands.registerCommand(CommandId.FollowLink, followLinkCommand);
	commands.registerCommand(CommandId.ShowWebviewSettings, showWebviewSettings);
	commands.registerCommand(CommandId.ShowDefaultFileSetting, showDefaultFileSetting);
	commands.registerCommand(CommandId.WebviewToggleShowRecurringUpcoming, webviewToggleShowRecurringUpcoming);
	commands.registerCommand(CommandId.ToggleTagsTreeViewSorting, toggleTagsTreeViewSorting);
	commands.registerCommand(CommandId.ToggleProjectsTreeViewSorting, toggleProjectsTreeViewSorting);
	commands.registerCommand(CommandId.ToggleContextsTreeViewSorting, toggleContextsTreeViewSorting);
	// ──── Require Text Editor ───────────────────────────────────
	commands.registerTextEditorCommand(CommandId.SetLastVisit, setLastVisit);
	commands.registerTextEditorCommand(CommandId.IncrementPriority, incrementPriority);
	commands.registerTextEditorCommand(CommandId.ResetAllRecurringTasks, resetAllRecurringTasksCommand);
	commands.registerTextEditorCommand(CommandId.DecrementPriority, decrementPriority);
	commands.registerTextEditorCommand(CommandId.ToggleComment, toggleComment);
	commands.registerTextEditorCommand(CommandId.Filter, filter);
	commands.registerTextEditorCommand(CommandId.ReplaceWithToday, replaceWithToday);
	commands.registerTextEditorCommand(CommandId.SortByDefault, (editor, edit) => sortTasksInEditor(editor, edit, SortProperty.Default));
	commands.registerTextEditorCommand(CommandId.SortByPriority, (editor, edit) => sortTasksInEditor(editor, edit, SortProperty.Priority));
	commands.registerTextEditorCommand(CommandId.SortByProject, (editor, edit) => sortTasksInEditor(editor, edit, SortProperty.Project));
	commands.registerTextEditorCommand(CommandId.SortByCreationDate, (editor, edit) => sortTasksInEditor(editor, edit, SortProperty.CreationDate));
	commands.registerTextEditorCommand(CommandId.CreateSimilarTask, createSimilarTask);
	commands.registerTextEditorCommand(CommandId.ArchiveCompletedTasks, archiveCompletedTasks);
	commands.registerTextEditorCommand(CommandId.SetDueDate, setDueDate);
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
 * Return unique line numbers with cursors or selections.
 */
export function getSelectedLineNumbers(editor: TextEditor): number[] {
	const lineNumbers: number[] = [];
	for (const selection of editor.selections) {
		for (let i = selection.start.line; i <= selection.end.line; i++) {
			lineNumbers.push(i);
		}
	}
	return unique(lineNumbers);
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
	const tasks: TheTask[] = [];
	for (let i = lineStart; i <= lineEnd; i++) {
		const task = getTaskAtLineExtension(i);
		if (task) {
			tasks.push(task);
		}
	}
	const sortedTasks = sortTasks(tasks, sortProperty);
	if (!sortedTasks.length) {
		return;
	}
	const result = sortedTasks.map(t => t.rawText).join('\n');
	edit.replace(getFullRangeFromLines(editor.document, lineStart, lineEnd), result);
}

