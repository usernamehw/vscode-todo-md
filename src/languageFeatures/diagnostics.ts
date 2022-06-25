import { Diagnostic, DiagnosticCollection, DiagnosticSeverity, languages, Range, TextEditor } from 'vscode';
import { TheTask } from '../TheTask';
import { forEachTask } from '../utils/taskUtils';


export const enum DiagnosticType {
	InvalidDueDate = 'Invalid Due Date',
	DuplicatedTags = 'Duplicated Tags',
	DuplicatedProjects = 'Duplicated Projects',
	DuplicatedContexts = 'Duplicated Contexts',
}

const diagnosticCollection: DiagnosticCollection = languages.createDiagnosticCollection();
const source = 'Todo MD';

/**
 * Create diagnostics with problems found in the active file.
 * (Errors, Warnings, ...)
 */
export function updateDiagnostic(editor: TextEditor, tasks: TheTask[]) {
	clearDiagnostics();

	const diagnostics: Diagnostic[] = [];

	forEachTask(task => {
		// ──── Invalid Due Date ──────────────────────────────────────
		if (task.due?.type === 'invalid') {
			diagnostics.push({
				message: DiagnosticType.InvalidDueDate,
				severity: DiagnosticSeverity.Error,
				range: task.dueRange!,
				source,
			});
		}
		// ──── Duplicated Tags ───────────────────────────────────────
		if (new Set(task.tags).size !== task.tags.length) {
			const duplicatedRanges: Range[] = [];
			for (const [index, tag] of task.tags.entries()) {
				if (task.tags.indexOf(tag) !== task.tags.lastIndexOf(tag)) {
					duplicatedRanges.push(task.tagsRange![index]);
				}
			}
			for (const range of duplicatedRanges) {
				diagnostics.push({
					message: DiagnosticType.DuplicatedTags,
					severity: DiagnosticSeverity.Warning,
					range,
					source,
				});
			}
		}
		// ──── Duplicated Projects ───────────────────────────────────
		if (new Set(task.projects).size !== task.projects.length) {
			const duplicatedRanges: Range[] = [];
			for (const [index, tag] of task.projects.entries()) {
				if (task.projects.indexOf(tag) !== task.projects.lastIndexOf(tag)) {
					duplicatedRanges.push(task.projectRanges[index]);
				}
			}
			for (const range of duplicatedRanges) {
				diagnostics.push({
					message: DiagnosticType.DuplicatedProjects,
					severity: DiagnosticSeverity.Warning,
					range,
					source,
				});
			}
		}
		// ──── Duplicated Contexts ───────────────────────────────────
		if (new Set(task.contexts).size !== task.contexts.length) {
			const duplicatedRanges: Range[] = [];
			for (const [index, tag] of task.contexts.entries()) {
				if (task.contexts.indexOf(tag) !== task.contexts.lastIndexOf(tag)) {
					duplicatedRanges.push(task.contextRanges[index]);
				}
			}
			for (const range of duplicatedRanges) {
				diagnostics.push({
					message: DiagnosticType.DuplicatedContexts,
					severity: DiagnosticSeverity.Warning,
					range,
					source,
				});
			}
		}
	}, tasks);

	diagnosticCollection.set(editor.document.uri, diagnostics);
}

/**
 * Clear all language diagnostics (problems) created by Todo MD extension.
 */
export function clearDiagnostics() {
	diagnosticCollection?.clear();
}
