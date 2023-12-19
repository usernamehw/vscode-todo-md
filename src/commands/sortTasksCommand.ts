import { TextEditor, TextEditorEdit } from 'vscode';
import { TheTask } from '../TheTask';
import { $state } from '../extension';
import { SortProperty, sortTasks } from '../sort';
import { getTaskAtLineExtension } from '../utils/taskUtils';
import { getFullRangeFromLines } from '../utils/vscodeUtils';

/**
 * Sort tasks in editor. Default sort is by due date. Same due date sorted by priority.
 */
export function sortTasksInEditorCommand(editor: TextEditor, edit: TextEditorEdit, sortProperty: SortProperty): void {
	const selection = editor.selection;
	let lineStart = selection.start.line;
	let lineEnd = selection.end.line;

	if (selection.isEmpty) {
		lineStart = 0;
		lineEnd = editor.document.lineCount - 1;
	}

	if ($state.documentStartLine && lineStart <= $state.documentStartLine) {
		lineStart = $state.documentStartLine;
	}

	const tasks: TheTask[] = [];
	for (let i = lineStart; i <= lineEnd; i++) {
		const task = getTaskAtLineExtension(i);
		if (task) {
			tasks.push(task);
		}
	}
	const sortedTasks = sortTasks({
		tasks,
		sortProperty,
	});
	if (!sortedTasks.length) {
		return;
	}
	const result = sortedTasks.map(t => t.rawText).join('\n');
	edit.replace(getFullRangeFromLines(editor.document, lineStart, lineEnd), result);
}
