import vscode from 'vscode';
import { Global } from '../extension';
import { getTaskHover } from './getTaskHover';
import { findTaskAtLineExtension } from '../utils/taskUtils';

export function updateHover() {
	if (Global.hoverDisposable) {
		Global.hoverDisposable.dispose();
	}
	Global.hoverDisposable = vscode.languages.registerHoverProvider(
		{ scheme: 'file' },
		{
			provideHover(document, position, token) {
				const task = findTaskAtLineExtension(position.line);
				if (!task) {
					return undefined;
				}
				return new vscode.Hover(getTaskHover(task));
			},
		},
	);
}
