import { state } from '../extension';
import { TheTask } from '../TheTask';

type Callback = (task: TheTask)=> void;
/**
 * Execute callback function for every task.
 */
export function forEachTask(f: Callback, tasks = state.tasksAsTree) {
	for (const task of tasks) {
		f(task);
		if (task.subtasks.length) {
			forEachTask(f, task.subtasks);
		}
	}
}
