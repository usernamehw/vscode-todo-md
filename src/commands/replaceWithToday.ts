import { TextEditor } from 'vscode';
import { getDateInISOFormat } from '../time/timeUtils';

export function replaceWithToday(editor: TextEditor) {
	const wordRange = editor.document.getWordRangeAtPosition(editor.selection.active, /\d{4}-\d{2}-\d{2}/);
	if (!wordRange) {
		return;
	}
	editor.edit(builder => {
		builder.replace(wordRange, getDateInISOFormat());
	});
}
