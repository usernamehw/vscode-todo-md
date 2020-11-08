import { findTaskAtLine } from '../../src/taskUtils';
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
		if (parentTask.specialTags.collapsed) {
			return false;
		}
		currentTask = parentTask;
	}

	return true;
}
