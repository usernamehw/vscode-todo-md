import dayjs from 'dayjs';
import { CompletionItem, CompletionItemKind, languages, Position, Range, TextDocument } from 'vscode';
import { DueDate } from '../dueDate';
import { $state, Global } from '../extension';
import { helpCreateDueDate } from '../time/setDueDateHelper';
import { getDateInISOFormat, weekdayNamesLong } from '../time/timeUtils';
import { helpCreateSpecialTag, specialTagDescription, SpecialTagName } from '../utils/extensionUtils';
import { unique } from '../utils/utils';
import { getWordAtPosition, getWordRangeAtPosition } from '../utils/vscodeUtils';
import { getTodoMdFileDocumentSelector } from './languageFeatures';

/**
 * Update editor autocomplete/suggest
 */
export function updateCompletions() {
	Global.tagAutocompleteDisposable?.dispose();
	Global.projectAutocompleteDisposable?.dispose();
	Global.contextAutocompleteDisposable?.dispose();
	Global.generalAutocompleteDisposable?.dispose();
	Global.specialTagsAutocompleteDisposable?.dispose();

	Global.tagAutocompleteDisposable = languages.registerCompletionItemProvider(
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
					tagCompletion.insertText = `${tag} `;
					tagCompletions.push(tagCompletion);
				}

				return tagCompletions;
			},
		},
		'#',
	);
	Global.projectAutocompleteDisposable = languages.registerCompletionItemProvider(
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
					projectCompletion.insertText = `${project} `;
					projectCompletions.push(projectCompletion);
				}

				return projectCompletions;
			},
		},
		'+',
	);
	Global.contextAutocompleteDisposable = languages.registerCompletionItemProvider(
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
					contextCompletion.insertText = `${context} `;
					contextCompletions.push(contextCompletion);
				}

				return contextCompletions;
			},
		},
		'@',
	);
	Global.generalAutocompleteDisposable = languages.registerCompletionItemProvider(
		getTodoMdFileDocumentSelector(),
		{
			provideCompletionItems(document: TextDocument, position: Position) {
				const today = new CompletionItem('TODAY', CompletionItemKind.Constant);
				today.insertText = getDateInISOFormat(new Date());

				const setDueDateToday = new CompletionItem('SET_DUE_TODAY', CompletionItemKind.Constant);
				setDueDateToday.insertText = helpCreateSpecialTag(SpecialTagName.due, getDateInISOFormat(new Date()));

				const setDueDateTomorrow = new CompletionItem('SET_DUE_TOMORROW', CompletionItemKind.Constant);
				setDueDateTomorrow.insertText = helpCreateSpecialTag(SpecialTagName.due, getDateInISOFormat(dayjs().add(1, 'day')));

				const setDueDateYesterday = new CompletionItem('SET_DUE_YESTERDAY', CompletionItemKind.Constant);
				setDueDateYesterday.insertText = helpCreateSpecialTag(SpecialTagName.due, getDateInISOFormat(dayjs().subtract(1, 'day')));

				const setDueDateThisWeek = new CompletionItem('SET_DUE_THIS_WEEK', CompletionItemKind.Constant);
				setDueDateThisWeek.insertText = helpCreateSpecialTag(SpecialTagName.due, helpCreateDueDate('this week'));

				const setDueDateNextWeek = new CompletionItem('SET_DUE_NEXT_WEEK', CompletionItemKind.Constant);
				setDueDateNextWeek.insertText = helpCreateSpecialTag(SpecialTagName.due, helpCreateDueDate('next week'));

				const weekdayCompletions: CompletionItem[] = weekdayNamesLong.map(weekdayName => {
					const setDueDateWeekday = new CompletionItem(`SET_DUE_${weekdayName.toUpperCase()}`);
					setDueDateWeekday.insertText = helpCreateSpecialTag(SpecialTagName.due, helpCreateDueDate(weekdayName));
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
	Global.specialTagsAutocompleteDisposable = languages.registerCompletionItemProvider(
		getTodoMdFileDocumentSelector(),
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

