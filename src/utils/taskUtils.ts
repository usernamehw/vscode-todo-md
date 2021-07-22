import { extensionConfig, extensionState } from '../extension';
import type { TheTask } from '../TheTask';
import { DueState } from '../types';
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
export function getTaskAtLineExtension(lineNumber: number) {
	return findTaskAtLine(lineNumber, extensionState.tasksAsTree);
}

/**
 * Execute callback function for every task nested included (recursive).
 */
export function forEachTask(f: (task: TheTask)=> void, tasks = extensionState.tasksAsTree) {
	for (const task of tasks) {
		f(task);
		if (task.subtasks.length) {
			forEachTask(f, task.subtasks);
		}
	}
}

/**
 * Gets all nested task line numbers (recursive)
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
		if (task.due?.isDue === DueState.due) {
			result += extensionConfig.labelDueSymbol;
		} else if (task.due?.isDue === DueState.overdue) {
			result += extensionConfig.labelOverdueSymbol;
		} else if (task.due?.isDue === DueState.invalid) {
			result += extensionConfig.labelInvalidDueSymbol;
		}
	}
	result += task.title;
	if (task.count) {
		result += ` ${task.count.current}/${task.count.needed}`;
	}
	if (extensionConfig.labelShowTag && task.tags.length) {
		for (const tag of task.tags) {
			result += ` #${fancyLetterBold(tag)}`;
		}
	}
	if (result.length === 0) {
		return task.rawText;
	}
	return result;
}
