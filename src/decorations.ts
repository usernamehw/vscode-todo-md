import { window, TextEditor, Range } from 'vscode';
import * as vscode from 'vscode';

import { Global, state } from './extension';
import { DueState } from './types';

export function updateDecorationsStyle(): void {
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
	});
	Global.priority1DecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityAForeground'),
	});
	Global.priority2DecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityBForeground'),
	});
	Global.priority3DecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityCForeground'),
	});
	Global.priority4DecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityDForeground'),
	});
	Global.priority5DecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priorityEForeground'),
	});
	Global.priority6DecorationType = window.createTextEditorDecorationType({
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
	});
	Global.contextDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.contextForeground'),
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
			color: '#888888aa',
			textDecoration: ';margin-left:1ch',
			backgroundColor: '#00000005',
		},
	});
}

export function updateEditorDecorations(editor: TextEditor) {
	const completedDecorationRanges: Range[] = [];
	const tagsDecorationRanges: Range[] = [];
	const priority1DecorationRanges: Range[] = [];
	const priority2DecorationRanges: Range[] = [];
	const priority3DecorationRanges: Range[] = [];
	const priority4DecorationRanges: Range[] = [];
	const priority5DecorationRanges: Range[] = [];
	const priority6DecorationRanges: Range[] = [];
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
			completedDecorationRanges.push(new vscode.Range(line.ln, 0, line.ln, 0));
		}
		if (line.tagsRange) {
			tagsDecorationRanges.push(...line.tagsRange);
			// @ts-ignore
			tagsDelimiterDecorationRanges.push(...line.tagsDelimiterRanges);
		}
		if (line.priorityRange) {
			switch (line.priority) {
				case 'A': {
					priority1DecorationRanges.push(line.priorityRange);
					break;
				}
				case 'B': {
					priority2DecorationRanges.push(line.priorityRange);
					break;
				}
				case 'C': {
					priority3DecorationRanges.push(line.priorityRange);
					break;
				}
				case 'D': {
					priority4DecorationRanges.push(line.priorityRange);
					break;
				}
				case 'E': {
					priority5DecorationRanges.push(line.priorityRange);
					break;
				}
				default: {
					priority6DecorationRanges.push(line.priorityRange);
				}
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
			if (due.isDue === DueState.due) {
				dueDecorationRanges.push(due.range);
			} else if (due.isDue === DueState.notDue) {
				notDueDecorationRanges.push(due.range);
			} else if (due.isDue === DueState.overdue) {
				overdueDecorationRanges.push(due.range);
			}
			closestDueDateDecorationOptions.push({
				range: due.range,
				renderOptions: {
					after: {
						contentText: due.closestDueDateInTheFuture,
					},
				},
			});
		}
	}

	editor.setDecorations(Global.completedTaskDecorationType, completedDecorationRanges);
	editor.setDecorations(Global.tagsDecorationType, tagsDecorationRanges);
	editor.setDecorations(Global.specialTagDecorationType, specialtagDecorationRanges);
	editor.setDecorations(Global.priority1DecorationType, priority1DecorationRanges);
	editor.setDecorations(Global.priority2DecorationType, priority2DecorationRanges);
	editor.setDecorations(Global.priority3DecorationType, priority3DecorationRanges);
	editor.setDecorations(Global.priority4DecorationType, priority4DecorationRanges);
	editor.setDecorations(Global.priority5DecorationType, priority5DecorationRanges);
	editor.setDecorations(Global.priority6DecorationType, priority6DecorationRanges);
	editor.setDecorations(Global.tagsDelimiterDecorationType, tagsDelimiterDecorationRanges);
	editor.setDecorations(Global.projectDecorationType, projectDecorationRanges);
	editor.setDecorations(Global.contextDecorationType, contextDecorationRanges);
	editor.setDecorations(Global.notDueDecorationType, notDueDecorationRanges);
	editor.setDecorations(Global.dueDecorationType, dueDecorationRanges);
	editor.setDecorations(Global.overdueDecorationType, overdueDecorationRanges);
	editor.setDecorations(Global.closestDueDateDecorationType, closestDueDateDecorationOptions);

	editor.setDecorations(Global.commentDecorationType, state.commentLines);
}
