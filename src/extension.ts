import { window, workspace } from 'vscode';
import * as vscode from 'vscode';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);
dayjs.extend(relativeTime);



import { IConfig, State } from './types';
import { parseDocument } from './parse';
import { updateDecorationsStyle } from './decorations';
import { registerCommands } from './commands';
import { updateAllTreeViews } from './treeViewProviders/treeViews';
import { checkIfNewDayArrived, onChangeActiveTextEditor, updateEverything } from './events';
import { createTreeViews } from './treeViewProviders/treeViews';

export const state: State = {
	tasks: [],
	tagsForProvider: [],
	projectsForProvider: [],
	contextsForProvider: [],
	commentLines: [],
	theRightFileOpened: false,
	fileWasReset: false,
	newDayArrived: false,
	taskTreeViewFilterValue: '',
};

export const EXTENSION_NAME = 'todomd';
export const LAST_VISIT_STORAGE_KEY = 'LAST_VISIT_STORAGE_KEY';

export let config = workspace.getConfiguration(EXTENSION_NAME) as any as IConfig;
export const statusBarEntry = window.createStatusBarItem(1, -20000);
/**
 * Global variables
 */
export class G {
	static tagAutocompleteDisposable: vscode.Disposable;
	static projectAutocompleteDisposable: vscode.Disposable;
	static contextAutocompleteDisposable: vscode.Disposable;
	static generalAutocompleteDisposable: vscode.Disposable;

	static changeTextDocumentDisposable: vscode.Disposable;

	static completedTaskDecorationType: vscode.TextEditorDecorationType;
	static commentDecorationType: vscode.TextEditorDecorationType;
	static priority1DecorationType: vscode.TextEditorDecorationType;
	static priority2DecorationType: vscode.TextEditorDecorationType;
	static priority3DecorationType: vscode.TextEditorDecorationType;
	static priority4DecorationType: vscode.TextEditorDecorationType;
	static priority5DecorationType: vscode.TextEditorDecorationType;
	static priority6DecorationType: vscode.TextEditorDecorationType;
	static tagsDecorationType: vscode.TextEditorDecorationType;
	static specialTagDecorationType: vscode.TextEditorDecorationType;
	static tagsDelimiterDecorationType: vscode.TextEditorDecorationType;
	static projectDecorationType: vscode.TextEditorDecorationType;
	static contextDecorationType: vscode.TextEditorDecorationType;
	static notDueDecorationType: vscode.TextEditorDecorationType;
	static dueDecorationType: vscode.TextEditorDecorationType;
	static overdueDecorationType: vscode.TextEditorDecorationType;
}

export let globalState: vscode.Memento;

export function activate(extensionContext: vscode.ExtensionContext): void {
	globalState = extensionContext.globalState;
	updateDecorationsStyle();
	// checkIfNewDayArrived();
	registerCommands();
	createTreeViews();
	onChangeActiveTextEditor(window.activeTextEditor);
	updateAllTreeViews();

	function onConfigChange(e: vscode.ConfigurationChangeEvent): void {
		if (!e.affectsConfiguration(EXTENSION_NAME)) return;
		updateConfig();
	}

	function updateConfig(): void {
		config = workspace.getConfiguration(EXTENSION_NAME) as any as IConfig;
		// TODO: validation function for the entire config

		disposeEverything();
		updateDecorationsStyle();
		updateEverything();
	}

	extensionContext.subscriptions.push(workspace.onDidChangeConfiguration(onConfigChange));
}

// vscode.languages.registerHoverProvider({ scheme: 'file' }, {
// 	provideHover(document, position, token) {
// 		const dateRegexp = /\d{4}-\d{2}-\d{2}/;
// 		const range = document.getWordRangeAtPosition(position, dateRegexp);
// 		if (!range) {
// 			return undefined;
// 		}
// 		const word = document.getText(range);
// 		const diff = dayjs().to(dayjs(word));
// 		if (word) {
// 			return new vscode.Hover({
// 				language: 'Hello language',
// 				value: String(diff),
// 			});
// 		}
// 		return undefined;
// 	},
// });

export async function updateState(document?: vscode.TextDocument) {
	if (!document) {
		document = await getDocumentForDefaultFile();
	}
	const result = parseDocument(document);
	state.tasks = result.tasks;
	state.tagsForProvider = result.sortedTags;
	state.projectsForProvider = result.projects;
	state.contextsForProvider = result.contexts;
	state.commentLines = result.commentLines;
	return document;
}
function disposeEverything(): void {
	if (G.completedTaskDecorationType) {
		// if one set - all set
		G.completedTaskDecorationType.dispose();
		G.commentDecorationType.dispose();
		G.priority1DecorationType.dispose();
		G.priority2DecorationType.dispose();
		G.priority3DecorationType.dispose();
		G.priority4DecorationType.dispose();
		G.priority5DecorationType.dispose();
		G.priority6DecorationType.dispose();
		G.tagsDecorationType.dispose();
		G.specialTagDecorationType.dispose();
		G.tagsDelimiterDecorationType.dispose();
		G.projectDecorationType.dispose();
		G.contextDecorationType.dispose();
		G.notDueDecorationType.dispose();
		G.dueDecorationType.dispose();
		G.overdueDecorationType.dispose();
	}
	if (G.changeTextDocumentDisposable) {
		G.changeTextDocumentDisposable.dispose();
	}
}

export async function getDocumentForDefaultFile() {
	return await workspace.openTextDocument(vscode.Uri.file(config.defaultFile));
}

export function deactivate(): void {
	disposeEverything();
}
