import { commands, TextDocument, TextEditor, TextEditorEdit, ThemeIcon, window } from 'vscode';
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
import { sortByDefault } from './commands/sortByDefault';
import { sortByPriority } from './commands/sortByPriority';
import { specifyDefaultArchiveFileCommand } from './commands/specifyDefaultArchiveFile';
import { specifyDefaultFileCommand } from './commands/specifyDefaultFile';
import { startTask } from './commands/startTask';
import { toggleComment } from './commands/toggleComment';
import { toggleContextsTreeViewSorting } from './commands/toggleContextsTreeViewSorting';
import { toggleDone } from './commands/toggleDone';
import { toggleProjectsTreeViewSorting } from './commands/toggleProjectsTreeViewSorting';
import { toggleTagsTreeViewSorting } from './commands/toggleTagsTreeViewSorting';
import { webviewToggleShowRecurringUpcoming } from './commands/webviewToggleShowRecurringUpcoming';
import { appendTaskToFile, setDueDateAtLine } from './documentActions';
import { DueDate } from './dueDate';
import { updateEverything } from './events';
import { $config } from './extension';
import { defaultSortTasks, SortProperty, sortTasks } from './sort';
import { TheTask } from './TheTask';
import { helpCreateDueDate } from './time/setDueDateHelper';
import { getDateInISOFormat } from './time/timeUtils';
import { CommandIds } from './types';
import { formatTask, getTaskAtLineExtension } from './utils/taskUtils';
import { unique } from './utils/utils';
import { followLink, followLinks, getFullRangeFromLines, inputOffset } from './utils/vscodeUtils';

/**
 * Register all commands. Names should match **"commands"** in `package.json`
 */
