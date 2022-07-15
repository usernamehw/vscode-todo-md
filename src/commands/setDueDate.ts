import { TextDocument, TextEditor, ThemeIcon, window, WorkspaceEdit } from 'vscode';
import { setDueDateWorkspaceEdit } from '../documentActions';
import { DueDate } from '../dueDate';
import { updateEverything } from '../events';
import { helpCreateDueDate } from '../time/setDueDateHelper';
import { applyEdit, getSelectedLineNumbers } from '../utils/extensionUtils';
import { followLink, inputOffset } from '../utils/vscodeUtils';

export function setDueDate(editor: TextEditor) {
	openSetDueDateInputbox(editor.document, getSelectedLineNumbers(editor));
}

/**
 * Open vscode input box that aids in creating of due date.
 */
export function openSetDueDateInputbox(document: TextDocument, lineNumbers: number[]) {
	const inputBox = window.createInputBox();
	let value: string | undefined = '+0';
	inputBox.value = value;
	inputBox.title = 'Set due date';
	const docsButtonName = 'Documentation';
	inputBox.onDidTriggerButton(e => {
		if (e.tooltip === docsButtonName) {
			followLink('https://github.com/usernamehw/vscode-todo-md/blob/master/docs/docs.md#set-due-date-helper-function-todomdsetduedate');
		}
	});
	inputBox.buttons = [{
		iconPath: new ThemeIcon('question'),
		tooltip: docsButtonName,
	}];
	inputBox.prompt = inputOffset(new DueDate(helpCreateDueDate(value)!).closestDueDateInTheFuture);
	inputBox.show();

	inputBox.onDidChangeValue((e: string) => {
		value = e;
		const newDueDate = helpCreateDueDate(value);
		if (!newDueDate) {
			inputBox.prompt = inputOffset('❌ Invalid');
			return;
		}
		inputBox.prompt = inputOffset(new DueDate(newDueDate).closestDueDateInTheFuture);
	});

	inputBox.onDidAccept(async () => {
		if (!value) {
			return;
		}
		const newDueDate = helpCreateDueDate(value);

		if (newDueDate) {
			const edit = new WorkspaceEdit();
			for (const line of lineNumbers) {
				setDueDateWorkspaceEdit(edit, document, line, newDueDate);
			}
			await applyEdit(edit, document);
			inputBox.hide();
			inputBox.dispose();
			updateEverything();
		}
	});
}
