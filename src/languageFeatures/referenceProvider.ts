import { Disposable, languages, Location, Range } from 'vscode';
import { parseWord } from '../parse';
import { getWordRangeAtPosition } from '../utils/vscodeUtils';
import { getTodoMdFileDocumentSelector } from './languageFeatures';
import { getAllContextRangesInDocument, getAllProjectRangesInDocument, getAllTagRangesInDocument } from './renameProvider';

let referenceProviderDisposable: Disposable | undefined;

export function disposeReferenceProvider() {
	referenceProviderDisposable?.dispose();
}

export function updateReferenceProvider() {
	disposeReferenceProvider();

	referenceProviderDisposable = languages.registerReferenceProvider(
		getTodoMdFileDocumentSelector(),
		{
			provideReferences(document, position, context) {
				const range = getWordRangeAtPosition(document, position);
				if (!range) {
					return undefined;
				}
				const word = document.getText(range);
				const parsedWord = parseWord(word, position.line, range.start.character);
				let resultRanges: Range[] = [];
				if (parsedWord.type === 'tags') {
					resultRanges = getAllTagRangesInDocument(parsedWord, position);
				} else if (parsedWord.type === 'project') {
					resultRanges = getAllProjectRangesInDocument(parsedWord, position);
				} else if (parsedWord.type === 'context') {
					resultRanges = getAllContextRangesInDocument(parsedWord, position);
				}
				return resultRanges.map(r => new Location(document.uri, r));
			},
		},
	);
}
