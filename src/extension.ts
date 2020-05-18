import { window, workspace } from 'vscode';
import * as vscode from 'vscode';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(isoWeek);
dayjs.Ls.en.weekStart = 1;


import { IConfig, State, TagForProvider, ProjectForProvider, ContextForProvider, Items, SortTags } from './types';
import { parseDocument, TheTask } from './parse';
import { updateDecorationsStyle } from './decorations';
import { registerCommands, resetAllRecurringTasks, updateArchivedTasks } from './commands';
import { updateAllTreeViews } from './treeViewProviders/treeViews';
import { checkIfNewDayArrived, onChangeActiveTextEditor, updateEverything } from './events';
import { createTreeViews } from './treeViewProviders/treeViews';
import { updateHover } from './hover';

// @ts-ignore
export const state: State = {
	tasks: [],
	tagsForProvider: [],
	projectsForProvider: [],
	contextsForProvider: [],
	archivedTasks: [],
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
export class Global {
	static tagAutocompleteDisposable: vscode.Disposable;
	static projectAutocompleteDisposable: vscode.Disposable;
	static contextAutocompleteDisposable: vscode.Disposable;
	static generalAutocompleteDisposable: vscode.Disposable;

	static changeTextDocumentDisposable: vscode.Disposable;
	static hoverDisposable: vscode.Disposable;

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
	static closestDueDateDecorationType: vscode.TextEditorDecorationType;
}

export async function activate(extensionContext: vscode.ExtensionContext) {
	state.extensionContext = extensionContext;
	updateDecorationsStyle();
	registerCommands();
	createTreeViews();
	onChangeActiveTextEditor(window.activeTextEditor);
	window.onDidChangeActiveTextEditor(onChangeActiveTextEditor);
	updateAllTreeViews();
	updateHover();
	updateArchivedTasks();

	const isNewDay = checkIfNewDayArrived();
	if (isNewDay && !state.theRightFileOpened) {
		await updateState();
		resetAllRecurringTasks();
	}

	function onConfigChange(e: vscode.ConfigurationChangeEvent): void {
		if (!e.affectsConfiguration(EXTENSION_NAME)) return;
		updateConfig();
	}

	function updateConfig(): void {
		config = workspace.getConfiguration(EXTENSION_NAME) as any as IConfig;

		disposeEverything();
		updateDecorationsStyle();
		updateEverything();
	}

	extensionContext.subscriptions.push(workspace.onDidChangeConfiguration(onConfigChange));
}

export async function updateState(document?: vscode.TextDocument) {
	if (!document) {
		document = await getDocumentForDefaultFile();
	}
	const result = parseDocument(document);
	state.tasks = result.tasks;
	state.commentLines = result.commentLines;
	const forProvider = groupAndSortForProvider(state.tasks);
	state.tagsForProvider = forProvider.sortedTags;
	state.projectsForProvider = forProvider.projects;
	state.contextsForProvider = forProvider.contexts;
	return document;
}
function disposeEverything(): void {
	if (Global.completedTaskDecorationType) {
		// if one set - all set
		Global.completedTaskDecorationType.dispose();
		Global.commentDecorationType.dispose();
		Global.priority1DecorationType.dispose();
		Global.priority2DecorationType.dispose();
		Global.priority3DecorationType.dispose();
		Global.priority4DecorationType.dispose();
		Global.priority5DecorationType.dispose();
		Global.priority6DecorationType.dispose();
		Global.tagsDecorationType.dispose();
		Global.specialTagDecorationType.dispose();
		Global.tagsDelimiterDecorationType.dispose();
		Global.projectDecorationType.dispose();
		Global.contextDecorationType.dispose();
		Global.notDueDecorationType.dispose();
		Global.dueDecorationType.dispose();
		Global.overdueDecorationType.dispose();
		Global.closestDueDateDecorationType.dispose();
	}
	if (Global.changeTextDocumentDisposable) {
		Global.changeTextDocumentDisposable.dispose();
	}
}

interface ForProvider {
	sortedTags: TagForProvider[];
	projects: ProjectForProvider[];
	contexts: ContextForProvider[];
}
export function groupAndSortForProvider(tasks: TheTask[]): ForProvider {
	const tagMap: {
		[tag: string]: Items[];
	} = {};
	const projectMap: {
		[key: string]: Items[];
	} = {};
	const contextMap: {
		[key: string]: Items[];
	} = {};
	for (const task of tasks) {
		// Tags grouping
		for (const tag of task.tags) {
			if (!tagMap[tag]) {
				tagMap[tag] = [];
			}
			tagMap[tag].push({
				lineNumber: task.ln,
				title: task.title,
			});
		}
		// Projects grouping
		if (task.projects.length) {
			for (const project of task.projects) {
				if (!projectMap[project]) {
					projectMap[project] = [];
				}
				projectMap[project].push({
					lineNumber: task.ln,
					title: task.title,
				});
			}
		}
		// Contexts grouping
		if (task.contexts.length) {
			for (const context of task.contexts) {
				if (!contextMap[context]) {
					contextMap[context] = [];
				}
				contextMap[context].push({
					lineNumber: task.ln,
					title: task.title,
				});
			}
		}
	}
	const tags = [];
	for (const key in tagMap) {
		tags.push({
			tag: key,
			items: tagMap[key],
		});
	}
	let sortedTags: TagForProvider[];
	if (config.sortTagsView === SortTags.alphabetic) {
		sortedTags = tags.sort((a, b) => a.tag.localeCompare(b.tag));
	} else {
		sortedTags = tags.sort((a, b) => b.items.length - a.items.length);
	}

	const projects = [];
	for (const key in projectMap) {
		projects.push({
			project: key,
			items: projectMap[key],
		});
	}
	const contexts = [];
	for (const key in contextMap) {
		contexts.push({
			context: key,
			items: contextMap[key],
		});
	}
	return {
		contexts,
		projects,
		sortedTags,
	};
}

export async function getDocumentForDefaultFile() {
	return await workspace.openTextDocument(vscode.Uri.file(config.defaultFile));
}

export function deactivate(): void {
	disposeEverything();
}
