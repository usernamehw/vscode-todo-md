import dayjs from 'dayjs';
import vscode, { window, workspace } from 'vscode';
import { updateCompletions } from './completionProviders';
import { updateEditorDecorations } from './decorations';
import { getDocumentForDefaultFile, resetAllRecurringTasks } from './documentActions';
import { extensionConfig, Global, LAST_VISIT_STORAGE_KEY, state, statusBar, updateState } from './extension';
import { updateAllTreeViews } from './treeViewProviders/treeViews';
import { VscodeContext } from './types';
import { setContext } from './vscodeUtils';

export async function onChangeActiveTextEditor(editor: vscode.TextEditor | undefined): Promise<void> {
	if (editor && isTheRightFileName(editor)) {
		state.activeDocument = editor.document;
		activateExtensionFeatures(editor);
	} else {
		state.activeDocument = await getDocumentForDefaultFile();
		if (state.theRightFileOpened) {
			deactivateExtensionFeatures();
		}
	}
}
// TODO: this function should be executed by interval (60s?)
export function checkIfNewDayArrived(): boolean {
	const lastVisit = state.extensionContext.globalState.get<string | undefined>(LAST_VISIT_STORAGE_KEY);
	if (lastVisit && !dayjs().isSame(lastVisit, 'day')) {
		state.extensionContext.globalState.update(LAST_VISIT_STORAGE_KEY, new Date());
		state.newDayArrived = true;
		state.fileWasReset = false;
		return true;
	}
	// first visit ever
	if (!lastVisit) {
		state.extensionContext.globalState.update(LAST_VISIT_STORAGE_KEY, new Date());
	}
	return false;
}

export function onChangeTextDocument(): void {
	const activeTextEditor = window.activeTextEditor;
	if (activeTextEditor && state.theRightFileOpened) {
		updateEverything(activeTextEditor);
	}
}
/**
 * Match Uri of editor against a glob specified by user.
 */
export function isTheRightFileName(editor?: vscode.TextEditor): boolean {
	if (editor === undefined) {
		editor = window.activeTextEditor;
		if (editor === undefined) {
			return false;
		}
	}
	const documentFilter: vscode.DocumentFilter = {
		pattern: extensionConfig.activatePattern,
	};
	return vscode.languages.match(documentFilter, editor.document) !== 0;
}
/**
 * There's a number of features that extension provides.
 * They are only activated when user opens file named `todo.md` (by default)
 * Only then - completions, status bar text and other features are enabled.
 */
export async function activateExtensionFeatures(editor: vscode.TextEditor) {
	state.theRightFileOpened = true;

	updateEverything(editor);

	Global.changeTextDocumentDisposable = workspace.onDidChangeTextDocument(onChangeTextDocument);
	updateCompletions();
	statusBar.updateText(state.tasks);
	statusBar.show();
	setContext(VscodeContext.isActive, true);
	// TODO: maybe move it up?
	checkIfNewDayArrived();
	if (state.newDayArrived && !state.fileWasReset) {
		await resetAllRecurringTasks();
		state.fileWasReset = true;
		updateEverything();
	}
}
/**
 * When `todo.md` document is closed - all the features except for the Tree Views
 * will be disabled.
 */
export async function deactivateExtensionFeatures() {
	state.theRightFileOpened = false;
	if (Global.changeTextDocumentDisposable) {
		Global.changeTextDocumentDisposable.dispose();
	}
	if (Global.contextAutocompleteDisposable) {
		Global.contextAutocompleteDisposable.dispose();
		Global.tagAutocompleteDisposable.dispose();
		Global.projectAutocompleteDisposable.dispose();
		Global.generalAutocompleteDisposable.dispose();
	}
	statusBar.hide();
	setContext(VscodeContext.isActive, false);
	await updateState();
	updateAllTreeViews();
}

export async function updateEverything(editor?: vscode.TextEditor) {
	await updateState(editor?.document);
	if (editor) {
		updateEditorDecorations(editor);
	}
	statusBar.updateText(state.tasks);
	updateAllTreeViews();
}
