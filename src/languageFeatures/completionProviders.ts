import dayjs from 'dayjs';
import { CompletionItem, CompletionItemKind, languages, Position, Range, TextDocument } from 'vscode';
import { DueDate } from '../dueDate';
import { extensionConfig, extensionState, Global } from '../extension';
import { helpCreateDueDate } from '../time/setDueDateHelper';
import { getDateInISOFormat } from '../time/timeUtils';
import { specialTagDescription, SpecialTagName } from '../utils/extensionUtils';
import { getWordAtPosition, getWordRangeAtPosition } from '../utils/vscodeUtils';
/**
 * Update editor autocomplete/suggest
 */
export function updateCompletions(): void {
	if (Global.tagAutocompleteDisposable) {
		Global.tagAutocompleteDisposable.dispose();
		Global.projectAutocompleteDisposable.dispose();
		Global.contextAutocompleteDisposable.dispose();
		Global.generalAutocompleteDisposable.dispose();
		Global.specialTagsAutocompleteDisposable.dispose();
	}

	Global.tagAutocompleteDisposable = languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: TextDocument, position: Position) {
				const wordAtCursor = getWordAtPosition(document, position);
				if (!wordAtCursor || !wordAtCursor.startsWith('#')) {
					return undefined;
				}
				const tagCompletions = [];
				const tags = Array.from(new Set(extensionState.tags.concat(extensionConfig.tags)));
				for (const tag of tags) {
					const tagCompletion = new CompletionItem(tag, CompletionItemKind.Field);
					tagCompletion.insertText = `${tag} `;
					tagCompletions.push(tagCompletion);
				}

				return tagCompletions;
			},
		},
		'#',
	);
	Global.projectAutocompleteDisposable = languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: TextDocument, position: Position) {
				const wordAtCursor = getWordAtPosition(document, position);
				if (!wordAtCursor || !wordAtCursor.startsWith('+')) {
					return undefined;
				}
				const projectCompletions = [];
				const projects = Array.from(new Set(extensionState.projects.concat(extensionConfig.projects)));
				for (const project of projects) {
					const projectCompletion = new CompletionItem(project, CompletionItemKind.Field);
					projectCompletion.insertText = `${project} `;
					projectCompletions.push(projectCompletion);
				}

				return projectCompletions;
			},
		},
		'+',
	);
	Global.contextAutocompleteDisposable = languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: TextDocument, position: Position) {
				const wordAtCursor = getWordAtPosition(document, position);
				if (!wordAtCursor || !wordAtCursor.startsWith('@')) {
					return undefined;
				}
				const contextCompletions = [];
				const contexts = Array.from(new Set(extensionState.contexts.concat(extensionConfig.contexts)));
				for (const context of contexts) {
					const contextCompletion = new CompletionItem(context, CompletionItemKind.Field);
					contextCompletion.insertText = `${context} `;
					contextCompletions.push(contextCompletion);
				}

				return contextCompletions;
			},
		},
		'@',
	);
	Global.generalAutocompleteDisposable = languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: TextDocument, position: Position) {
				// TODO: add documentation properties
				const today = new CompletionItem('TODAY', CompletionItemKind.Constant);
				today.insertText = getDateInISOFormat(new Date());
				const setDueDateToday = new CompletionItem('SET_DUE_TODAY', CompletionItemKind.Constant);
				setDueDateToday.insertText = `{due:${getDateInISOFormat(new Date())}}`;
				const setDueDateTomorrow = new CompletionItem('SET_DUE_TOMORROW', CompletionItemKind.Constant);
				setDueDateTomorrow.insertText = `{due:${getDateInISOFormat(dayjs().add(1, 'day'))}}`;
				const setDueDateYesterday = new CompletionItem('SET_DUE_YESTERDAY', CompletionItemKind.Constant);
				setDueDateYesterday.insertText = `{due:${getDateInISOFormat(dayjs().subtract(1, 'day'))}}`;
				return [
					today,
					setDueDateToday,
					setDueDateTomorrow,
					setDueDateYesterday,
				];
			},
		},
		'',
	);
	Global.specialTagsAutocompleteDisposable = languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: TextDocument, position: Position) {
				const charBeforeCursor = document.getText(new Range(position.line, position.character === 0 ? 0 : position.character - 1, position.line, position.character));
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
					const completionItem = new CompletionItem(specialTag, CompletionItemKind.Field);
					completionItem.detail = specialTagDescription[specialTag];
					specialTagCompletionItems.push(completionItem);
				}

				return specialTagCompletionItems;
			},
		},
		'{',
	);
	Global.setDueDateAutocompleteDisposable = languages.registerCompletionItemProvider(
		{ scheme: 'file' },
		{
			provideCompletionItems(document: TextDocument, position: Position) {
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
					const completionItem = new CompletionItem(new DueDate(dueDate).closestDueDateInTheFuture, CompletionItemKind.Constant);
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

