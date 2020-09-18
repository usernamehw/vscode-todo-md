import dayjs from 'dayjs';
import { extensionConfig, Global, state } from 'src/extension';
import { getDateInISOFormat } from 'src/timeUtils';
import vscode from 'vscode';

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
				for (const tag of getAllTags()) {
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
				for (const tag of getAllProjects()) {
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
				for (const context of getAllContexts()) {
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
				const tomorrow = new vscode.CompletionItem('TOMORROW', vscode.CompletionItemKind.Constant);
				tomorrow.insertText = getDateInISOFormat(dayjs().add(1, 'day'));
				const yesterday = new vscode.CompletionItem('YESTERDAY', vscode.CompletionItemKind.Constant);
				yesterday.insertText = getDateInISOFormat(dayjs().subtract(1, 'day'));
				general.push(today, tomorrow, yesterday);
				return general;
			},
		},
		'',
	);
}

function getAllTags(): Set<string> {
	const set: Set<string> = new Set();
	for (const line of state.tasks) {
		for (const tag of line.tags) {
			set.add(tag);
		}
	}
	for (const tag of extensionConfig.tags) {
		set.add(tag);
	}
	return set;
}
function getAllProjects(): Set<string> {
	const set: Set<string> = new Set();
	for (const line of state.tasks) {
		if (line.projects) {
			for (const project of line.projects) {
				set.add(project);
			}
		}
	}
	for (const project of extensionConfig.projects) {
		set.add(project);
	}
	return set;
}
function getAllContexts(): Set<string> {
	const set: Set<string> = new Set();
	for (const line of state.tasks) {
		if (line.contexts) {
			for (const context of line.contexts) {
				set.add(context);
			}
		}
	}
	for (const context of extensionConfig.contexts) {
		set.add(context);
	}
	return set;
}
