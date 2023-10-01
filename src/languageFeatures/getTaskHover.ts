import { MarkdownString } from 'vscode';
import { TheTask } from '../TheTask';
import { $config } from '../extension';
import { durationTo } from '../time/timeUtils';
import { IsDue } from '../types';
import { helpGetColor } from '../utils/colors';

/**
 * Transform tasks to show it in Tree View or Editor hover as markdown.
 */
export function getTasksHoverMd(tasks: TheTask[]): MarkdownString {
	const markdown = new MarkdownString(undefined, true);
	markdown.supportHtml = false;
	markdown.isTrusted = true;
	const isMultipleTasks = tasks.length > 1;

	let hoverMarkdownAsString = '';

	for (const task of tasks) {
		hoverMarkdownAsString += (isMultipleTasks ? '- ' : '') + getTaskMarkdownAsString(task) + (isMultipleTasks ? '\n' : '');
	}

	markdown.appendMarkdown(hoverMarkdownAsString);

	return markdown;
}

function getTaskMarkdownAsString(task: TheTask): string {
	let resultMdString = '';

	const priorityColor = task.priority === 'A' ? '#ec4f47' :
		task.priority === 'B' ? '#fd9f9a' :
			task.priority === 'C' ? '#ffb648' :
				task.priority === 'D' ? '#f1d900' :
					task.priority === 'E' ? '#97c500' :
						task.priority === 'F' ? '#00cfad' : undefined;
	if (priorityColor) {
		resultMdString += `<span style="background-color:${priorityColor};">&thinsp;</span>&nbsp;`;
	}
	if (task.done) {
		resultMdString += `<span style="color:#7cc54b;">$(pass)</span> `;
	}

	let count = '';
	if (task.count) {
		count = ` \`[${task.count.current}/${task.count.needed}]\``;
	}
	let favorite = '';
	if (task.favorite) {
		favorite = ` <span title="Favorite task." style="color:${helpGetColor('favorite')};">$(heart)</span>`;
	}
	let due = '';
	if (task.due || task.overdue) {
		let dueColor = '';
		let dueContent = '';
		let codicon = '$(history)';
		if (task.due?.isDue === IsDue.Due) {
			dueColor = helpGetColor('due');
		} else if (task.due?.isDue === IsDue.Overdue) {
			dueColor = helpGetColor('overdue');
			dueContent = String(task.due.overdueInDays);
		} else if (task.due?.isDue === IsDue.NotDue) {
			dueColor = helpGetColor('notDue');
			dueContent = task.due.closestDueDateInTheFuture;
		} else if (task.due?.isDue === IsDue.Invalid) {
			dueColor = helpGetColor('invalid');
			codicon = '$(error)';
			dueContent = 'Invalid';
		}
		if (dueContent) {
			dueContent = ` ${dueContent}`;
		}
		due = ` <span style="color:${dueColor || 'inherit'};">|${codicon}${dueContent}|</span>&nbsp;`;
	}

	const words = task.title.split(' ');
	let taskTitle = task.title;

	const resultWords = [];
	for (const word of words) {
		if (
			word.length > 1 &&
			(word[0] === '#' || word[0] === '+' || word[0] === '@')
		) {
			if (word[0] === '#') {
				resultWords.push(`<span style="color:#fff;background-color:#029cdf;">&nbsp;${word}&nbsp;</span>`);
			} else if (word[0] === '+') {
				resultWords.push(`<span style="color:#fff;background-color:#36cc9a;">&nbsp;${word}&nbsp;</span>`);
			} else {
				resultWords.push(`<span style="color:#fff;background-color:#7284eb;">&nbsp;${word}&nbsp;</span>`);
			}
		} else {
			resultWords.push(word);
		}
	}

	taskTitle = resultWords.join(' ');

	resultMdString += `${taskTitle}${count}${favorite}${due}`;

	if (task.start) {
		resultMdString += `<span style="color:${helpGetColor('durationFg')};background-color:${helpGetColor('durationBg')};">&nbsp;$(watch) ${durationTo(task, false, $config.durationIncludeSeconds)}&nbsp;</span>`;
	}

	return resultMdString;
}
