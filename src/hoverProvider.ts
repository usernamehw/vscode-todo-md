import vscode, { MarkdownString } from 'vscode';
import { Global } from './extension';
import { findTaskAtLineExtension } from './taskUtils';

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
				const markdown = new MarkdownString(undefined, true);
				markdown.isTrusted = true;
				const priorityColor = task.priority === 'A' ? '#ec4f47' :
					task.priority === 'B' ? '#fd9f9a' :
						task.priority === 'C' ? '#ffb648' :
							task.priority === 'D' ? '#f1d900' :
								task.priority === 'E' ? '#97c500' :
									task.priority === 'F' ? '#00cfad' : undefined;
				if (priorityColor) {
					markdown.appendMarkdown(`<span style="background-color:${priorityColor};">&nbsp;</span>&nbsp;`);
				}
				if (task.done) {
					markdown.appendMarkdown('$(pass) ');
				}
				markdown.appendText(`${task.title}\n`);
				for (const tag of task.tags) {
					markdown.appendMarkdown(`<span style="color:#fff;background-color:#029cdf;">&nbsp;#${tag}&nbsp;</span>&nbsp;`);
				}
				for (const project of task.projects) {
					markdown.appendMarkdown(`<span style="color:#fff;background-color:#36cc9a;">&nbsp;+${project}&nbsp;</span>&nbsp;`);
				}
				for (const context of task.contexts) {
					markdown.appendMarkdown(`<span style="color:#fff;background-color:#7284eb;">&nbsp;@${context}&nbsp;</span>&nbsp;`);
				}
				return new vscode.Hover(markdown);
			},
		},
	);
}
