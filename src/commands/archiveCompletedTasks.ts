import { TextEditor } from 'vscode';
import { archiveTasks } from '../documentActions';
import { $state } from '../extension';
import { getTaskAtLineExtension } from '../utils/taskUtils';

export function archiveCompletedTasks(editor: TextEditor) {
	const selection = editor.selection;
	// TODO: multiple selections?
	if (editor.selections.length === 1 && selection.isEmpty) {
		// Archive all completed tasks
		// TODO: should there be a function `getCompletedTasks()`?
		const completedTasks = $state.tasks.filter(t => t.done);
		archiveTasks(completedTasks, editor.document);
	} else {
		// Archive only selected completed tasks
		const selectedCompletedTasks = [];
		for (let i = selection.start.line; i <= selection.end.line; i++) {
			const task = getTaskAtLineExtension(i);
			if (task && task.done) {
				selectedCompletedTasks.push(task);
			}
		}
		archiveTasks(selectedCompletedTasks, editor.document);
	}
}
