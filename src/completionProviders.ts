import * as vscode from 'vscode';
import { state, config, G } from './extension';
import { getDateInISOFormat, shiftDays } from './timeUtils';

export function updateCompletions(): void {
	if (G.tagAutocompleteDisposable) {
		G.tagAutocompleteDisposable.dispose();
		G.projectAutocompleteDisposable.dispose();
		G.contextAutocompleteDisposable.dispose();
		G.generalAutocompleteDisposable.dispose();
	}

	G.tagAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// const linePrefix = document.lineAt(position).text.substr(0, position.character).trim();
				const tagCompletions = [];
				for (const tag of getAllTags()) {
					const tagCompletion = new vscode.CompletionItem(tag, vscode.CompletionItemKind.Field);
					tagCompletion.commitCharacters = ['#'];
					// tagCompletion.documentation = new vscode.MarkdownString(`\`${tag}\` tag`);
					tagCompletions.push(tagCompletion);
				}

				return tagCompletions;
			},
		},
		'#'
	);
	G.projectAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// const linePrefix = document.lineAt(position).text.substr(0, position.character);// TODO: only include pattern with space=>plus
				const tagCompletions = [];
				for (const tag of getAllProjects()) {
					const tagCompletion = new vscode.CompletionItem(tag, vscode.CompletionItemKind.Field);
					tagCompletion.commitCharacters = ['+'];
					// tagCompletion.documentation = new vscode.MarkdownString(`\`${tag}\` tag`);
					tagCompletions.push(tagCompletion);
				}

				return tagCompletions;
			},
		},
		'+'
	);
	G.contextAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// const linePrefix = document.lineAt(position).text.substr(0, position.character);// TODO: only include pattern with space=>at
				const contextCompletions = [];
				for (const context of getAllContexts()) {
					const contextCompletion = new vscode.CompletionItem(context, vscode.CompletionItemKind.Field);
					contextCompletion.commitCharacters = ['@'];
					// tagCompletion.documentation = new vscode.MarkdownString(`\`${tag}\` tag`);
					contextCompletions.push(contextCompletion);
				}

				return contextCompletions;
			},
		},
		'@'
	);
	G.generalAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// const linePrefix = document.lineAt(position).text.substr(0, position.character);
				const general = [];
				const today = new vscode.CompletionItem('TODAY', vscode.CompletionItemKind.Constant);
				today.insertText = getDateInISOFormat(new Date());
				const tomorrow = new vscode.CompletionItem('TOMORROW', vscode.CompletionItemKind.Constant);
				tomorrow.insertText = getDateInISOFormat(shiftDays(new Date(), 1));
				const yesterday = new vscode.CompletionItem('YESTERDAY', vscode.CompletionItemKind.Constant);
				yesterday.insertText = getDateInISOFormat(shiftDays(new Date(), -1));
				general.push(today, tomorrow, yesterday);
				return general;
			},
		},
		''
	);
}


function getAllTags(): Set<string> {
	const set: Set<string> = new Set();
	for (const line of state.tasks) {
		for (const tag of line.tags) {
			set.add(tag);
		}
	}
	for (const tag of config.tags) {
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
	for (const project of config.projects) {
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
	for (const context of config.contexts) {
		set.add(context);
	}
	return set;
}
