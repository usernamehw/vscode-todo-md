import * as vscode from 'vscode';
import { state, config, subscriptions, GlobalVars } from './extension';

export function updateCompletions(): void {
	if (GlobalVars.tagAutocompleteDisposable) {
		GlobalVars.tagAutocompleteDisposable.dispose();
	}
	if (GlobalVars.projectAutocompleteDisposable) {
		GlobalVars.projectAutocompleteDisposable.dispose();
	}
	if (GlobalVars.contextAutocompleteDisposable) {
		GlobalVars.contextAutocompleteDisposable.dispose();
	}

	GlobalVars.tagAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const linePrefix = document.lineAt(position).text.substr(0, position.character).trim();
				if (linePrefix === '#') {
				// It's a markdown header, don't autocomplete as a tag
					return [];
				}
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
	GlobalVars.projectAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const linePrefix = document.lineAt(position).text.substr(0, position.character);
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
	GlobalVars.contextAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const linePrefix = document.lineAt(position).text.substr(0, position.character);
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
