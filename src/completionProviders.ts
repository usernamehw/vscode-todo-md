import dayjs from 'dayjs';
import vscode, { CompletionItemKind, Range } from 'vscode';
import { DueDate } from './dueDate';
import { extensionConfig, extensionState, Global } from './extension';
import { helpCreateDueDate } from './time/setDueDateHelper';
import { getDateInISOFormat } from './time/timeUtils';
import { specialTagDescription, SpecialTagName } from './utils/extensionUtils';
import { getWordAtPosition, getWordRangeAtPosition } from './utils/vscodeUtils';
/**
 * Update editor autocomplete/suggest
 */
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
				const tags = Array.from(new Set(extensionState.tags.concat(extensionConfig.tags)));
				for (const tag of tags) {
					const tagCompletion = new vscode.CompletionItem(tag, vscode.CompletionItemKind.Field);
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
				const projects = Array.from(new Set(extensionState.projects.concat(extensionConfig.projects)));
				for (const tag of projects) {
					const tagCompletion = new vscode.CompletionItem(tag, vscode.CompletionItemKind.Field);
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
				const contexts = Array.from(new Set(extensionState.contexts.concat(extensionConfig.contexts)));
				for (const context of contexts) {
					const contextCompletion = new vscode.CompletionItem(context, vscode.CompletionItemKind.Field);
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
				// TODO: add documentation properties
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
	Global.specialTagsAutocompleteDisposable = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const charBeforeCursor = document.getText(new Range(position.line, position.character - 1, position.line, position.character));
				if (charBeforeCursor !== '{') {
					return undefined;
				}
				const specialTags = [
					SpecialTagName.collapsed,
					SpecialTagName.completionDate,
					SpecialTagName.count,
					SpecialTagName.creationDate,
					SpecialTagName.due,
					SpecialTagName.duration,
					SpecialTagName.hidden,
					SpecialTagName.overdue,
					SpecialTagName.started,
				];

				const specialTagCompletionItems = [];

				for (const specialTag of specialTags) {
					const completionItem = new vscode.CompletionItem(specialTag, CompletionItemKind.Field);
					completionItem.detail = specialTagDescription[specialTag];
					specialTagCompletionItems.push(completionItem);
				}

				return specialTagCompletionItems;
			},
		},
		'{',
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