export function registerAllCommands() {
	commands.registerCommand(CommandIds.toggleDone, toggleDone);
	commands.registerCommand(CommandIds.hideTask, hideTask);
	commands.registerCommand(CommandIds.collapseAllNestedTasks, collapseAllNestedTasks);
	commands.registerCommand(CommandIds.expandAllTasks, expandAllNestedTasks);
	commands.registerCommand(CommandIds.focusTasksWebviewAndInput, focusTasksWebviewAndInput);
	commands.registerCommand(CommandIds.deleteTask, deleteTask);
	commands.registerCommand(CommandIds.startTask, startTask);
	commands.registerCommand(CommandIds.getNextTask, getNextTask);
	commands.registerCommand(CommandIds.getFewNextTasks, getFewNextTasksCommand);
	commands.registerCommand(CommandIds.getRandomTask, getRandomTask);
	commands.registerCommand(CommandIds.addTaskToDefaultFile, addTaskToDefaultFile);
	commands.registerCommand(CommandIds.addTaskToActiveFile, addTaskToActiveFile);
	commands.registerCommand(CommandIds.setDueDateWithArgs, setDueDateWithArgs);
	commands.registerCommand(CommandIds.openDefaultArchiveFile, openDefaultArchiveFile);
	commands.registerCommand(CommandIds.openDefaultFile, openDefaultFile);
	commands.registerCommand(CommandIds.specifyDefaultFile, specifyDefaultFileCommand);
	commands.registerCommand(CommandIds.specifyDefaultArchiveFile, specifyDefaultArchiveFileCommand);
	commands.registerCommand(CommandIds.completeTask, completeTask);
	commands.registerCommand(CommandIds.clearFilter, clearFilter);
	commands.registerCommand(CommandIds.clearGlobalState, clearGlobalState);
	commands.registerCommand(CommandIds.showGlobalState, showGlobalState);
	commands.registerCommand(CommandIds.removeAllOverdue, removeAllOverdue);
	commands.registerCommand(CommandIds.goToLine, goToLine);
	commands.registerCommand(CommandIds.goToLineInArchived, goToLineInArchived);
	commands.registerCommand(CommandIds.followLink, followLinkCommand);
	commands.registerCommand(CommandIds.showWebviewSettings, showWebviewSettings);
	commands.registerCommand(CommandIds.showDefaultFileSetting, showDefaultFileSetting);
	commands.registerCommand(CommandIds.webviewToggleShowRecurringUpcoming, webviewToggleShowRecurringUpcoming);
	commands.registerCommand(CommandIds.toggleTagsTreeViewSorting, toggleTagsTreeViewSorting);
	commands.registerCommand(CommandIds.toggleProjectsTreeViewSorting, toggleProjectsTreeViewSorting);
	commands.registerCommand(CommandIds.toggleContextsTreeViewSorting, toggleContextsTreeViewSorting);
	// ────────────────────────────────────────────────────────────
	commands.registerTextEditorCommand(CommandIds.setLastVisit, setLastVisit);
	commands.registerTextEditorCommand(CommandIds.incrementPriority, incrementPriority);
	commands.registerTextEditorCommand(CommandIds.resetAllRecurringTasks, resetAllRecurringTasksCommand);
	commands.registerTextEditorCommand(CommandIds.decrementPriority, decrementPriority);
	commands.registerTextEditorCommand(CommandIds.toggleComment, toggleComment);
	commands.registerTextEditorCommand(CommandIds.filter, filter);
	commands.registerTextEditorCommand(CommandIds.replaceWithToday, replaceWithToday);
	commands.registerTextEditorCommand(CommandIds.sortByPriority, sortByPriority);
	commands.registerTextEditorCommand(CommandIds.sortByDefault, sortByDefault);
	commands.registerTextEditorCommand(CommandIds.createSimilarTask, createSimilarTask);
	commands.registerTextEditorCommand(CommandIds.archiveCompletedTasks, archiveCompletedTasks);
	commands.registerTextEditorCommand(CommandIds.setDueDate, setDueDate);
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
export function sortTasksInEditor(editor: TextEditor, edit: TextEditorEdit, sortProperty: 'default' | 'priority') {
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
	let sortedTasks: TheTask[];
	if (sortProperty === 'priority') {
		sortedTasks = sortTasks(tasks, SortProperty.priority);
	} else {
		sortedTasks = defaultSortTasks(tasks);
	}
	const result = sortedTasks.map(t => t.rawText).join('\n');
	edit.replace(getFullRangeFromLines(editor.document, lineStart, lineEnd), result);
}
/**
 * Open vscode input box that aids in creating of due date.
 */
export function openSetDueDateInputbox(document: TextDocument, lineNumber: number) {
	const inputBox = window.createInputBox();
	let value: string | undefined = '+0';
	inputBox.value = value;
	inputBox.title = 'Set due date';
	const docsButtonName = 'Documentation';
	inputBox.onDidTriggerButton(e => {
		if (e.tooltip === docsButtonName) {
			followLink('https://github.com/usernamehw/vscode-todo-md/blob/master/docs/docs.md#set-due-date-helper-function-todomdsetduedate');
		}
	});
	inputBox.buttons = [{
		iconPath: new ThemeIcon('question'),
		tooltip: docsButtonName,
	}];
	inputBox.prompt = inputOffset(new DueDate(helpCreateDueDate(value)!).closestDueDateInTheFuture);
	inputBox.show();

	inputBox.onDidChangeValue((e: string) => {
		value = e;
		const newDueDate = helpCreateDueDate(value);
		if (!newDueDate) {
			inputBox.prompt = inputOffset('❌ Invalid');
			return;
		}
		inputBox.prompt = inputOffset(new DueDate(newDueDate).closestDueDateInTheFuture);
	});

	inputBox.onDidAccept(async () => {
		if (!value) {
			return;
		}
		const newDueDate = helpCreateDueDate(value);

		if (newDueDate) {
			await setDueDateAtLine(document, lineNumber, newDueDate);
			inputBox.hide();
			inputBox.dispose();
			updateEverything();
		}
	});
}
