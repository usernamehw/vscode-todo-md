import vscode, { Range, TextEditor, window } from 'vscode';
import { extensionConfig, Global, state } from './extension';
import { DueState } from './types';

export function updateDecorationStyle(): void {
	Global.completedTaskDecorationType = window.createTextEditorDecorationType({
		isWholeLine: true,
		textDecoration: 'line-through rgba(255, 255, 255, 0.35)',
		light: {
			textDecoration: 'line-through rgba(0, 0, 0, 0.25)',
		},
	});
	Global.commentDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.commentForeground'),
		isWholeLine: true,
		...extensionConfig.decorations.comment,
	});
	Global.priorityADecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityAForeground'),
	});
	Global.priorityBDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityBForeground'),
	});
	Global.priorityCDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityCForeground'),
	});
	Global.priorityDDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityDForeground'),
	});
	Global.priorityEDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityEForeground'),
	});
	Global.priorityFDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityFForeground'),
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
	});
	Global.dueDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.dueForeground'),
	});
	Global.overdueDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.overdueForeground'),
	});
	Global.closestDueDateDecorationType = window.createTextEditorDecorationType({
		isWholeLine: true,
		after: {
			color: '#88888899',
			margin: '2ch',
			backgroundColor: '#00000005',
		},
	});
}

export function updateEditorDecorations(editor: TextEditor) {
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
	const closestDueDateDecorationOptions: vscode.DecorationOptions[] = [];

	for (const line of state.tasks) {
		if (line.done) {
			completedDecorationRanges.push(new vscode.Range(line.lineNumber, 0, line.lineNumber, 0));
		}
		if (line.tagsRange) {
			tagsDecorationRanges.push(...line.tagsRange);
			// @ts-ignore If `tagsRange` exists - `tagsDelimiterRanges` also exists
			tagsDelimiterDecorationRanges.push(...line.tagsDelimiterRanges);
		}
		if (line.priorityRange) {
			switch (line.priority) {
				case 'A': priorityADecorationRanges.push(line.priorityRange); break;
				case 'B': priorityBDecorationRanges.push(line.priorityRange); break;
				case 'C': priorityCDecorationRanges.push(line.priorityRange); break;
				case 'D': priorityDDecorationRanges.push(line.priorityRange); break;
				case 'E': priorityEDecorationRanges.push(line.priorityRange); break;
				default: priorityFDecorationRanges.push(line.priorityRange);
			}
		}
		if (line.specialTagRanges.length) {
			specialtagDecorationRanges.push(...line.specialTagRanges);
		}
		if (line.contextRanges && line.contextRanges.length) {
			contextDecorationRanges.push(...line.contextRanges);
		}
		if (line.projectRanges && line.projectRanges.length) {
			projectDecorationRanges.push(...line.projectRanges);
		}
		if (line.due) {
			const due = line.due;
			const dueRange = line.dueRange!;// if due exists - dueRange exists too
			if (due.isDue === DueState.due) {
				dueDecorationRanges.push(dueRange);
			} else if (due.isDue === DueState.notDue) {
				notDueDecorationRanges.push(dueRange);
			} else if (due.isDue === DueState.overdue) {
				overdueDecorationRanges.push(dueRange);
			}
			if (due.closestDueDateInTheFuture) {
				closestDueDateDecorationOptions.push({
					range: dueRange,
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
	editor.setDecorations(Global.closestDueDateDecorationType, closestDueDateDecorationOptions);
	editor.setDecorations(Global.commentDecorationType, state.commentLines);
}
