import { DocumentHighlight, DocumentHighlightKind, languages, Range } from 'vscode';
import { Global } from './extension';
import { parseWord } from './parse';
import { forEachTask } from './utils/taskUtils';
import { getWordRangeAtPosition } from './utils/vscodeUtils';

export function updateDocumentHighlights() {
	Global.documentHighlightsDisposable?.dispose();

	// let sep = '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?';
	// languages.setLanguageConfiguration('markdown', {
	// 	wordPattern: /\S+/g,
	// });

	Global.documentHighlightsDisposable = languages.registerDocumentHighlightProvider(
		{
			scheme: 'file',
		},
		{
			provideDocumentHighlights(document, position) {
				const wordRange = getWordRangeAtPosition(document, position);
				if (!wordRange) {
					return [];
				}
				const wordText = document.getText(wordRange);
				const word = parseWord(wordText, position.line, wordRange.start.character);

				if (word.type === 'tags') {
					for (let i = 0; i < word.ranges.length; i++) {
						const tagRange = word.ranges[i];
						const rangeWithDelimiter = new Range(tagRange.start.line, tagRange.start.character - 1, tagRange.end.line, tagRange.end.character);
						if (rangeWithDelimiter.contains(position)) {
							const documentRanges: Range[] = [];
							const tagName = word.value[i];
							forEachTask(task => {
								const index = task.tags.indexOf(tagName);
								if (index !== -1) {
									documentRanges.push(task.tagsRange![index]);
								}
							});
							return documentRanges.map(range => new DocumentHighlight(new Range(range.start.line, range.start.character - 1, range.end.line, range.end.character), DocumentHighlightKind.Read));
						}
					}
				} else if (word.type === 'context') {
					const contextRange = word.range;
					if (contextRange.contains(position)) {
						const documentRanges: Range[] = [];
						forEachTask(task => {
							const index = task.contexts.indexOf(word.value);
							if (index !== -1) {
								documentRanges.push(task.contextRanges[index]);
							}
						});
						return documentRanges.map(range => new DocumentHighlight(range, DocumentHighlightKind.Read));
					}
				} else if (word.type === 'project') {
					const projectRange = word.range;
					if (projectRange.contains(position)) {
						const documentRanges: Range[] = [];
						forEachTask(task => {
							const index = task.projects.indexOf(word.value);
							if (index !== -1) {
								documentRanges.push(task.projectRanges[index]);
							}
						});
						return documentRanges.map(range => new DocumentHighlight(range, DocumentHighlightKind.Read));
					}
				}
				return [];
			},
		},
	);
}

