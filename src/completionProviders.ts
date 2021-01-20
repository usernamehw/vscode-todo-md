import dayjs from 'dayjs';
import vscode from 'vscode';
import { DueDate } from './dueDate';
import { extensionConfig, Global, state } from './extension';
import { helpCreateDueDate } from './time/setDueDateHelper';
import { getDateInISOFormat } from './time/timeUtils';
import { getWordAtPosition, getWordRangeAtPosition } from './utils/vscodeUtils';

export function updateCompletions(): void {
	if (Global.tagAutocompleteDisposable) {
		Global.tagAutocompleteDisposable.dispose();
		Global.projectAutocompleteDisposable.dispose();
		Global.contextAutocompleteDisposable.dispose();
		Global.generalAutocompleteDisposable.dispose();
	}

	Global.tagAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const wordAtCursor = getWordAtPosition(document, position);
				if (!wordAtCursor || !wordAtCursor.startsWith('#')) {
					return undefined;
				}
				const tagCompletions = [];
				const tags = Array.from(new Set(state.tags.concat(extensionConfig.tags)));
				for (const tag of tags) {
					const tagCompletion = new vscode.CompletionItem(tag, vscode.CompletionItemKind.Field);
					tagCompletion.commitCharacters = ['#'];
					tagCompletions.push(tagCompletion);
				}

				return tagCompletions;
			},
		},
		'#',
	);
	Global.projectAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const wordAtCursor = getWordAtPosition(document, position);
				if (!wordAtCursor || !wordAtCursor.startsWith('+')) {
					return undefined;
				}
				const projectCompletions = [];
				const projects = Array.from(new Set(state.projects.concat(extensionConfig.projects)));
				for (const tag of projects) {
					const tagCompletion = new vscode.CompletionItem(tag, vscode.CompletionItemKind.Field);
					tagCompletion.commitCharacters = ['+'];
					projectCompletions.push(tagCompletion);
				}

				return projectCompletions;
			},
		},
		'+',
	);
	Global.contextAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const wordAtCursor = getWordAtPosition(document, position);
				if (!wordAtCursor || !wordAtCursor.startsWith('@')) {
					return undefined;
				}
				const contextCompletions = [];
				const contexts = Array.from(new Set(state.contexts.concat(extensionConfig.contexts)));
				for (const context of contexts) {
					const contextCompletion = new vscode.CompletionItem(context, vscode.CompletionItemKind.Field);
					contextCompletion.commitCharacters = ['@'];
					contextCompletions.push(contextCompletion);
				}

				return contextCompletions;
			},
		},
		'@',
	);
	Global.generalAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const general = [];
				const today = new vscode.CompletionItem('TODAY', vscode.CompletionItemKind.Constant);
				today.insertText = getDateInISOFormat(new Date());
				const setDueDateToday = new vscode.CompletionItem('SET_DUE_TODAY', vscode.CompletionItemKind.Constant);
				setDueDateToday.insertText = `{due:${getDateInISOFormat(new Date())}}`;
				const setDueDateTomorrow = new vscode.CompletionItem('SET_DUE_TOMORROW', vscode.CompletionItemKind.Constant);
				setDueDateTomorrow.insertText = `{due:${getDateInISOFormat(dayjs().add(1, 'day'))}}`;
				const setDueDateYesterday = new vscode.CompletionItem('SET_DUE_YESTERDAY', vscode.CompletionItemKind.Constant);
				setDueDateYesterday.insertText = `{due:${getDateInISOFormat(dayjs().subtract(1, 'day'))}}`;
				general.push(today, setDueDateToday, setDueDateTomorrow, setDueDateYesterday);
				return general;
			},
		},
		'',
	);
	Global.setDueDateAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const wordRange = getWordRangeAtPosition(document, position);
				const wordAtCursor = getWordAtPosition(document, position);
				if (!wordAtCursor) {
					return undefined;
				}

				if (wordAtCursor[wordAtCursor.length - 1] === '$') {
					const dueDate = helpCreateDueDate(wordAtCursor.slice(0, -1));
					if (!dueDate) {
						return [];
					}
					const completionItem = new vscode.CompletionItem(new DueDate(dueDate).closestDueDateInTheFuture, vscode.CompletionItemKind.Constant);
					completionItem.insertText = '';
					completionItem.filterText = wordAtCursor;
					completionItem.command = {
						command: 'todomd.setDueDateWithArgs',
						title: 'Set Due Date with arguments',
						arguments: [
							document,
							wordRange,
							dueDate,
						],
					};
					return [completionItem];
				} else {
					return [];
				}
			},
		},
		'$',
	);
}

