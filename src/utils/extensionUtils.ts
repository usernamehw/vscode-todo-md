import fs from 'fs';
import { TextDocument, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { Constants, $config, $state } from '../extension';
import { TheTask } from '../TheTask';
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
async function specifyFile(isArchive: boolean) {
	const filePaths = await window.showOpenDialog({
		title: `Pick default${isArchive ? ' archive' : ''} file`,
	});
	if (!filePaths) {
		return undefined;
	}
	const filePath = filePaths[0].fsPath;
	if (!filePath) {
		return undefined;
	}

	const settingName = isArchive ? Constants.defaultArchiveFileSetting : Constants.defaultFileSetting;
	return updateSetting(settingName, filePath);
}
/**
 * Open Settings GUI at `todomd.defaultFile` item
 */
export async function specifyDefaultFile() {
	return await specifyFile(false);
}
export async function specifyDefaultArchiveFile() {
	return await specifyFile(true);
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
		result.push(helpCreateSpecialTag(SpecialTagName.due, task.due.raw));
	}
	if (task.overdue) {
		result.push(helpCreateSpecialTag(SpecialTagName.overdue, task.overdue));
	}
	if (task.creationDate) {
		result.push(helpCreateSpecialTag(SpecialTagName.creationDate, task.creationDate));
	}
	if (task.completionDate) {
		result.push(helpCreateSpecialTag(SpecialTagName.completionDate, task.completionDate));
	}
	if (task.count) {
		result.push(helpCreateSpecialTag(SpecialTagName.count, `${task.count.current}/${task.count.needed}`));
	}
	if (task.isCollapsed) {
		result.push(helpCreateSpecialTag(SpecialTagName.collapsed));
	}
	if (task.isHidden) {
		result.push(helpCreateSpecialTag(SpecialTagName.hidden));
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
	due = 'due',
	overdue = 'overdue',
	completionDate = 'cm',
	creationDate = 'cr',
	started = 'start',
	duration = 'duration',
	hidden = 'h',
	collapsed = 'c',
	count = 'count',
}
/**
 * Very short special tag description for autocomplete widget.
 */
export const specialTagDescription = {
	[SpecialTagName.due]: 'due',
	[SpecialTagName.overdue]: 'overdue',
	[SpecialTagName.completionDate]: 'completionDate',
	[SpecialTagName.creationDate]: 'creationDate',
	[SpecialTagName.started]: 'started',
	[SpecialTagName.duration]: 'duration',
	[SpecialTagName.hidden]: 'hidden',
	[SpecialTagName.collapsed]: 'collapsed',
	[SpecialTagName.count]: 'count',
} as const;
