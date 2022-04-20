import { MarkdownString } from 'vscode';
import { extensionConfig } from '../extension';
import { TheTask } from '../TheTask';
import { durationTo } from '../time/timeUtils';
import { DueState } from '../types';
/**
 * Transform task to show it in Tree View or Editor hover as markdown
 */
export function getTaskHover(task: TheTask) {
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
	let due = '';
	if (task.due || task.overdue) {
		let dueColor = '';
		let overdueNumberOfDays = '';
		let codicon = '$(history)';
		if (task.due?.isDue === DueState.due) {
			dueColor = '#5faedb';
		} else if (task.due?.isDue === DueState.overdue) {
			dueColor = '#d44343';
			overdueNumberOfDays = String(task.due.overdueInDays);
		} else if (task.due?.isDue === DueState.invalid) {
			dueColor = '#7284eb';
			codicon = '$(error)';
			overdueNumberOfDays = 'Invalid';
		}
		due = ` <span style="color:${dueColor || 'inherit'};">${codicon} ${overdueNumberOfDays}</span>&nbsp;`;
		if (task.due?.isDue === DueState.notDue) {
			due = '';
		}
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

	markdown.appendMarkdown(`${taskTitle}${count}${due}\n\n`);

	if (task.start) {
		markdown.appendMarkdown(`<span>$(watch) ${durationTo(task, false, extensionConfig.durationIncludeSeconds)}</span>\n\n`);
	}

	return markdown;
}
