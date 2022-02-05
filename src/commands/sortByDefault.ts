import { TextEditor, TextEditorEdit } from 'vscode';
import { sortTasksInEditor } from '../commands';

export function sortByDefault(editor: TextEditor, edit: TextEditorEdit) {
	sortTasksInEditor(editor, edit, 'default');
}
