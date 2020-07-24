import dayjs from 'dayjs';
import vscode, { window, workspace } from 'vscode';
import { resetAllRecurringTasks } from './commands';
import { updateCompletions } from './completionProviders';
import { updateEditorDecorations } from './decorations';
import { extensionConfig, Global, LAST_VISIT_STORAGE_KEY, state, statusBar, updateState } from './extension';
import { updateAllTreeViews } from './treeViewProviders/treeViews';
import { setContext } from './vscodeUtils';

export const THE_RIGHT_FILE_CONTEXT_KEY = 'todomd:isActive';

export function onChangeActiveTextEditor(editor: vscode.TextEditor | undefined): void {
	if (isTheRightFileFormat(editor)) {
		enterTheRightFile(editor!);
	} else {
		if (state.theRightFileOpened) {
			exitTheRightFile();
		}
	}
}

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
export function isTheRightFileFormat(editor?: vscode.TextEditor): boolean {
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
export function enterTheRightFile(editor: vscode.TextEditor) {
	state.theRightFileOpened = true;

	updateEverything(editor);

	Global.changeTextDocumentDisposable = workspace.onDidChangeTextDocument(onChangeTextDocument);
	updateCompletions();
	statusBar.updateText(state.tasks);
	statusBar.show();
	checkIfNewDayArrived();
	setContext(THE_RIGHT_FILE_CONTEXT_KEY, true);

	if (state.newDayArrived && !state.fileWasReset) {
		resetAllRecurringTasks(editor);
		state.fileWasReset = true;
	}
}
/**
 * When `todo.md` document is closed - all the features except for the Tree Views
 * will be disabled.
 */
export async function exitTheRightFile() {
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
	setContext(THE_RIGHT_FILE_CONTEXT_KEY, false);
	await updateState();
	updateAllTreeViews();
}

export async function updateEverything(editor?: vscode.TextEditor) {
	if (!editor) {
		return;
	}
	await updateState(editor.document);
	updateEditorDecorations(editor);
	statusBar.updateText(state.tasks);
	updateAllTreeViews();
}
