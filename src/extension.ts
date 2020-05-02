import { commands, window, workspace, Position, Range, TextEditor, TextDocument, TextLine } from 'vscode';
import * as vscode from 'vscode';

import { TagProvider } from './treeViewProviders/tagProvider';
import { TaskProvider } from './treeViewProviders/taskProvider';
import { IConfig, State, DueState } from './types';
import { isTheSameDay, appendTaskToFile } from './utils';
import { DueProvider, DueTreeItem } from './treeViewProviders/dueProvider';
import { parseDocument, Task } from './parse';
import { updateCompletions } from './completionProviders';
import { ProjectProvider } from './treeViewProviders/projectProvider';
import { insertSnippet, openFileInEditor } from './vscodeUtils';
import { ContextProvider } from './treeViewProviders/contextProvider';
import { sortTasks, SortProperty } from './sort';
import { getDateInISOFormat } from './timeUtils';

export const state: State = {
	tasks: [],
	tagsForProvider: [],
	projectsForProvider: [],
	contextsForProvider: [],
};

export const EXTENSION_NAME = 'todomd';
const LAST_VISIT_STORAGE_KEY = 'LAST_VISIT_STORAGE_KEY';

export let config = workspace.getConfiguration(EXTENSION_NAME) as any as IConfig;
let fileWasReset = false;
let newDayArrived = false;
let theRightFileOpened = false;
export const subscriptions: vscode.Disposable[] = [];

const statusBarEntry = window.createStatusBarItem(1, -20000);

export class GlobalVars {
	public static tagAutocompleteDisposable: vscode.Disposable;
	public static projectAutocompleteDisposable: vscode.Disposable;
	public static contextAutocompleteDisposable: vscode.Disposable;
	public static generalAutocompleteDisposable: vscode.Disposable;
}

