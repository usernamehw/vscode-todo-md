import dayjs from 'dayjs';
import { TextEditor, window } from 'vscode';
import { updateLastVisitGlobalState } from '../extension';

export async function setLastVisit(editor: TextEditor) {
	const numberOfHours = Number(await window.showInputBox({
		prompt: 'Number of Hours ago',
	}));
	if (!numberOfHours) {
		return;
	}
	updateLastVisitGlobalState(editor.document.uri.toString(), dayjs().subtract(numberOfHours, 'hour').toDate());
}
