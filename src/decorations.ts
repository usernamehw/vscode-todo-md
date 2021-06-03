import vscode, { Range, TextEditor, window } from 'vscode';
import { extensionConfig, extensionState, Global } from './extension';
import { DueState } from './types';
/**
 * Update editor decoration style
 */
export function updateEditorDecorationStyle(): void {
	Global.completedTaskDecorationType = window.createTextEditorDecorationType({
		isWholeLine: true,
		textDecoration: 'line-through rgba(255, 255, 255, 0.35)',
		light: {
			textDecoration: 'line-through rgba(0, 0, 0, 0.25)',
		},
		...extensionConfig.decorations.completedTask,
	});
	Global.commentDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.commentForeground'),
		isWholeLine: true,
		...extensionConfig.decorations.comment,
	});
	Global.priorityADecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityAForeground'),
		...extensionConfig.decorations.priorityAForeground,
	});
	Global.priorityBDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityBForeground'),
		...extensionConfig.decorations.priorityBForeground,
	});
	Global.priorityCDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityCForeground'),
		...extensionConfig.decorations.priorityCForeground,
	});
	Global.priorityDDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityDForeground'),
		...extensionConfig.decorations.priorityDForeground,
	});
	Global.priorityEDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityEForeground'),
		...extensionConfig.decorations.priorityEForeground,
	});
	Global.priorityFDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityFForeground'),
		...extensionConfig.decorations.priorityFForeground,
	});
	Global.tagsDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.tagForeground'),
	});
	Global.specialTagDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.specialTagForeground'),
	});
	Global.tagsDelimiterDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.tagDelimiterForeground'),
	});
	Global.projectDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.projectForeground'),
		...extensionConfig.decorations.project,
	});
	Global.contextDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.contextForeground'),
		...extensionConfig.decorations.context,
	});
	Global.notDueDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.notDueForeground'),
		...extensionConfig.decorations.notDue,
	});
	Global.dueDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.dueForeground'),
		...extensionConfig.decorations.due,
	});
	Global.overdueDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.overdueForeground'),
		...extensionConfig.decorations.overdue,
	});
	Global.invalidDueDateDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.invalidDueDateForeground'),
		backgroundColor: new vscode.ThemeColor('todomd.invalidDueDateBackground'),
		...extensionConfig.decorations.invalidDue,
	});
	Global.closestDueDateDecorationType = window.createTextEditorDecorationType({
		after: {
			color: new vscode.ThemeColor('todomd.closestDueDateForeground'),
			margin: '1ch',
			backgroundColor: new vscode.ThemeColor('todomd.closestDueDateBackground'),
		},
	});
}
/**
 * Actually update the editor decorations
 */
export function paintEditorDecorations(editor: TextEditor) {
	const completedDecorationRanges: Range[] = [];
	const tagsDecorationRanges: Range[] = [];
	const priorityADecorationRanges: Range[] = [];
	const priorityBDecorationRanges: Range[] = [];
	const priorityCDecorationRanges: Range[] = [];
	const priorityDDecorationRanges: Range[] = [];
	const priorityEDecorationRanges: Range[] = [];
	const priorityFDecorationRanges: Range[] = [];
	const tagsDelimiterDecorationRanges: Range[] = [];
	const specialtagDecorationRanges: Range[] = [];
	const projectDecorationRanges: Range[] = [];
	const contextDecorationRanges: Range[] = [];
	const notDueDecorationRanges: Range[] = [];
	const dueDecorationRanges: Range[] = [];
	const overdueDecorationRanges: Range[] = [];
	const invalidDueDateDecorationRanges: Range[] = [];
	const closestDueDateDecorationOptions: vscode.DecorationOptions[] = [];

	for (const task of extensionState.tasks) {
		if (task.done) {
			completedDecorationRanges.push(new vscode.Range(task.lineNumber, 0, task.lineNumber, 0));
		}
		if (task.tagsRange) {
			tagsDecorationRanges.push(...task.tagsRange);
			tagsDelimiterDecorationRanges.push(...task.tagsDelimiterRanges!);// if `tagsRange` exists - `tagsDelimiterRanges` also exists
		}
		if (task.priorityRange) {
			switch (task.priority) {
				case 'A': priorityADecorationRanges.push(task.priorityRange); break;
				case 'B': priorityBDecorationRanges.push(task.priorityRange); break;
				case 'C': priorityCDecorationRanges.push(task.priorityRange); break;
				case 'D': priorityDDecorationRanges.push(task.priorityRange); break;
				case 'E': priorityEDecorationRanges.push(task.priorityRange); break;
				default: priorityFDecorationRanges.push(task.priorityRange);
			}
		}
		if (task.specialTagRanges.length) {
			specialtagDecorationRanges.push(...task.specialTagRanges);
		}
		if (task.contextRanges && task.contextRanges.length) {
			contextDecorationRanges.push(...task.contextRanges);
		}
		if (task.projectRanges && task.projectRanges.length) {
			projectDecorationRanges.push(...task.projectRanges);
		}
		if (task.due) {
			const due = task.due;
			const dueRange = task.dueRange!;// if due exists - dueRange exists too
			if (due.isDue === DueState.due) {
				dueDecorationRanges.push(dueRange);
			} else if (due.isDue === DueState.notDue) {
				notDueDecorationRanges.push(dueRange);
			} else if (due.isDue === DueState.overdue) {
				overdueDecorationRanges.push(dueRange);
				if (task.overdueRange) {
					specialtagDecorationRanges.push(task.overdueRange);
				}
			} else if (due.isDue === DueState.invalid) {
				invalidDueDateDecorationRanges.push(dueRange);
			}
			if (due.isDue === DueState.notDue && due.closestDueDateInTheFuture) {
				closestDueDateDecorationOptions.push({
					range: new vscode.Range(dueRange.end.line, dueRange.end.character - 1, dueRange.end.line, dueRange.end.character - 1),
					renderOptions: {
						after: {
							contentText: due.closestDueDateInTheFuture,
						},
					},
				});
			}
		}
	}

	editor.setDecorations(Global.completedTaskDecorationType, completedDecorationRanges);
	editor.setDecorations(Global.tagsDecorationType, tagsDecorationRanges);
	editor.setDecorations(Global.specialTagDecorationType, specialtagDecorationRanges);
	editor.setDecorations(Global.priorityADecorationType, priorityADecorationRanges);
	editor.setDecorations(Global.priorityBDecorationType, priorityBDecorationRanges);
	editor.setDecorations(Global.priorityCDecorationType, priorityCDecorationRanges);
	editor.setDecorations(Global.priorityDDecorationType, priorityDDecorationRanges);
	editor.setDecorations(Global.priorityEDecorationType, priorityEDecorationRanges);
	editor.setDecorations(Global.priorityFDecorationType, priorityFDecorationRanges);
	editor.setDecorations(Global.tagsDelimiterDecorationType, tagsDelimiterDecorationRanges);
	editor.setDecorations(Global.projectDecorationType, projectDecorationRanges);
	editor.setDecorations(Global.contextDecorationType, contextDecorationRanges);
	editor.setDecorations(Global.notDueDecorationType, notDueDecorationRanges);
	editor.setDecorations(Global.dueDecorationType, dueDecorationRanges);
	editor.setDecorations(Global.overdueDecorationType, overdueDecorationRanges);
	editor.setDecorations(Global.invalidDueDateDecorationType, invalidDueDateDecorationRanges);
	editor.setDecorations(Global.closestDueDateDecorationType, closestDueDateDecorationOptions);
	editor.setDecorations(Global.commentDecorationType, extensionState.commentLines);
}
