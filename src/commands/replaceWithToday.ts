import { TextEditor } from 'vscode';
import { getDateInISOFormat } from '../time/timeUtils';
import { getTaskAtLineExtension } from '../utils/taskUtils';

export function replaceWithToday(editor: TextEditor): void {
	const task = getTaskAtLineExtension(editor.selection.active.line);
	if (!task) {
		return;
	}

	const dueText = editor.document.getText(task.dueRange);
	if (!task.dueRange || !dueText) {
		return;
	}

	editor.edit(builder => {
		builder.replace(task.dueRange!, dueText.replace(/\d{4}-\d{2}-\d{2}/, getDateInISOFormat()));
	});
}
