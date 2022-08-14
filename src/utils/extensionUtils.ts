import fs from 'fs';
import { TextDocument, TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { Constants } from '../constants';
import { $config, $state } from '../extension';
import { TheTask } from '../TheTask';
import { getNestedTasksLineNumbers, getTaskAtLineExtension } from './taskUtils';
import { guardedBoolean, unique } from './utils';
import { updateSetting } from './vscodeUtils';

/**
 * vscode `WorkspaceEdit` allowes changing files that are not even opened.
 *
 * `document.save()` is needed to prevent opening those files after applying the edit.
 */
export async function applyEdit(edit: WorkspaceEdit, document: TextDocument) {
	await workspace.applyEdit(edit);
	return await document.save();
}
/**
 * Get active document. If none are active try to return default document.
 */
export async function getActiveOrDefaultDocument() {
	const activeDocument = await getActiveDocument();
	if (activeDocument) {
		return activeDocument;
	} else {
		const documentForDefaultFile = await getDocumentForDefaultFile();
		if (!documentForDefaultFile) {
			window.showErrorMessage('No active document & no default document');
			throw Error('No active document & no default document');
		} else {
			return documentForDefaultFile;
		}
	}
}
/**
 * Open and return `TextDocument`.
 */
export async function getActiveDocument() {
	if ($state.activeDocument) {
		if ($state.activeDocument.isClosed) {
			return await workspace.openTextDocument($state.activeDocument.uri);
		} else {
			return $state.activeDocument;
		}
	} else {
		return undefined;
	}
}
/**
 * Get Text Document for default file (if specified)
 */
export async function getDocumentForDefaultFile() {
	if (!$config.defaultFile) {
		return undefined;
	}
	return await workspace.openTextDocument(Uri.file($config.defaultFile));
}
async function specifyFile(whichFile: 'archive' | 'default' | 'someday') {
	const filePaths = await window.showOpenDialog({
		title: `Pick ${whichFile} file`,
	});
	if (!filePaths) {
		return undefined;
	}
	const filePath = filePaths[0].fsPath;
	if (!filePath) {
		return undefined;
	}

	const settingName = whichFile === 'default' ? Constants.DefaultFileSetting :
		whichFile === 'archive' ? Constants.DefaultArchiveFileSetting : Constants.DefaultSomedayFileSetting;

	return updateSetting(settingName, filePath);
}
/**
 * Open Settings GUI at `todomd.defaultFile` item
 */
export async function specifyDefaultFile() {
	return await specifyFile('default');
}
export async function specifyDefaultArchiveFile() {
	return await specifyFile('archive');
}
/**
 * Check if default file path is specified. If not - show notification with button to enter it.
 */
export async function checkDefaultFileAndNotify(): Promise<boolean> {
	const specify = 'Specify';
	if (!$config.defaultFile) {
		const shouldSpecify = await window.showWarningMessage('Default file is not specified.', specify);
		if (shouldSpecify === specify) {
			specifyDefaultFile();
		}
		return false;
	} else {
		const exists = fs.existsSync($config.defaultFile);
		if (!exists) {
			const shouldSpecify = await window.showErrorMessage('Default file does not exist.', specify);
			if (shouldSpecify === specify) {
				specifyDefaultFile();
			}
			return false;
		} else {
			return true;
		}
	}
}
/**
 * Check if default archive file path is specified. If not - show notification with button to enter it.
 */
export async function checkArchiveFileAndNotify(): Promise<boolean> {
	const specify = 'Specify';
	if (!$config.defaultArchiveFile) {
		const shouldSpecify = await window.showWarningMessage('Default archive file is not specified.', specify);
		if (shouldSpecify === specify) {
			specifyDefaultArchiveFile();
		}
		return false;
	} else {
		const exists = fs.existsSync($config.defaultArchiveFile);
		if (!exists) {
			const shouldSpecify = await window.showErrorMessage('Specified default archive file does not exist.', specify);
			if (shouldSpecify === specify) {
				specifyDefaultArchiveFile();
			}
			return false;
		} else {
			return true;
		}
	}
}
/**
 * Check if someday file path is specified. If not - show notification with button to enter it.
 */
export async function checkSomedayFileAndNotify(): Promise<boolean> {
	const specify = 'Specify';
	if (!$config.defaultSomedayFile) {
		const shouldSpecify = await window.showWarningMessage('Someday file path is not specified.', specify);
		if (shouldSpecify === specify) {
			specifyFile('someday');
		}
		return false;
	} else {
		const exists = fs.existsSync($config.defaultSomedayFile);
		if (!exists) {
			const shouldSpecify = await window.showErrorMessage('Someday file does not exist.', specify);
			if (shouldSpecify === specify) {
				specifyFile('someday');
			}
			return false;
		} else {
			return true;
		}
	}
}
/**
 * Convert extension object to use as text. It can be different from original string since the order is fixed.
 * TODO: write tests.
 */
export function taskToString(task: TheTask) {
	const result = [];
	if (task.priority && task.priority !== TheTask.defaultTaskPriority) {
		result.push(`(${task.priority})`);
	}
	if (task.title.length) {
		result.push(task.title);
	}
	if (task.tags.length) {
		result.push(task.tags.map(tag => `#${tag}`).join(''));
	}
	if (task.projects.length) {
		result.push(task.projects.map(project => `+${project}`).join(''));
	}
	if (task.contexts.length) {
		result.push(task.contexts.map(context => `@${context}`).join(''));
	}
	if (task.due) {
		result.push(helpCreateSpecialTag(SpecialTagName.Due, task.due.raw));
	}
	if (task.overdue) {
		result.push(helpCreateSpecialTag(SpecialTagName.Overdue, task.overdue));
	}
	if (task.creationDate) {
		result.push(helpCreateSpecialTag(SpecialTagName.CreationDate, task.creationDate));
	}
	if (task.completionDate) {
		result.push(helpCreateSpecialTag(SpecialTagName.CompletionDate, task.completionDate));
	}
	if (task.count) {
		result.push(helpCreateSpecialTag(SpecialTagName.Count, `${task.count.current}/${task.count.needed}`));
	}
	if (task.isCollapsed) {
		result.push(helpCreateSpecialTag(SpecialTagName.Collapsed));
	}
	if (task.isHidden) {
		result.push(helpCreateSpecialTag(SpecialTagName.Hidden));
	}
	return (task.indent ? task.indent : '') + result.join(' ');
}

/**
 * Helper function. Construct special tag with some autocomplete.
 */
export function helpCreateSpecialTag(tag: SpecialTagName, value?: string) {
	return `{${tag}${value ? `:${value}` : ''}}`;
}
/**
 * All special tags as strings.
 */
export const enum SpecialTagName {
	Favorite = 'f',
	Due = 'due',
	Overdue = 'overdue',
	CompletionDate = 'cm',
	CreationDate = 'cr',
	Started = 'start',
	Duration = 'duration',
	Hidden = 'h',
	Collapsed = 'c',
	Count = 'count',
	NoOverdue = 'noOverdue',
}
/**
 * Very short special tag description for autocomplete widget.
 */
export const specialTagDescription: Record<SpecialTagName, string> = {
	[SpecialTagName.Favorite]: 'favorite',
	[SpecialTagName.Due]: 'due',
	[SpecialTagName.Overdue]: 'overdue',
	[SpecialTagName.CompletionDate]: 'completionDate',
	[SpecialTagName.CreationDate]: 'creationDate',
	[SpecialTagName.Started]: 'started',
	[SpecialTagName.Duration]: 'duration',
	[SpecialTagName.Hidden]: 'hidden',
	[SpecialTagName.Collapsed]: 'collapsed',
	[SpecialTagName.Count]: 'count',
	[SpecialTagName.NoOverdue]: 'no overdue',
} as const;

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
 * One cannot simply move tasks to another file.
 * If some of the selected tasks are nested/subtasks - they will
 * be separated from a parent task.
 */
export function getLineNumbersThatCanBeMovedToAnotherFile(editor: TextEditor): number[] {
	const tasksLineNumbers: number[] = [];

	const tasks = getSelectedLineNumbers(editor)
		.map(lineNumber => getTaskAtLineExtension(lineNumber))
		.filter(guardedBoolean)
		.filter(task => task.parentTaskLineNumber === undefined);

	for (const task of tasks) {
		tasksLineNumbers.push(task.lineNumber);
		tasksLineNumbers.push(...getNestedTasksLineNumbers(task.subtasks));
	}

	return tasksLineNumbers;
}