export function activate(extensionContext: vscode.ExtensionContext): void {
	const globalState = extensionContext.globalState;

	let changeTextDocumentDisposable: vscode.Disposable;

	let completedTaskDecorationType: vscode.TextEditorDecorationType;
	let priority1DecorationType: vscode.TextEditorDecorationType;
	let priority2DecorationType: vscode.TextEditorDecorationType;
	let priority3DecorationType: vscode.TextEditorDecorationType;
	let priority4DecorationType: vscode.TextEditorDecorationType;
	let priority5DecorationType: vscode.TextEditorDecorationType;
	let tagsDecorationType: vscode.TextEditorDecorationType;
	let specialTagDecorationType: vscode.TextEditorDecorationType;
	let tagsDelimiterDecorationType: vscode.TextEditorDecorationType;
	let projectDecorationType: vscode.TextEditorDecorationType;
	let contextDecorationType: vscode.TextEditorDecorationType;
	let notDueDecorationType: vscode.TextEditorDecorationType;
	let dueDecorationType: vscode.TextEditorDecorationType;
	let overdueDecorationType: vscode.TextEditorDecorationType;

	checkIfNewDayArrived();
	updateDecorationsStyle();

	const tagProvider = new TagProvider([]);
	const tagsView = vscode.window.createTreeView(`${EXTENSION_NAME}.tags`, {
		treeDataProvider: tagProvider,
		showCollapseAll: true,
	});

	const taskProvider = new TaskProvider([]);
	const tasksView = vscode.window.createTreeView(`${EXTENSION_NAME}.tasks`, {
		treeDataProvider: taskProvider,
	});

	const dueProvider = new DueProvider([]);
	const dueView = vscode.window.createTreeView(`${EXTENSION_NAME}.due`, {
		treeDataProvider: dueProvider,
		showCollapseAll: true,
	});

	const projectProvider = new ProjectProvider([]);
	const projectView = vscode.window.createTreeView(`${EXTENSION_NAME}.projects`, {
		treeDataProvider: projectProvider,
		showCollapseAll: true,
	});

	const contextProvider = new ContextProvider([]);
	const contextView = vscode.window.createTreeView(`${EXTENSION_NAME}.contexts`, {
		treeDataProvider: contextProvider,
		showCollapseAll: true,
	});

	updateAllTreeViews();

	function getDueTasks(): Task[] {
		return state.tasks.filter(task => task.isDue && !task.done);
	}
	function getTasksForTreeProvider(): Task[] {
		return state.tasks.filter(task => task);
	}

	function updateDecorationsStyle(): void {
		completedTaskDecorationType = window.createTextEditorDecorationType({
			isWholeLine: true,
			textDecoration: 'line-through rgba(255, 255, 255, 0.35)',
			light: {
				textDecoration: 'line-through rgba(0, 0, 0, 0.25)',
			},
		});
		priority1DecorationType = window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('todomd.priority1Foreground'),
		});
		priority2DecorationType = window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('todomd.priority2Foreground'),
		});
		priority3DecorationType = window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('todomd.priority3Foreground'),
		});
		priority4DecorationType = window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('todomd.priority4Foreground'),
		});
		priority5DecorationType = window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('todomd.priority5Foreground'),
		});
		tagsDecorationType = window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('todomd.tagForeground'),
		});
		specialTagDecorationType = window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('todomd.specialTagForeground'),
		});
		tagsDelimiterDecorationType = window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('todomd.tagDelimiterForeground'),
		});
		projectDecorationType = window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('todomd.projectForeground'),
		});
		contextDecorationType = window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('todomd.contextForeground'),
		});
		notDueDecorationType = window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('todomd.notDueForeground'),
		});
		dueDecorationType = window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('todomd.dueForeground'),
		});
		overdueDecorationType = window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('todomd.overdueForeground'),
		});
	}

	onChangeActiveTextEditor(window.activeTextEditor);
	window.onDidChangeActiveTextEditor(onChangeActiveTextEditor);

	function onChangeActiveTextEditor(editor: vscode.TextEditor | undefined): void {
		if (isTheRightFileFormat(editor)) {
			theRightFileOpened = true;
			updateEverything(editor);

			enterTheRightFile();
			checkIfNewDayArrived();

			if (newDayArrived && !fileWasReset) {
				// vscode.window.showInformationMessage('SHOULD RESET ALL IN FILE');
				uncheckAllRecurringTasks(editor!);
				fileWasReset = true;
			}
		} else {
			theRightFileOpened = false;
			exitTheRightFile();
		}
	}
	function showStatusBarEntry() {
		statusBarEntry.show();
	}
	function hideStatusBarEntry() {
		statusBarEntry.hide();
	}
	function updateStatusBarEntry() {
		if (statusBarEntry) {
			const completedTasks = state.tasks.filter(t => t.done);
			statusBarEntry.text = `( ${completedTasks.length} / ${state.tasks.length} )`;
		}
	}
	function checkIfNewDayArrived(): void {
		const lastVisit = globalState.get<string | undefined>(LAST_VISIT_STORAGE_KEY);
		if (lastVisit && !isTheSameDay(new Date(lastVisit), new Date())) {
			// window.showInformationMessage('new day');
			globalState.update(LAST_VISIT_STORAGE_KEY, new Date());
			newDayArrived = true;
			fileWasReset = false;
		}
		// first visit ever?
		if (!lastVisit) {
			// window.showInformationMessage('first ever visit');
			globalState.update(LAST_VISIT_STORAGE_KEY, new Date());
		}
	}
	function uncheckAllRecurringTasks(editor: TextEditor): void {
		editor.edit(builder => {
			for (const line of state.tasks) {
				if (line.isRecurring && line.done) {
					const ln = line.ln;
					const lineAt = editor.document.lineAt(ln);
					builder.delete(new vscode.Range(ln, lineAt.firstNonWhitespaceCharacterIndex, ln, lineAt.firstNonWhitespaceCharacterIndex + config.doneSymbol.length));
				}
			}
		});
	}
	async function updateState(document?: vscode.TextDocument) {
		if (!document) {
			document = await workspace.openTextDocument(vscode.Uri.file(config.defaultFile));
		}
		const result = parseDocument(document);
		state.tasks = result.tasks;
		state.tagsForProvider = result.sortedTags;
		state.projectsForProvider = result.projects;
		state.contextsForProvider = result.contexts;
		return document;
	}
	commands.registerTextEditorCommand('todomd.resetAllRepeatingTasks', editor => {
		uncheckAllRecurringTasks(editor);
	});
	function onChangeTextDocument(e: vscode.TextDocumentChangeEvent): void {
		const activeTextEditor = window.activeTextEditor;
		if (activeTextEditor && theRightFileOpened) {
			updateEverything(activeTextEditor);
		}
	}

	function isTheRightFileFormat(editor?: vscode.TextEditor): boolean {
		if (editor === undefined) {
			editor = window.activeTextEditor;
			if (editor === undefined) {
				return false;
			}
		}
		const documentFilter: vscode.DocumentFilter = {
			pattern: config.activatePattern,
		};
		return vscode.languages.match(documentFilter, editor.document) !== 0;
	}
	function enterTheRightFile() {
		changeTextDocumentDisposable = workspace.onDidChangeTextDocument(onChangeTextDocument);
		updateCompletions();
		showStatusBarEntry();
		updateStatusBarEntry();
	}
	function exitTheRightFile() {
		if (changeTextDocumentDisposable) {
			changeTextDocumentDisposable.dispose();
		}
		if (GlobalVars.contextAutocompleteDisposable) {
			GlobalVars.contextAutocompleteDisposable.dispose();
			GlobalVars.tagAutocompleteDisposable.dispose();
			GlobalVars.projectAutocompleteDisposable.dispose();
			GlobalVars.generalAutocompleteDisposable.dispose();
		}
		hideStatusBarEntry();
	}

	function updateEverything(editor?: vscode.TextEditor): void {
		if (!editor) {
			return;
		}
		updateState(editor.document);
		updateEditorDecorations(editor);
		updateStatusBarEntry();
		updateAllTreeViews();
	}
	function updateEditorDecorations(editor: TextEditor) {
		const completedDecorationOptions: Range[] = [];
		const tagsDecorationOptions: Range[] = [];
		const priority1DecorationOptions: Range[] = [];
		const priority2DecorationOptions: Range[] = [];
		const priority3DecorationOptions: Range[] = [];
		const priority4DecorationOptions: Range[] = [];
		const priority5DecorationOptions: Range[] = [];
		const tagsDelimiterDecorationOptions: Range[] = [];
		const specialtagDecorationOptions: Range[] = [];
		const projectDecorationOptions: Range[] = [];
		const contextDecorationOptions: Range[] = [];
		const notDueDecorationOptions: Range[] = [];
		const dueDecorationOptions: Range[] = [];
		const overdueDecorationOptions: Range[] = [];

		for (const line of state.tasks) {
			if (line.done) {
				completedDecorationOptions.push(new vscode.Range(line.ln, 0, line.ln, 0));
			}
			if (line.tagsRange) {
				tagsDecorationOptions.push(...line.tagsRange);
				// @ts-ignore
				tagsDelimiterDecorationOptions.push(...line.tagsDelimiterRanges);
			}
			if (line.priorityRange) {
				if (line.priority === 'A') {
					priority1DecorationOptions.push(line.priorityRange);
				} else if (line.priority === 'B') {
					priority2DecorationOptions.push(line.priorityRange);
				} else if (line.priority === 'C') {
					priority3DecorationOptions.push(line.priorityRange);
				} else if (line.priority === 'D') {
					priority4DecorationOptions.push(line.priorityRange);
				} else {
					priority5DecorationOptions.push(line.priorityRange);
				}
			}
			if (line.specialTagRanges.length) {
				specialtagDecorationOptions.push(...line.specialTagRanges);
			}
			if (line.contextRanges && line.contextRanges.length) {
				contextDecorationOptions.push(...line.contextRanges);
			}
			if (line.projectRanges && line.projectRanges.length) {
				projectDecorationOptions.push(...line.projectRanges);
			}
			if (line.dueRange) {
				if (line.isDue === DueState.due) {
					dueDecorationOptions.push(line.dueRange);
				} else if (line.isDue === DueState.notDue) {
					notDueDecorationOptions.push(line.dueRange);
				} else if (line.isDue === DueState.overdue) {
					overdueDecorationOptions.push(line.dueRange);
				}
			}
		}

		editor.setDecorations(completedTaskDecorationType, completedDecorationOptions);
		editor.setDecorations(tagsDecorationType, tagsDecorationOptions);
		editor.setDecorations(specialTagDecorationType, specialtagDecorationOptions);
		editor.setDecorations(priority1DecorationType, priority1DecorationOptions);
		editor.setDecorations(priority2DecorationType, priority2DecorationOptions);
		editor.setDecorations(priority3DecorationType, priority3DecorationOptions);
		editor.setDecorations(priority4DecorationType, priority4DecorationOptions);
		editor.setDecorations(priority5DecorationType, priority5DecorationOptions);
		editor.setDecorations(tagsDelimiterDecorationType, tagsDelimiterDecorationOptions);
		editor.setDecorations(projectDecorationType, projectDecorationOptions);
		editor.setDecorations(contextDecorationType, contextDecorationOptions);
		editor.setDecorations(notDueDecorationType, notDueDecorationOptions);
		editor.setDecorations(dueDecorationType, dueDecorationOptions);
		editor.setDecorations(overdueDecorationType, overdueDecorationOptions);
	}
	function updateAllTreeViews(): void {
		const dueTasks = getDueTasks();
		dueProvider.refresh(dueTasks);
		dueView.title = `due (${dueTasks.length})`;

		tagProvider.refresh(state.tagsForProvider);
		tagsView.title = `tags (${state.tagsForProvider.length})`;

		const tasksForProvider = getTasksForTreeProvider();
		taskProvider.refresh(tasksForProvider);
		tasksView.title = `tasks (${tasksForProvider.length})`;

		projectProvider.refresh(state.projectsForProvider);
		projectView.title = `projects (${state.projectsForProvider.length})`;

		contextProvider.refresh(state.contextsForProvider);
		contextView.title = `contexts (${state.contextsForProvider.length})`;
	}

	// ──────────────────────────────────────────────────────────────────────
	// ──── Commands ────────────────────────────────────────────────────────
	// ──────────────────────────────────────────────────────────────────────
	commands.registerTextEditorCommand(`${EXTENSION_NAME}.toggleDone`, (editor, edit, treeItem?: DueTreeItem) => {
		const ln = treeItem ? treeItem.parsedLine.ln : editor.selection.active.line;
		toggleTaskAtLine(ln, editor.document);
	});
	commands.registerTextEditorCommand(`${EXTENSION_NAME}.archiveCompletedTasks`, editor => {
		if (!config.defaultArchiveFile) {
			vscode.window.showWarningMessage('No default archive file specified');
			return;
		}
		const completedTasks = state.tasks.filter(t => t.done && !t.isRecurring);
		if (!completedTasks.length) {
			return;
		}
		const edit = new vscode.WorkspaceEdit();
		for (const task of completedTasks) {
			const line = editor.document.lineAt(task.ln);
			appendTaskToFile(line.text, config.defaultArchiveFile);
			edit.delete(editor.document.uri, line.rangeIncludingLineBreak);
		}
		workspace.applyEdit(edit);
	});
	commands.registerTextEditorCommand(`${EXTENSION_NAME}.sortByPriority`, (editor, edit) => {
		const selection = editor.selection;
		if (selection.isEmpty) {
			vscode.window.showInformationMessage('Select tasks to sort');
			return;
		}
		const lineStart = selection.start.line;
		const lineEnd = selection.end.line;
		const tasks: any[] = [];
		for (let i = lineStart; i <= lineEnd; i++) {
			const task: any = getTaskAtLine(i);
			if (task) {
				task.line = editor.document.lineAt(i).text;
				tasks.push(task);
			}
		}
		const sortedTasks: any[] = sortTasks(tasks, SortProperty.priority);
		const result = sortedTasks.map(t => t.line).join('\n');
		edit.replace(getFullRangeFromLines(editor.document, lineStart, lineEnd), result);
	});
	function getFullRangeFromLines(document: TextDocument, lineStart: number, lineEnd: number): Range {
		const lineAtTheEnd = document.lineAt(lineEnd);
		return new Range(lineStart, 0, lineEnd, lineAtTheEnd.range.end.character);
	}
	commands.registerCommand(`${EXTENSION_NAME}.getNextTask`, () => {
		// if (theRightFileOpened) {
		// 	return;
		// }
		const document = updateState();
		let tasks = state.tasks.filter(t => !t.done);
		if (!tasks.length) {
			vscode.window.showInformationMessage('No tasks');
			return;
		}
		const dueTasks = tasks.filter(t => t.isDue);
		if (dueTasks.length) {
			tasks = dueTasks;
		}

		const sortedTasks = sortTasks(tasks, SortProperty.priority);
		vscode.window.showInformationMessage(sortedTasks[0].title);
	});
	commands.registerCommand(`${EXTENSION_NAME}.addTask`, async () => {
		if (theRightFileOpened) {
			return;
		}
		if (config.defaultFile) {
			const text = await window.showInputBox();
			if (!text) {
				return;
			}
			appendTaskToFile(text, config.defaultFile);
		}
	});
	commands.registerCommand(`${EXTENSION_NAME}.openDefaultArvhiveFile`, () => {
		openFileInEditor(config.defaultArchiveFile);
	});
	commands.registerCommand(`${EXTENSION_NAME}.completeTask`, async () => {
		const document = await updateState();
		const array = [];
		for (const task of state.tasks) {
			if (task.done) {
				continue;
			}
			array.push(task.title);
		}
		const result = await window.showQuickPick(array);
		if (!result) {
			return;
		}
		const task = state.tasks.find(t => t.title === result);
		if (!task) {
			return;
		}
		toggleTaskAtLine(task.ln, document);
	});
	commands.registerTextEditorCommand(`${EXTENSION_NAME}.applyFilter`, editor => {
		vscode.window.showInformationMessage('Not there yet.');
	});
	commands.registerTextEditorCommand(`${EXTENSION_NAME}.insertTodayDate`, editor => {
		insertSnippet(getDateInISOFormat(new Date()));
	});
	async function toggleTaskAtLine(ln: number, document: TextDocument): Promise<void> {
		const firstNonWhitespaceCharacterIndex = document.lineAt(ln).firstNonWhitespaceCharacterIndex;
		const task = getTaskAtLine(ln);
		if (!task) {
			return;
		}
		const line = document.lineAt(ln);
		const workspaceEdit = new vscode.WorkspaceEdit();
		if (task.done) {
			if (!config.addCompletionDate) {
				// TODO: check if the prefix exists
				workspaceEdit.delete(document.uri, new vscode.Range(ln, firstNonWhitespaceCharacterIndex, ln, firstNonWhitespaceCharacterIndex + config.doneSymbol.length));
			} else {
				const completionDateRegex = /\s{cm:\d{4}-\d{2}-\d{2}}\s?/;// {cm:2020-05-01}
				const match = completionDateRegex.exec(line.text);
				if (match) {
					workspaceEdit.delete(document.uri, new Range(ln, match.index, ln, match.index + match[0].length));
				}
			}
		} else {
			if (config.addCompletionDate) {
				workspaceEdit.insert(document.uri, new vscode.Position(ln, line.range.end.character), ` {cm:${getDateInISOFormat(new Date())}}`);
			} else {
				workspaceEdit.insert(document.uri, new vscode.Position(ln, firstNonWhitespaceCharacterIndex), config.doneSymbol);
			}
		}
		await workspace.applyEdit(workspaceEdit);
		const secondWorkspaceEdit = new vscode.WorkspaceEdit();
		if (config.autoArchiveTasks) {
			if (!task.done || task.isRecurring) {
				const possiblyChangedLine = document.lineAt(ln);
				appendTaskToFile(possiblyChangedLine.text, config.defaultArchiveFile);
				secondWorkspaceEdit.delete(document.uri, possiblyChangedLine.rangeIncludingLineBreak);
			}
		}
		workspace.applyEdit(secondWorkspaceEdit);// Not possible to apply conflicting ranges with just one edit
	}
	commands.registerCommand(`${EXTENSION_NAME}.clearGlobalState`, () => {
		// @ts-ignore No API
		globalState._value = {};
		globalState.update('hack', 'toClear');// TODO: is this required to clear state?
	});
	commands.registerCommand(`${EXTENSION_NAME}.goToLine`, (lineNumber: number) => {
		const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
		const { activeTextEditor } = window;
		if (!activeTextEditor) {
			return;
		}
		vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
		activeTextEditor.selection = new vscode.Selection(range.start, range.end);
		activeTextEditor.revealRange(range, vscode.TextEditorRevealType.Default);
	});
	// Language features
	function disposeEverything(): void {
		if (completedTaskDecorationType) {
			completedTaskDecorationType.dispose();
		}
		if (tagsDecorationType) {
			tagsDecorationType.dispose();
		}
		if (projectDecorationType) {
			projectDecorationType.dispose();
		}
		if (notDueDecorationType) {
			notDueDecorationType.dispose();
		}
		if (dueDecorationType) {
			dueDecorationType.dispose();
		}
		if (overdueDecorationType) {
			overdueDecorationType.dispose();
		}
		// ================================================================================
		if (changeTextDocumentDisposable) {
			changeTextDocumentDisposable.dispose();
		}

		for (const disposable of subscriptions) {
			disposable.dispose();
		}
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
	extensionContext.subscriptions.push(tagsView, dueView, tasksView);
}

function getTaskAtLine(lineNumber: number): Task | undefined {
	for (const line of state.tasks) {
		if (line.ln === lineNumber) {
			return line;
		}
	}
	return undefined;
}

export function deactivate(): void {
	for (const disposable of subscriptions) {
		if (disposable) {
			disposable.dispose();
		}
	}
}
