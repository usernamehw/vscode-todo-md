import fs from 'fs';
import { TextDocument, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { extensionConfig, extensionState } from '../extension';
import { openSettingGuiAt } from './vscodeUtils';

/**
 * vscode `WorkspaceEdit` allowes changing files that are not even opened.
 *
 * `document.save()` is needed to prevent opening those files after applying the edit.
 */
export async function applyEdit(wEdit: WorkspaceEdit, document: TextDocument) {
	await workspace.applyEdit(wEdit);
	return await document.save();
}
/**
 * Get active document
 */
export async function getActiveDocument() {
	if (extensionState.activeDocument === undefined) {
		window.showErrorMessage('No active document');
		throw new Error('No active document');
	}
	if (extensionState.activeDocument.isClosed) {
		extensionState.activeDocument = await workspace.openTextDocument(extensionState.activeDocument.uri);
	}
	return extensionState.activeDocument;
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
/**
 * Open Settings GUI at `todomd.defaultFile` item
 */
export function specifyDefaultFile() {
	openSettingGuiAt('todomd.defaultFile');
}
/**
 * Open Settings GUI at `todomd.defaultArchiveFile` item
 */
export function specifyDefaultArchiveFile() {
	openSettingGuiAt('todomd.defaultArchiveFile');
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
