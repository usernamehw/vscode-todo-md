import dayjs from 'dayjs';
import { CompletionItem, CompletionItemKind, Disposable, languages, MarkdownString, Position, Range, TextDocument } from 'vscode';
import { DueDate } from '../dueDate';
import { $state } from '../extension';
import { helpCreateDueDate } from '../time/setDueDateHelper';
import { getDateInISOFormat, weekdayNamesLong } from '../time/timeUtils';
import { helpCreateSpecialTag, specialTagDescription, SpecialTagName } from '../utils/extensionUtils';
import { unique } from '../utils/utils';
import { getWordAtPosition, getWordRangeAtPosition } from '../utils/vscodeUtils';
import { getTodoMdFileDocumentSelector } from './languageFeatures';

let tagAutocompleteDisposable: Disposable | undefined;
let projectAutocompleteDisposable: Disposable | undefined;
let contextAutocompleteDisposable: Disposable | undefined;
let generalAutocompleteDisposable: Disposable | undefined;
let specialTagsAutocompleteDisposable: Disposable | undefined;
let setDueDateAutocompleteDisposable: Disposable | undefined;

export function disposeCompletionProviders() {
	tagAutocompleteDisposable?.dispose();
	projectAutocompleteDisposable?.dispose();
	contextAutocompleteDisposable?.dispose();
	generalAutocompleteDisposable?.dispose();
	specialTagsAutocompleteDisposable?.dispose();
	setDueDateAutocompleteDisposable?.dispose();
}

/**
 * Update editor autocomplete/suggest
 */
export function updateCompletions() {
	disposeCompletionProviders();

	tagAutocompleteDisposable = languages.registerCompletionItemProvider(
		getTodoMdFileDocumentSelector(),
		{
			provideCompletionItems(document: TextDocument, position: Position) {
				const wordAtCursor = getWordAtPosition(document, position);
				if (!wordAtCursor || !wordAtCursor.startsWith('#')) {
					return undefined;
				}
				const tagCompletions = [];
				const tags = unique($state.tags.concat(Object.keys($state.suggestTags)));
				for (const tag of tags) {
					const tagCompletion = new CompletionItem(tag, CompletionItemKind.Field);
					const documentation = new MarkdownString($state.suggestTags[tag], true);
					documentation.isTrusted = true;
					tagCompletion.documentation = documentation;
					tagCompletion.insertText = `${tag} `;
					tagCompletions.push(tagCompletion);
				}

				return tagCompletions;
			},
		},
		'#',
	);
	projectAutocompleteDisposable = languages.registerCompletionItemProvider(
		getTodoMdFileDocumentSelector(),
		{
			provideCompletionItems(document: TextDocument, position: Position) {
				const wordAtCursor = getWordAtPosition(document, position);
				if (!wordAtCursor || !wordAtCursor.startsWith('+')) {
					return undefined;
				}
				const projectCompletions = [];
				const projects = unique($state.projects.concat(Object.keys($state.suggestProjects)));
				for (const project of projects) {
					const projectCompletion = new CompletionItem(project, CompletionItemKind.Field);
					const documentation = new MarkdownString($state.suggestProjects[project], true);
					documentation.isTrusted = true;
					projectCompletion.documentation = documentation;
					projectCompletion.insertText = `${project} `;
					projectCompletions.push(projectCompletion);
				}

				return projectCompletions;
			},
		},
		'+',
	);
	contextAutocompleteDisposable = languages.registerCompletionItemProvider(
		getTodoMdFileDocumentSelector(),
		{
			provideCompletionItems(document: TextDocument, position: Position) {
				const wordAtCursor = getWordAtPosition(document, position);
				if (!wordAtCursor || !wordAtCursor.startsWith('@')) {
					return undefined;
				}
				const contextCompletions = [];
				const contexts = unique($state.contexts.concat(Object.keys($state.suggestContexts)));
				for (const context of contexts) {
					const contextCompletion = new CompletionItem(context, CompletionItemKind.Field);
					const documentation = new MarkdownString($state.suggestContexts[context], true);
					documentation.isTrusted = true;
					contextCompletion.documentation = documentation;
					contextCompletion.insertText = `${context} `;
					contextCompletions.push(contextCompletion);
				}

				return contextCompletions;
			},
		},
		'@',
	);
	generalAutocompleteDisposable = languages.registerCompletionItemProvider(
		getTodoMdFileDocumentSelector(),
		{
			provideCompletionItems(document: TextDocument, position: Position) {
				const today = new CompletionItem('TODAY', CompletionItemKind.Constant);
				today.insertText = getDateInISOFormat(new Date());

				const setDueDateToday = new CompletionItem('SET_DUE_TODAY', CompletionItemKind.Constant);
				setDueDateToday.insertText = helpCreateSpecialTag(SpecialTagName.Due, getDateInISOFormat(new Date()));

				const setDueDateTomorrow = new CompletionItem('SET_DUE_TOMORROW', CompletionItemKind.Constant);
				setDueDateTomorrow.insertText = helpCreateSpecialTag(SpecialTagName.Due, getDateInISOFormat(dayjs().add(1, 'day')));

				const setDueDateYesterday = new CompletionItem('SET_DUE_YESTERDAY', CompletionItemKind.Constant);
				setDueDateYesterday.insertText = helpCreateSpecialTag(SpecialTagName.Due, getDateInISOFormat(dayjs().subtract(1, 'day')));

				const setDueDateThisWeek = new CompletionItem('SET_DUE_THIS_WEEK', CompletionItemKind.Constant);
				setDueDateThisWeek.insertText = helpCreateSpecialTag(SpecialTagName.Due, helpCreateDueDate('this week'));

				const setDueDateNextWeek = new CompletionItem('SET_DUE_NEXT_WEEK', CompletionItemKind.Constant);
				setDueDateNextWeek.insertText = helpCreateSpecialTag(SpecialTagName.Due, helpCreateDueDate('next week'));

				const weekdayCompletions: CompletionItem[] = weekdayNamesLong.map(weekdayName => {
					const setDueDateWeekday = new CompletionItem(`SET_DUE_${weekdayName.toUpperCase()}`, CompletionItemKind.Constant);
					setDueDateWeekday.insertText = helpCreateSpecialTag(SpecialTagName.Due, helpCreateDueDate(weekdayName));
					return setDueDateWeekday;
				});

				return [
					...weekdayCompletions,
					today,
					setDueDateToday,
					setDueDateTomorrow,
					setDueDateYesterday,
					setDueDateThisWeek,
					setDueDateNextWeek,
				];
			},
		},
		'',
	);
	specialTagsAutocompleteDisposable = languages.registerCompletionItemProvider(
		getTodoMdFileDocumentSelector(),
		{
			provideCompletionItems(document: TextDocument, position: Position) {
				const charBeforeCursor = document.getText(new Range(position.line, position.character === 0 ? 0 : position.character - 1, position.line, position.character));
				if (charBeforeCursor !== '{') {
					return undefined;
				}
				const specialTags = [
					SpecialTagName.Collapsed,
					SpecialTagName.CompletionDate,
					SpecialTagName.Count,
					SpecialTagName.CreationDate,
					SpecialTagName.Due,
					SpecialTagName.Duration,
					SpecialTagName.Hidden,
					SpecialTagName.Overdue,
					SpecialTagName.Started,
					SpecialTagName.NoOverdue,
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
	setDueDateAutocompleteDisposable = languages.registerCompletionItemProvider(
		getTodoMdFileDocumentSelector(),
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

