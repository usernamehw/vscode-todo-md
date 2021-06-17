import { Hover, languages } from 'vscode';
import { Global } from '../extension';
import { getTaskAtLineExtension } from '../utils/taskUtils';
import { getTaskHover } from './getTaskHover';

export function updateHover() {
	if (Global.hoverDisposable) {
		Global.hoverDisposable.dispose();
	}
	Global.hoverDisposable = languages.registerHoverProvider(
		{ scheme: 'file' },
		{
			provideHover(document, position, token) {
				const task = getTaskAtLineExtension(position.line);
				if (!task) {
					return undefined;
				}
				return new Hover(getTaskHover(task));
			},
		},
	);
}
