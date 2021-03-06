import dayjs from 'dayjs';
import throttle from 'lodash/throttle';
import { languages, TextDocumentChangeEvent, TextEditor, window, workspace } from 'vscode';
import { doUpdateEditorDecorations } from './decorations';
import { resetAllRecurringTasks } from './documentActions';
import { Constants, extensionConfig, extensionState, Global, statusBar, updateLastVisitGlobalState, updateState } from './extension';
import { updateHover } from './hover/hoverProvider';
import { updateCompletions } from './languageFeatures/completionProviders';
import { updateDocumentHighlights } from './languageFeatures/documentHighlights';
import { updateReferenceProvider } from './languageFeatures/referenceProvider';
import { updateRenameProvider } from './languageFeatures/renameProvider';
import { updateAllTreeViews } from './treeViewProviders/treeViews';
import { VscodeContext } from './types';
import { getDocumentForDefaultFile } from './utils/extensionUtils';
import { sleep } from './utils/utils';
import { setContext } from './utils/vscodeUtils';

let changeActiveEditorEventInProgress = false;
/**
 * Active text editor changes (tab).
 *
 * This event can be fired multiple times very quickly 5-20ms interval.
 */
export async function onChangeActiveTextEditor(editor: TextEditor | undefined): Promise<void> {
	if (changeActiveEditorEventInProgress) {
		await sleep(50);
	}
	if (changeActiveEditorEventInProgress) {
		await sleep(200);
	}
	changeActiveEditorEventInProgress = true;
	if (extensionState.theRightFileOpened) {
		deactivateEditorFeatures();
	}
	if (editor && isTheRightFileName(editor)) {
		extensionState.activeDocument = editor.document;
		extensionState.activeDocumentTabSize = typeof editor.options.tabSize === 'number' ? editor.options.tabSize : extensionConfig.tabSize;
		await updateEverything(editor);
		activateEditorFeatures(editor);
		await setContext(VscodeContext.isActive, true);

		const needReset = checkIfNeedResetRecurringTasks(editor.document.uri.toString());
		if (needReset) {
			await resetAllRecurringTasks(editor.document, needReset.lastVisit);
			await updateEverything();
			await updateLastVisitGlobalState(editor.document.uri.toString(), new Date());
		}
	} else {
		extensionState.activeDocument = await getDocumentForDefaultFile();
		extensionState.activeDocumentTabSize = extensionConfig.tabSize;
		extensionState.theRightFileOpened = false;
		await updateEverything();
		await setContext(VscodeContext.isActive, false);
	}
	changeActiveEditorEventInProgress = false;
}
/**
 * Only run reset all recurring tasks when needed (first open file in a day)
 */
export function checkIfNeedResetRecurringTasks(filePath: string): {lastVisit: Date} | undefined {
	const lastVisitForFile = extensionState.lastVisitByFile[filePath];
	if (lastVisitForFile) {
		if (!dayjs().isSame(lastVisitForFile, 'day')) {
			// First time this file opened this day => reset
			return {
				lastVisit: lastVisitForFile,
			};
		} else {
			// This file was already reset this day
			return undefined;
		}
	} else {
		// New file
		return {
			lastVisit: new Date(),
		};
	}
}
/**
 * Called when active text document changes (typing in it, for instance)
 */
export function onChangeTextDocument(e: TextDocumentChangeEvent) {
	const activeTextEditor = window.activeTextEditor;
	if (activeTextEditor && extensionState.theRightFileOpened) {
		updateEverything(activeTextEditor);
	}
}
/**
 * Match Uri of editor against a glob specified by user.
 */
export function isTheRightFileName(editor: TextEditor): boolean {
	return languages.match({
		pattern: extensionConfig.activatePattern,
	},	editor.document) !== 0;
}
/**
 * There's a number of editor features that are only needed when the active file matches a pattern.
 *
 * For example: completions, status bar text, editor hover.
 */
export function activateEditorFeatures(editor: TextEditor) {
	extensionState.theRightFileOpened = true;
	Global.changeTextDocumentDisposable = workspace.onDidChangeTextDocument(onChangeTextDocument);
	updateCompletions();
	updateDocumentHighlights();
	updateRenameProvider();
	updateReferenceProvider();
	updateHover();
	statusBar.show();
}
/**
 * When `todo.md` document is closed - all the features except for the Tree Views
 * will be disabled.
 */
export function deactivateEditorFeatures() {
	Global.changeTextDocumentDisposable?.dispose();
	if (Global.contextAutocompleteDisposable) {
		Global.contextAutocompleteDisposable.dispose();
		Global.tagAutocompleteDisposable.dispose();
		Global.projectAutocompleteDisposable.dispose();
		Global.generalAutocompleteDisposable.dispose();
		Global.specialTagsAutocompleteDisposable.dispose();
		Global.setDueDateAutocompleteDisposable.dispose();
	}
	Global.documentHighlightsDisposable?.dispose();
	Global.renameProviderDisposable?.dispose();
	Global.referenceProviderDisposable?.dispose();
	Global.hoverDisposable?.dispose();
	statusBar.hide();
}
/**
 * - Update state (parse the active/default file)
 * - Update editor decorations
 * - Update status bar item
 * - Update all tree views (including webview, excluding archived tasks)
 */
export const updateEverything = throttle(async (editor?: TextEditor) => {
	await updateState();
	if (editor) {
		doUpdateEditorDecorations(editor);
		statusBar.updateText(extensionState.tasks);
	}
	updateAllTreeViews();
}, Constants.THROTTLE_EVERYTHING);
