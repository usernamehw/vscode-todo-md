import dayjs, { Dayjs } from 'dayjs';
import { Hover, languages, MarkdownString } from 'vscode';
import { DueDate } from '../dueDate';
import { $config, $state, Global } from '../extension';
import { parseWord } from '../parse';
import { getDateInISOFormat } from '../time/timeUtils';
import { DueState } from '../types';
import { helpGetColor } from '../utils/colors';
import { getTaskAtLineExtension } from '../utils/taskUtils';
import { getWordRangeAtPosition } from '../utils/vscodeUtils';
import { getTaskHoverMd } from './getTaskHover';
import { getTodoMdFileDocumentSelector } from './languageFeatures';

export function updateHover() {
	Global.hoverDisposable?.dispose();

	Global.hoverDisposable = languages.registerHoverProvider(
		getTodoMdFileDocumentSelector(),
		{
			provideHover(document, position, token) {
				const task = getTaskAtLineExtension(position.line);
				if (!task) {
					return undefined;
				}

				const range = getWordRangeAtPosition(document, position);
				const word = document.getText(range);
				/**
				 * Add hover description from the user setting "todomd.suggestItems".
				 */
				const hoveredWordUserDescription = new MarkdownString(undefined, true);
				hoveredWordUserDescription.isTrusted = true;
				/**
				 * Add all tasks with the same project/tag/context.
				 */
				const otherMarkdownHovers: MarkdownString[] = [];

				if (range) {
					const parsedWord = parseWord(word, position.line, range.start.character);
					if (parsedWord.type === 'project') {
						const projectName = parsedWord.value;
						if ($state.suggestProjects[projectName]) {
							hoveredWordUserDescription.appendMarkdown($state.suggestProjects[projectName]);
						}

						for (const otherTask of $state.projectsForTreeView.find(project => project.title === projectName)?.tasks || []) {
							if (otherTask.lineNumber === task.lineNumber) {
								continue;
							}
							otherMarkdownHovers.push(getTaskHoverMd(otherTask));
						}
					} else if (parsedWord.type === 'context') {
						const contextName = parsedWord.value;
						if ($state.suggestContexts[contextName]) {
							hoveredWordUserDescription.appendMarkdown($state.suggestContexts[contextName]);
						}

						for (const otherTask of $state.contextsForTreeView.find(context => context.title === contextName)?.tasks || []) {
							if (otherTask.lineNumber === task.lineNumber) {
								continue;
							}
							otherMarkdownHovers.push(getTaskHoverMd(otherTask));
						}
					} else if (parsedWord.type === 'tags') {
						const tagName = parsedWord.value;

						if ($state.suggestTags[tagName]) {
							hoveredWordUserDescription.appendMarkdown($state.suggestTags[tagName]);
						}

						for (const otherTask of $state.tagsForTreeView.find(tag => tag.title === tagName)?.tasks || []) {
							if (otherTask.lineNumber === task.lineNumber) {
								continue;
							}
							otherMarkdownHovers.push(getTaskHoverMd(otherTask));
						}
					} else if (parsedWord.type === 'due') {
						const dueHover = new MarkdownString(undefined, true);
						dueHover.isTrusted = true;
						dueHover.supportHtml = true;

						if ($config.isDev) {
							dueHover.appendMarkdown(renderCalendarsForDueDate(task.due!));
						}

						otherMarkdownHovers.push(dueHover);
					}
				}
				return new Hover([
					hoveredWordUserDescription,
					getTaskHoverMd(task),
					...otherMarkdownHovers,
				]);
			},
		},
	);
}

/**
 * Render 3 months of calendar with provided date in the middle.
 */

function renderCalendarsForDueDate(due: DueDate): string {
	let htmlText = '<table>';

	const now = dayjs();
	const nextMonth = now.add(1, 'month');

	const thisMonthHtml = renderHtmlCalendar(now, due);
	const nextMonthHtml = renderHtmlCalendar(nextMonth, due);


	htmlText += '<tr>';
	htmlText += `<td>${thisMonthHtml}</td>`;
	htmlText += `<td>${nextMonthHtml}</td>`;
	htmlText += '</tr>';
	htmlText += '</table>';

	return htmlText;
}

/**
 * Render 1 calendar.
 */
function renderHtmlCalendar(date: Dayjs, dueDate: DueDate): string {
	const now = dayjs();
	const daysInMonth = date.daysInMonth();
	const firstDate = date.set('date', 1);
	const firstDateWeekday = firstDate.get('d');

	let htmlText = '';
	htmlText += `<div>${date.toDate().toLocaleString('en-us', { month: 'long' })}</div>`;
	htmlText += '<table>';
	htmlText += '<tr>';
	htmlText += '<th>Mo</th>';
	htmlText += '<th>Tu</th>';
	htmlText += '<th>We</th>';
	htmlText += '<th>Th</th>';
	htmlText += '<th>Fr</th>';
	htmlText += '<th>Sa</th>';
	htmlText += '<th>Su</th>';
	htmlText += '</tr>';

	htmlText += '<tr>';
	const numberOfEmptyCellsAtFirstLine = firstDateWeekday === 0 ? 6 : firstDateWeekday - 1;
	htmlText += '<td></td>'.repeat(numberOfEmptyCellsAtFirstLine);

	for (let i = 1; i <= daysInMonth; i++) {
		const tempDate = date.set('date', i);
		const dayOfWeek = tempDate.get('d');
		const isDue = DueDate.parseDue(dueDate.raw, tempDate.toDate()).isDue === DueState.Due;
		const isDueStyle = isDue ? ` style="color:${helpGetColor('due')};"` : '';
		let cell = `<code>${String(i).padStart(2, '0')}</code>`;
		if (tempDate.isSame(now, 'date')) {
			cell = `<b>${cell}</b>`;
		}

		htmlText += `<td title="${getDateInISOFormat(tempDate)}"><span${isDueStyle}>${cell}</span></td>`;

		if (dayOfWeek === 0) {
			htmlText += '</tr>';
			htmlText += '<tr>';
		}
	}
	htmlText += '</tr>';
	htmlText += '</table>';

	return htmlText;
}

// ALLOWED_TAGS: ['ul', 'li', 'p', 'b', 'i', 'code', 'blockquote', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'em', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'del', 'a', 'strong', 'br', 'img', 'span'],
// ALLOWED_ATTR: ['href', 'data-href', 'target', 'title', 'src', 'alt', 'class', 'style', 'data-code', 'width', 'height', 'align'],
