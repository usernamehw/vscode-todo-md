import { TheTask } from './TheTask';

/**
 * Get task at line (might be nested)
 */
export function findTaskAtLine(lineNumber: number, tasks: TheTask[]): TheTask | undefined {
	for (const task of tasks) {
		if (task.lineNumber === lineNumber) {
			return task;
		}
		if (task.subtasks.length) {
			const foundTask = findTaskAtLine(lineNumber, task?.subtasks);
			if (foundTask) {
				return foundTask;
			}
		}
	}
	return undefined;
}
