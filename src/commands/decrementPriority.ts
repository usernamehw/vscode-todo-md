import { TextEditor } from 'vscode';
import { incrementOrDecrementPriority } from '../documentActions';

export function decrementPriority(editor: TextEditor) {
	const lineNumber = editor.selection.active.line;
	incrementOrDecrementPriority(editor.document, lineNumber, 'decrement');
}
