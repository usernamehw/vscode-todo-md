import { DocumentSelector } from 'vscode';
import { extensionConfig } from '../extension';

/**
 * Return selector targeting files this extension activates on
 * (for language features).
 */
export function getTodoMdFileDocumentSelector(): DocumentSelector {
	return {
		scheme: 'file',
		pattern: extensionConfig.activatePattern,
	};
}
