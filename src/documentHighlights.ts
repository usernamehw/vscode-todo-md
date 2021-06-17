import { DocumentHighlight, DocumentHighlightKind, languages, Range } from 'vscode';
import { Global } from './extension';
import { parseWord } from './parse';
import { getAllContextRangesInDocument, getAllProjectRangesInDocument, getAllTagRangesInDocument } from './renameProvider';
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

				let resultRanges: Range[] = [];

				if (word.type === 'tags') {
					resultRanges = getAllTagRangesInDocument(word, position);
				} else if (word.type === 'context') {
					resultRanges = getAllContextRangesInDocument(word, position);
				} else if (word.type === 'project') {
					resultRanges = getAllProjectRangesInDocument(word, position);
				}
				return resultRanges.map(range => new DocumentHighlight(range, DocumentHighlightKind.Read));
			},
		},
	);
}

