import { DocumentSelector } from 'vscode';
import { $config } from '../extension';
import { updateCompletions } from './completionProviders';
import { updateDocumentHighlights } from './documentHighlights';
import { updateHover } from './hoverProvider';
import { updateReferenceProvider } from './referenceProvider';
import { updateRenameProvider } from './renameProvider';

/**
 * Return selector targeting files this extension activates on
 * (for language features).
 */
export function getTodoMdFileDocumentSelector(): DocumentSelector {
	return {
		scheme: 'file',
		pattern: $config.activatePattern,
	};
}

/**
 * Update completion/hover/rename/... providers.
 */
export function updateLanguageFeatures(): void {
	updateCompletions();
	updateDocumentHighlights();
	updateRenameProvider();
	updateReferenceProvider();
	updateHover();
}
