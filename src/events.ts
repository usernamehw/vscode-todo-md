import dayjs from 'dayjs';
import vscode, { window, workspace } from 'vscode';
import { updateCompletions } from './completionProviders';
import { updateEditorDecorations } from './decorations';
import { getDocumentForDefaultFile, resetAllRecurringTasks } from './documentActions';
import { extensionConfig, Global, LAST_VISIT_STORAGE_KEY, state, statusBar, updateState } from './extension';
import { updateHover } from './hoverProvider';
import { updateAllTreeViews } from './treeViewProviders/treeViews';
import { VscodeContext } from './types';
import { setContext } from './vscodeUtils';

export async function onChangeActiveTextEditor(editor: vscode.TextEditor | undefined): Promise<void> {
	if (state.theRightFileOpened) {
		deactivateEditorFeatures();
	}
	if (editor && isTheRightFileName(editor)) {
		state.activeDocument = editor.document;
		updateEverything(editor);
		await activateEditorFeatures(editor);
	} else {
		state.activeDocument = await getDocumentForDefaultFile();
		setTimeout(() => {
			updateEverything();
		}, 15);// Workaround for event fired twice very fast when closing an editor
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

export function onChangeTextDocument(e: vscode.TextDocumentChangeEvent): void {
	const activeTextEditor = window.activeTextEditor;
	if (activeTextEditor && state.theRightFileOpened) {
		updateEverything(activeTextEditor);
	}
}
/**
 * Match Uri of editor against a glob specified by user.
 */
export function isTheRightFileName(editor: vscode.TextEditor): boolean {
	return vscode.languages.match({
		pattern: extensionConfig.activatePattern,
	},	editor.document) !== 0;
}
/**
 * There's a number of features that extension provides.
 * They are only activated when user opens file named `todo.md` (by default)
 * Only then - completions, status bar text and other features are enabled.
 */
export async function activateEditorFeatures(editor: vscode.TextEditor) {
	state.theRightFileOpened = true;
	Global.changeTextDocumentDisposable = workspace.onDidChangeTextDocument(onChangeTextDocument);
	updateCompletions();
	updateHover();
	statusBar.show();
	await setContext(VscodeContext.isActive, true);
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
export function deactivateEditorFeatures() {
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
	if (Global.hoverDisposable) {
		Global.hoverDisposable.dispose();
	}
	statusBar.hide();
	setContext(VscodeContext.isActive, false);
}
/**
 * - Update state
 * - Update editor decorations
 * - Update status bar
 * - Update all tree views
 */
export async function updateEverything(editor?: vscode.TextEditor) {
	await updateState();
	if (editor) {
		updateEditorDecorations(editor);
		statusBar.updateText(state.tasks);
	}
	updateAllTreeViews();
}
