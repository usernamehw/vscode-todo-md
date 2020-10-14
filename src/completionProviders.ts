import dayjs from 'dayjs';
import vscode from 'vscode';
import { extensionConfig, Global, state } from './extension';
import { getDateInISOFormat } from './timeUtils';

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
				const tagCompletions = [];
				for (const tag of state.tags.concat(extensionConfig.tags)) {
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
				const tagCompletions = [];
				for (const tag of state.projects.concat(extensionConfig.projects)) {
					const tagCompletion = new vscode.CompletionItem(tag, vscode.CompletionItemKind.Field);
					tagCompletion.commitCharacters = ['+'];
					tagCompletions.push(tagCompletion);
				}

				return tagCompletions;
			},
		},
		'+',
	);
	Global.contextAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const contextCompletions = [];
				for (const context of state.contexts.concat(extensionConfig.contexts)) {
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
				const setDueDateYesterday = new vscode.CompletionItem('YESTERDAY', vscode.CompletionItemKind.Constant);
				setDueDateYesterday.insertText = `{due:${getDateInISOFormat(dayjs().subtract(1, 'day'))}}`;
				general.push(today, setDueDateToday, setDueDateTomorrow, setDueDateYesterday);
				return general;
			},
		},
		'',
	);
}

