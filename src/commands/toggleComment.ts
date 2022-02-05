import { TextEditor, WorkspaceEdit } from 'vscode';
import { toggleCommentAtLineWorkspaceEdit } from '../documentActions';
import { applyEdit } from '../utils/extensionUtils';

export function toggleComment(editor: TextEditor) {
	const edit = new WorkspaceEdit();
	const selections = editor.selections;
	for (const selection of selections) {
		const start = selection.start.line;
		const end = selection.end.line;
		for (let i = start; i <= end; i++) {
			toggleCommentAtLineWorkspaceEdit(edit, editor.document, i);
		}
	}
	applyEdit(edit, editor.document);
}
