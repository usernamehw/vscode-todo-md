import type { TheTask } from '../../src/TheTask';
import { Getters, store } from './store';
/**
 * Return `true` when task is not collapsed
 *
 * This is **NOT** a check if task is scrolled out of view.
 */
export function isTaskVisible(task: TheTask): boolean {
	if (task.parentTaskLineNumber === undefined) {
		return true;
	}
	for (let currentTask = task; currentTask.parentTaskLineNumber !== undefined;) {
		const parentTask = getTaskAtLine(currentTask.parentTaskLineNumber, (store.getters as Getters).flattenedFilteredSortedTasks);
		if (!parentTask) {
			return false;
		}
		if (parentTask.isCollapsed) {
			return false;
		}
		currentTask = parentTask;
	}

	return true;
}

function getTaskAtLine(lineNumber: number, tasks: TheTask[]): TheTask | undefined {
	for (const task of tasks) {
		if (task.lineNumber === lineNumber) {
			return task;
		}
		if (task.subtasks.length) {
			const foundTask = getTaskAtLine(lineNumber, task.subtasks);
			if (foundTask) {
				return foundTask;
			}
		}
	}
	return undefined;
}

export function getTaskAtLineWebview(lineNumber: number): TheTask | undefined {
	return getTaskAtLine(lineNumber, store.state.tasksAsTree);
}

interface NestedObject {
	subtasks: NestedObject[];
}
/**
 * Recursive function to flatten an array.
 * Nested property name is hardcoded as `subtasks`
 */
export function flattenDeep<T extends NestedObject>(arr: T[]): T[] {
	const flattened: T[] = [];
	function flatten(innerArr: T[]) {
		for (const item of innerArr) {
			flattened.push(item);
			if (item.subtasks.length) {
				// @ts-ignore
				flatten(item.subtasks);
			}
		}
	}
	flatten(arr);
	return flattened;
}
/**
 * Recursive get all nested tasks.
 */
export function getAllNestedTasksWebview(task: TheTask) {
	const allNestedTaksIds = getNestedTasksLineNumbers(task.subtasks);
	return allNestedTaksIds.map(lineNumber => getTaskAtLineWebview(lineNumber)!);
}

/**
 * TODO: duplicated from extension.
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
