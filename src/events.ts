import dayjs from 'dayjs';
import vscode, { window, workspace } from 'vscode';
import { updateCompletions } from './completionProviders';
import { updateEditorDecorations } from './decorations';
import { getDocumentForDefaultFile, resetAllRecurringTasks } from './documentActions';
import { extensionConfig, Global, state, statusBar, updateLastVisitGlobalState, updateState } from './extension';
import { updateHover } from './hover/hoverProvider';
import { updateAllTreeViews } from './treeViewProviders/treeViews';
import { VscodeContext } from './types';
import { setContext } from './vscodeUtils';

export async function onChangeActiveTextEditor(editor: vscode.TextEditor | undefined): Promise<void> {
	if (state.theRightFileOpened) {
		deactivateEditorFeatures();
	}
	if (editor && isTheRightFileName(editor)) {
		state.activeDocument = editor.document;
		state.activeDocumentTabSize = typeof editor.options.tabSize === 'number' ? editor.options.tabSize : extensionConfig.tabSize;
		updateEverything(editor);
		await activateEditorFeatures(editor);
	} else {
		state.activeDocument = await getDocumentForDefaultFile();
		state.activeDocumentTabSize = extensionConfig.tabSize;
		setTimeout(() => {
			updateEverything();
		}, 15);// Workaround for event fired twice very fast when closing an editor
	}
}
export function checkIfNeedResetRecurringTasks(filePath: string): undefined | {lastVisit: Date} {
	const lastVisitForFile = state.lastVisitByFile[filePath];
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

	const needReset = checkIfNeedResetRecurringTasks(editor.document.uri.toString());
	if (needReset) {
		await resetAllRecurringTasks(editor.document, needReset.lastVisit);
		updateEverything();
		updateLastVisitGlobalState(editor.document.uri.toString(), new Date());
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
		Global.setDueDateAutocompleteDisposable.dispose();
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
