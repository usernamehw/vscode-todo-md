import { Hover, languages, MarkdownString } from 'vscode';
import { extensionState, Global } from '../extension';
import { parseWord } from '../parse';
import { getTaskAtLineExtension } from '../utils/taskUtils';
import { getWordRangeAtPosition } from '../utils/vscodeUtils';
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
				const range = getWordRangeAtPosition(document, position);
				const word = document.getText(range);
				const hoveredWordUserDescription = new MarkdownString(undefined, true);
				hoveredWordUserDescription.isTrusted = true;
				if (range) {
					const parsedWord = parseWord(word, position.line, range.start.character);
					if (parsedWord.type === 'project') {
						if (extensionState.suggestProjects[parsedWord.value]) {
							hoveredWordUserDescription.appendMarkdown(extensionState.suggestProjects[parsedWord.value]);
						}
					} else if (parsedWord.type === 'context') {
						if (extensionState.suggestContexts[parsedWord.value]) {
							hoveredWordUserDescription.appendMarkdown(extensionState.suggestContexts[parsedWord.value]);
						}
					} else if (parsedWord.type === 'tags') {
						let index = 0;
						for (let i = 0; i < parsedWord.ranges.length; i++) {
							const tagRange = parsedWord.ranges[i];
							if (tagRange.contains(position)) {
								index = i;
								break;
							}
						}
						const tagName = parsedWord.value[index];

						if (extensionState.suggestTags[tagName]) {
							hoveredWordUserDescription.appendMarkdown(extensionState.suggestTags[tagName]);
						}
					}
				}
				return new Hover([
					hoveredWordUserDescription,
					getTaskHover(task),
				]);
			},
		},
	);
}
