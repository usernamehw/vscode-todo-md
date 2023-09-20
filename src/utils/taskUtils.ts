import { $config, $state } from '../extension';
import type { TheTask } from '../TheTask';
import { IsDue } from '../types';
import { fancyLetterBold } from './utils';

/**
 * Get task at line (might be nested)
 */
function findTaskAtLine(lineNumber: number, tasks: TheTask[]): TheTask | undefined {
	for (const task of tasks) {
		if (task.lineNumber === lineNumber) {
			return task;
		}
		if (task.subtasks.length) {
			const foundTask = findTaskAtLine(lineNumber, task.subtasks);
			if (foundTask) {
				return foundTask;
			}
		}
	}
	return undefined;
}
/**
 * There are 2 functions that do the same thing, but one is for the webview
 *
 * Suffix `Extension` means it gets task from the extension side
 * Suffix `Webview` means it gets task from the webview side
 */
export function getTaskAtLineExtension(lineNumber: number, tasks = $state.tasksAsTree) {
	return findTaskAtLine(lineNumber, tasks);
}

/**
 * Execute callback function for every task nested included (recursive).
 */
export function forEachTask(f: (task: TheTask)=> void, tasks = $state.tasksAsTree) {
	for (const task of tasks) {
		f(task);
		if (task.subtasks.length) {
			forEachTask(f, task.subtasks);
		}
	}
}

/**
 * Gets all nested task line numbers (recursive).
 */
export function getNestedTasksLineNumbers(tasks: TheTask[]): number[] {
	const ids = [];
	for (const task of tasks) {
		ids.push(task.lineNumber);
		if (task.subtasks) {
			ids.push(...getNestedTasksLineNumbers(task.subtasks));
		}
	}
	return ids;
}

/**
 * Format task title for notification or modal dialog
 */
export function formatTask(task: TheTask, {
	ignoreDueDate = false,
}: {
	ignoreDueDate?: boolean;
} = {}): string {
	let result = '';
	if (!ignoreDueDate) {
		if (task.due?.isDue === IsDue.Due) {
			result += $config.labelDueSymbol;
		} else if (task.due?.isDue === IsDue.NotDue) {
			result += $config.labelNotDueSymbol;
		} else if (task.due?.isDue === IsDue.Overdue) {
			result += $config.labelOverdueSymbol;
		} else if (task.due?.isDue === IsDue.Invalid) {
			result += $config.labelInvalidDueSymbol;
		}
	}
	result += makeBoldTagProjectContext(task.title);
	if (task.count) {
		result += ` [${task.count.current}/${task.count.needed}]`;
	}
	if (task.favorite) {
		result += $config.labelFavorite;
	}
	if (result.length === 0) {
		return task.rawText;
	}
	return result;
}

export function makeBoldTagProjectContext(taskTitle: string): string {
	if ($config.useBoldTextInLabels) {
		const words = taskTitle.split(' ');

		const resultWords = [];
		for (const word of words) {
			if (
				word.length > 1 &&
				(word[0] === '#' || word[0] === '+' || word[0] === '@')
			) {
				resultWords.push(fancyLetterBold(word));
			} else {
				resultWords.push(word);
			}
		}

		return resultWords.join(' ');
	} else {
		return taskTitle;
	}
}
