import { state } from './extension';
import { TheTask } from './TheTask';

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
export function findTaskAtLineExtension(lineNumber: number) {
	return findTaskAtLine(lineNumber, state.tasksAsTree);
}
