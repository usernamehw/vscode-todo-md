import { TheTask } from '../../src/TheTask';
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
		const parentTask = findTaskAtLine(currentTask.parentTaskLineNumber, (store.getters as Getters).flattenedFilteredSortedTasks);
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

export function findTaskAtLineWebview(lineNumber: number): TheTask | undefined {
	return findTaskAtLine(lineNumber, store.state.tasksAsTree);
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
	const allNestedTaksIds = TheTask.getNestedTasksLineNumbers(task.subtasks);
	return allNestedTaksIds.map(lineNumber => findTaskAtLineWebview(lineNumber)!);
}
