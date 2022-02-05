import { TextEditor } from 'vscode';
import { openSetDueDateInputbox } from '../commands';

export function setDueDate(editor: TextEditor) {
	openSetDueDateInputbox(editor.document, editor.selection.active.line);
}
