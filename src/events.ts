import dayjs from 'dayjs';
import * as vscode from 'vscode';
import { window, workspace } from 'vscode';
import { resetAllRecurringTasks } from './commands';
import { updateCompletions } from './completionProviders';
import { updateEditorDecorations } from './decorations';
import { extensionConfig, Global, LAST_VISIT_STORAGE_KEY, state, updateState } from './extension';
import { updateHover } from './hover';
import { hideStatusBarEntry, showStatusBarEntry, updateStatusBarEntry } from './statusBar';
import { updateAllTreeViews } from './treeViewProviders/treeViews';
import { setContext } from './vscodeUtils';

export const THE_RIGHT_FILE = 'todomd:isActive';

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
		// window.showInformationMessage('new day');
		state.extensionContext.globalState.update(LAST_VISIT_STORAGE_KEY, new Date());
		state.newDayArrived = true;
		state.fileWasReset = false;
		return true;
	}
	// first visit ever?
	if (!lastVisit) {
		// window.showInformationMessage('first ever visit');
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
export function enterTheRightFile(editor: vscode.TextEditor) {
	state.theRightFileOpened = true;
	updateEverything(editor);
	Global.changeTextDocumentDisposable = workspace.onDidChangeTextDocument(onChangeTextDocument);
	updateCompletions();
	showStatusBarEntry();
	updateStatusBarEntry();
	updateHover();
	checkIfNewDayArrived();
	setContext(THE_RIGHT_FILE, true);
	if (state.newDayArrived && !state.fileWasReset) {
		// vscode.window.showInformationMessage('SHOULD RESET ALL IN FILE');
		resetAllRecurringTasks(editor);
		state.fileWasReset = true;
	}
}
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
	if (Global.hoverDisposable) {
		Global.hoverDisposable.dispose();
	}
	hideStatusBarEntry();
	setContext(THE_RIGHT_FILE, false);
	await updateState();
	updateAllTreeViews();
}

export async function updateEverything(editor?: vscode.TextEditor) {
	if (!editor) {
		return;
	}
	await updateState(editor.document);
	updateEditorDecorations(editor);
	updateStatusBarEntry();
	updateAllTreeViews();
}
