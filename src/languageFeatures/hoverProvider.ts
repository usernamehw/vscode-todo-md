import { Hover, languages, MarkdownString } from 'vscode';
import { $state, Global } from '../extension';
import { getTodoMdFileDocumentSelector } from './languageFeatures';
import { parseWord } from '../parse';
import { getTaskAtLineExtension } from '../utils/taskUtils';
import { getWordRangeAtPosition } from '../utils/vscodeUtils';
import { getTaskHover } from './getTaskHover';

export function updateHover() {
	Global.hoverDisposable?.dispose();

	Global.hoverDisposable = languages.registerHoverProvider(
		getTodoMdFileDocumentSelector(),
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
						if ($state.suggestProjects[parsedWord.value]) {
							hoveredWordUserDescription.appendMarkdown($state.suggestProjects[parsedWord.value]);
						}
					} else if (parsedWord.type === 'context') {
						if ($state.suggestContexts[parsedWord.value]) {
							hoveredWordUserDescription.appendMarkdown($state.suggestContexts[parsedWord.value]);
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

						if ($state.suggestTags[tagName]) {
							hoveredWordUserDescription.appendMarkdown($state.suggestTags[tagName]);
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
