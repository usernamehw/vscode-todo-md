import { TextEditor, TextEditorEdit } from 'vscode';
import { TheTask } from '../TheTask';
import { $state } from '../extension';
import { SortProperty, sortTasks } from '../sort';
import { getTaskAtLineExtension } from '../utils/taskUtils';
import { getFullRangeFromLines } from '../utils/vscodeUtils';
import range from 'lodash/range';

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

	// Skip frontmatter header
	if ($state.documentStartLine && lineStart <= $state.documentStartLine) {
		lineStart = $state.documentStartLine;
	}

	// Split selection by comments (sort sections separately)
	const sortChunks: {
		lineStart: number;
		lineEnd: number;
	}[] = [];

	for (let i = lineStart, tempLineStart = lineStart; i <= lineEnd; i++) {
		const lineIsComment = $state.commentLines.find(commentRange => commentRange.start.line === i);
		if (lineIsComment || i === lineEnd) {
			sortChunks.push({
				lineStart: tempLineStart,
				lineEnd: i === lineEnd ? i : i - 1,
			});
			tempLineStart = i + 1;
		}
	}

	for (const sortChunk of sortChunks) {
		const sortedTasks = sortTasks({
			tasks: getTasksAtLines(range(sortChunk.lineStart, sortChunk.lineEnd + 1)),
			sortProperty,
		});
		if (!sortedTasks.length) {
			continue;
		}
		const sortedTasksAsText = sortedTasks.map(t => t.rawText).join('\n');
		edit.replace(getFullRangeFromLines(editor.document, sortChunk.lineStart, sortChunk.lineEnd), sortedTasksAsText);
	}
}

function getTasksAtLines(lines: number[]): TheTask[] {
	const tasks: TheTask[] = [];
	for (const line of lines) {
		const task = getTaskAtLineExtension(line);
		if (task) {
			tasks.push(task);
		}
	}
	return tasks;
}
