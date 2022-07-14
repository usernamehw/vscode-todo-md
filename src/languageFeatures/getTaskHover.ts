import dayjs from 'dayjs';
import { MarkdownString } from 'vscode';
import { $config } from '../extension';
import { TheTask } from '../TheTask';
import { durationTo, weekdayNamesShort } from '../time/timeUtils';
import { IsDue } from '../types';
import { helpGetColor } from '../utils/colors';

/**
 * Transform task to show it in Tree View or Editor hover as markdown
 */
export function getTaskHoverMd(task: TheTask) {
	const markdown = new MarkdownString(undefined, true);
	markdown.isTrusted = true;
	const priorityColor = task.priority === 'A' ? '#ec4f47' :
		task.priority === 'B' ? '#fd9f9a' :
			task.priority === 'C' ? '#ffb648' :
				task.priority === 'D' ? '#f1d900' :
					task.priority === 'E' ? '#97c500' :
						task.priority === 'F' ? '#00cfad' : undefined;
	if (priorityColor) {
		markdown.appendMarkdown(`<span style="background-color:${priorityColor};">&thinsp;</span>&nbsp;`);
	}
	if (task.done) {
		markdown.appendMarkdown(`<span style="color:#7cc54b;">$(pass)</span> `);
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
			dueContent = makeClosestDueDateDecoration(task);
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

	markdown.appendMarkdown(`${taskTitle}${count}${favorite}${due}\n\n`);

	if (task.start) {
		markdown.appendMarkdown(`<span>$(watch) ${durationTo(task, false, $config.durationIncludeSeconds)}</span>\n\n`);
	}

	return markdown;
}

/**
 * Return closest due date in a format (depending on a user setting):
 * - `+20d Fri`
 * - `+20d`
 */
export function makeClosestDueDateDecoration(task: TheTask): string {
	return `+${task.due!.daysUntilDue}d${$config.closestDueDateIncludeWeekday ? ` ${weekdayNamesShort[dayjs().add(task.due!.daysUntilDue, 'day').get('day')]}` : ''}`;
}
