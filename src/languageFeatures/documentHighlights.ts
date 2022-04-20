import { DocumentHighlight, DocumentHighlightKind, languages, Range } from 'vscode';
import { extensionConfig, Global } from '../extension';
import { parseWord } from '../parse';
import { getWordRangeAtPosition } from '../utils/vscodeUtils';
import { getTodoMdFileDocumentSelector } from './languageFeatures';
import { getAllContextRangesInDocument, getAllProjectRangesInDocument, getAllTagRangesInDocument } from './renameProvider';

export function updateDocumentHighlights() {
	Global.documentHighlightsDisposable?.dispose();

	Global.documentHighlightsDisposable = languages.registerDocumentHighlightProvider(
		getTodoMdFileDocumentSelector(),
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

