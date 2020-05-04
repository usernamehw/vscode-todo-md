import { window, TextEditor, Range } from 'vscode';
import * as vscode from 'vscode';

import { G, state } from './extension';
import { DueState } from './types';

export function updateDecorationsStyle(): void {
	G.completedTaskDecorationType = window.createTextEditorDecorationType({
		isWholeLine: true,
		textDecoration: 'line-through rgba(255, 255, 255, 0.35)',
		light: {
			textDecoration: 'line-through rgba(0, 0, 0, 0.25)',
		},
	});
	G.commentDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.commentForeground'),
		isWholeLine: true,
	});
	G.priority1DecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priority1Foreground'),
	});
	G.priority2DecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priority2Foreground'),
	});
	G.priority3DecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priority3Foreground'),
	});
	G.priority4DecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priority4Foreground'),
	});
	G.priority5DecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priority5Foreground'),
	});
	G.priority6DecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priority6Foreground'),
	});
	G.priority7DecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.priority7Foreground'),
	});
	G.tagsDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.tagForeground'),
	});
	G.specialTagDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.specialTagForeground'),
	});
	G.tagsDelimiterDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.tagDelimiterForeground'),
	});
	G.projectDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.projectForeground'),
	});
	G.contextDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.contextForeground'),
	});
	G.notDueDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.notDueForeground'),
	});
	G.dueDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.dueForeground'),
	});
	G.overdueDecorationType = window.createTextEditorDecorationType({
		color: new vscode.ThemeColor('todomd.overdueForeground'),
	});
}

export function updateEditorDecorations(editor: TextEditor) {
	const completedDecorationOptions: Range[] = [];
	const tagsDecorationOptions: Range[] = [];
	const priority1DecorationOptions: Range[] = [];
	const priority2DecorationOptions: Range[] = [];
	const priority3DecorationOptions: Range[] = [];
	const priority4DecorationOptions: Range[] = [];
	const priority5DecorationOptions: Range[] = [];
	const priority6DecorationOptions: Range[] = [];
	const priority7DecorationOptions: Range[] = [];
	const tagsDelimiterDecorationOptions: Range[] = [];
	const specialtagDecorationOptions: Range[] = [];
	const projectDecorationOptions: Range[] = [];
	const contextDecorationOptions: Range[] = [];
	const notDueDecorationOptions: Range[] = [];
	const dueDecorationOptions: Range[] = [];
	const overdueDecorationOptions: Range[] = [];

	for (const line of state.tasks) {
		if (line.done) {
			completedDecorationOptions.push(new vscode.Range(line.ln, 0, line.ln, 0));
		}
		if (line.tagsRange) {
			tagsDecorationOptions.push(...line.tagsRange);
			// @ts-ignore
			tagsDelimiterDecorationOptions.push(...line.tagsDelimiterRanges);
		}
		if (line.priorityRange) {
			switch (line.priority) {
				case 'A': {
					priority1DecorationOptions.push(line.priorityRange);
					break;
				}
				case 'B': {
					priority2DecorationOptions.push(line.priorityRange);
					break;
				}
				case 'C': {
					priority3DecorationOptions.push(line.priorityRange);
					break;
				}
				case 'D': {
					priority4DecorationOptions.push(line.priorityRange);
					break;
				}
				case 'E': {
					priority5DecorationOptions.push(line.priorityRange);
					break;
				}
				case 'F': {
					priority6DecorationOptions.push(line.priorityRange);
					break;
				}
				default: {
					priority7DecorationOptions.push(line.priorityRange);
				}
			}
		}
		if (line.specialTagRanges.length) {
			specialtagDecorationOptions.push(...line.specialTagRanges);
		}
		if (line.contextRanges && line.contextRanges.length) {
			contextDecorationOptions.push(...line.contextRanges);
		}
		if (line.projectRanges && line.projectRanges.length) {
			projectDecorationOptions.push(...line.projectRanges);
		}
		if (line.dueRange) {
			if (line.isDue === DueState.due) {
				dueDecorationOptions.push(line.dueRange);
			} else if (line.isDue === DueState.notDue) {
				notDueDecorationOptions.push(line.dueRange);
			} else if (line.isDue === DueState.overdue) {
				overdueDecorationOptions.push(line.dueRange);
			}
		}
	}

	editor.setDecorations(G.completedTaskDecorationType, completedDecorationOptions);
	editor.setDecorations(G.tagsDecorationType, tagsDecorationOptions);
	editor.setDecorations(G.specialTagDecorationType, specialtagDecorationOptions);
	editor.setDecorations(G.priority1DecorationType, priority1DecorationOptions);
	editor.setDecorations(G.priority2DecorationType, priority2DecorationOptions);
	editor.setDecorations(G.priority3DecorationType, priority3DecorationOptions);
	editor.setDecorations(G.priority4DecorationType, priority4DecorationOptions);
	editor.setDecorations(G.priority5DecorationType, priority5DecorationOptions);
	editor.setDecorations(G.priority6DecorationType, priority6DecorationOptions);
	editor.setDecorations(G.priority7DecorationType, priority7DecorationOptions);
	editor.setDecorations(G.tagsDelimiterDecorationType, tagsDelimiterDecorationOptions);
	editor.setDecorations(G.projectDecorationType, projectDecorationOptions);
	editor.setDecorations(G.contextDecorationType, contextDecorationOptions);
	editor.setDecorations(G.notDueDecorationType, notDueDecorationOptions);
	editor.setDecorations(G.dueDecorationType, dueDecorationOptions);
	editor.setDecorations(G.overdueDecorationType, overdueDecorationOptions);

	editor.setDecorations(G.commentDecorationType, state.commentLines);
}
