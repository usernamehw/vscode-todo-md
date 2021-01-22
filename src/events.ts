import dayjs from 'dayjs';
import vscode, { window, workspace } from 'vscode';
import { updateCompletions } from './completionProviders';
import { updateEditorDecorations } from './decorations';
import { resetAllRecurringTasks } from './documentActions';
import { extensionConfig, extensionState, Global, statusBar, updateLastVisitGlobalState, updateState } from './extension';
import { updateHover } from './hover/hoverProvider';
import { updateAllTreeViews } from './treeViewProviders/treeViews';
import { VscodeContext } from './types';
import { getDocumentForDefaultFile } from './utils/extensionUtils';
import { setContext } from './utils/vscodeUtils';
/**
 * Active text editor changes (tab). There is a <s>bug</s>(feature) that event fired twice in rapid succession when you close the tab.
 */
export async function onChangeActiveTextEditor(editor: vscode.TextEditor | undefined): Promise<void> {
	if (extensionState.theRightFileOpened) {
		deactivateEditorFeatures();
	}
	if (editor && isTheRightFileName(editor)) {
		extensionState.activeDocument = editor.document;
		extensionState.activeDocumentTabSize = typeof editor.options.tabSize === 'number' ? editor.options.tabSize : extensionConfig.tabSize;
		updateEverything(editor);
		await activateEditorFeatures(editor);
	} else {
		extensionState.activeDocument = await getDocumentForDefaultFile();
		extensionState.activeDocumentTabSize = extensionConfig.tabSize;
		setTimeout(() => {
			updateEverything();
		}, 15);// Workaround for event fired twice very fast when closing an editor
	}
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
export function onChangeTextDocument(e: vscode.TextDocumentChangeEvent): void {
	const activeTextEditor = window.activeTextEditor;
	if (activeTextEditor && extensionState.theRightFileOpened) {
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
 * There's a number of editor features that are only needed when the active file matches a pattern.
 *
 * For example: completions, status bar text, editor hover.
 */
export async function activateEditorFeatures(editor: vscode.TextEditor) {
	extensionState.theRightFileOpened = true;
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
	extensionState.theRightFileOpened = false;
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
 * - Update state (parse the active/default file)
 * - Update editor decorations
 * - Update status bar item
 * - Update all tree views (including webview, excluding archived tasks)
 */
export async function updateEverything(editor?: vscode.TextEditor) {
	await updateState();
	if (editor) {
		updateEditorDecorations(editor);
		statusBar.updateText(extensionState.tasks);
	}
	updateAllTreeViews();
}
