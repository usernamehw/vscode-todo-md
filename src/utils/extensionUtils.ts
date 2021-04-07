import fs from 'fs';
import { TextDocument, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { extensionConfig, extensionState, EXTENSION_NAME } from '../extension';
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
export async function getActiveDocument() {
	if (extensionState.activeDocument) {
		if (extensionState.activeDocument.isClosed) {
			return await workspace.openTextDocument(extensionState.activeDocument.uri);
		} else {
			return extensionState.activeDocument;
		}
	} else {
		return undefined;
	}
}
/**
 * Get Text Document for default file (if specified)
 */
export async function getDocumentForDefaultFile() {
	if (!extensionConfig.defaultFile) {
		return undefined;
	}
	return await workspace.openTextDocument(Uri.file(extensionConfig.defaultFile));
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

	return updateSetting(`${EXTENSION_NAME}.default${isArchive ? 'Archive' : ''}File`, filePath);
}
/**
 * Open Settings GUI at `todomd.defaultFile` item
 */
export async function specifyDefaultFile() {
	return specifyFile(false);
}
export async function specifyDefaultArchiveFile() {
	return specifyFile(true);
}
/**
 * Check if default file path is specified. If not - show notification with button to enter it.
 */
export async function checkDefaultFileAndNotify(): Promise<boolean> {
	const specify = 'Specify';
	if (!extensionConfig.defaultFile) {
		const shouldSpecify = await window.showWarningMessage('Default file is not specified.', specify);
		if (shouldSpecify === specify) {
			specifyDefaultFile();
		}
		return false;
	} else {
		const exists = fs.existsSync(extensionConfig.defaultFile);
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
	if (!extensionConfig.defaultArchiveFile) {
		const shouldSpecify = await window.showWarningMessage('Default archive file is not specified.', specify);
		if (shouldSpecify === specify) {
			specifyDefaultArchiveFile();
		}
		return false;
	} else {
		const exists = fs.existsSync(extensionConfig.defaultArchiveFile);
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
		result.push(specialTag(SpecialTagName.due, task.due.raw));
	}
	if (task.overdue) {
		result.push(specialTag(SpecialTagName.overdue, task.overdue));
	}
	if (task.creationDate) {
		result.push(specialTag(SpecialTagName.creationDate, task.creationDate));
	}
	if (task.completionDate) {
		result.push(specialTag(SpecialTagName.completionDate, task.completionDate));
	}
	if (task.count) {
		result.push(specialTag(SpecialTagName.count, `${task.count.current}/${task.count.needed}`));
	}
	if (task.isCollapsed) {
		result.push(specialTag(SpecialTagName.collapsed));
	}
	if (task.isHidden) {
		result.push(specialTag(SpecialTagName.hidden));
	}
	return (task.indent ? task.indent : '') + result.join(' ');
}

/**
 * Helper function. Construct special tag with some autocomplete.
 */
export function specialTag(tag: SpecialTagName, value?: string) {
	return `{${tag}${value ? `:${value}` : ''}}`;
}
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
