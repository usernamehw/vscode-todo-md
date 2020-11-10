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

// eslint-disable-next-line no-redeclare
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

export function findTaskAtLineWebview(lineNumber: number) {
	return findTaskAtLine(lineNumber, store.state.tasksAsTree);
}
