import { DecorationOptions, Range, TextEditor, ThemeColor, window } from 'vscode';
import { extensionConfig, extensionState, Global } from './extension';
import { DueState } from './types';
import { isEmptyObject } from './utils/utils';
/**
 * Update editor decoration style
 */
export function updateEditorDecorationStyle() {
	Global.userSpecifiedAdvancedTagDecorations = !isEmptyObject(extensionConfig.decorations.tag);
	Global.completedTaskDecorationType = window.createTextEditorDecorationType({
		isWholeLine: true,
		textDecoration: extensionConfig.completedStrikeThrough ? 'line-through rgba(255, 255, 255, 0.35)' : undefined,
		light: {
			textDecoration: extensionConfig.completedStrikeThrough ? 'line-through rgba(0, 0, 0, 0.25)' : undefined,
		},
		...extensionConfig.decorations.completedTask,
	});
	Global.commentDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.commentForeground'),
		isWholeLine: true,
		...extensionConfig.decorations.comment,
	});
	Global.priorityADecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityAForeground'),
		...extensionConfig.decorations.priorityAForeground,
	});
	Global.priorityBDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityBForeground'),
		...extensionConfig.decorations.priorityBForeground,
	});
	Global.priorityCDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityCForeground'),
		...extensionConfig.decorations.priorityCForeground,
	});
	Global.priorityDDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityDForeground'),
		...extensionConfig.decorations.priorityDForeground,
	});
	Global.priorityEDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityEForeground'),
		...extensionConfig.decorations.priorityEForeground,
	});
	Global.priorityFDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityFForeground'),
		...extensionConfig.decorations.priorityFForeground,
	});
	Global.tagsDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.tagForeground'),
		...extensionConfig.decorations.tag,
	});
	Global.tagWithDelimiterDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.tagForeground'),
		...extensionConfig.decorations.tag,
	});
	Global.tagsDelimiterDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.tagDelimiterForeground'),
	});
	Global.specialTagDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.specialTagForeground'),
	});
	Global.projectDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.projectForeground'),
		...extensionConfig.decorations.project,
	});
	Global.contextDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.contextForeground'),
		...extensionConfig.decorations.context,
	});
	Global.notDueDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.notDueForeground'),
		...extensionConfig.decorations.notDue,
	});
	Global.dueDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.dueForeground'),
		...extensionConfig.decorations.due,
	});
	const duePadding = '0.5ch';
	Global.overdueDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.overdueForeground'),
		after: {
			color: new ThemeColor('todomd.overdueForeground'),
			border: '1px dashed',
			textDecoration: `;margin-left:${duePadding};text-align:center;padding:1px ${duePadding};`,
		},
		...extensionConfig.decorations.overdue,
	});
	Global.invalidDueDateDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.invalidDueDateForeground'),
		backgroundColor: new ThemeColor('todomd.invalidDueDateBackground'),
		...extensionConfig.decorations.invalidDue,
	});
	Global.closestDueDateDecorationType = window.createTextEditorDecorationType({
		after: {
			border: '1px dashed',
			color: new ThemeColor('todomd.specialTagForeground'),
			textDecoration: `;margin-left:${duePadding};text-align:center;padding:1px ${duePadding};`,
		},
	});
}
/**
 * Actually update the editor decorations
 */
export function doUpdateEditorDecorations(editor: TextEditor) {
	const completedDecorationRanges: Range[] = [];
	const tagsDecorationRanges: Range[] = [];
	const priorityADecorationRanges: Range[] = [];
	const priorityBDecorationRanges: Range[] = [];
	const priorityCDecorationRanges: Range[] = [];
	const priorityDDecorationRanges: Range[] = [];
	const priorityEDecorationRanges: Range[] = [];
	const priorityFDecorationRanges: Range[] = [];
	const tagsDelimiterDecorationRanges: Range[] = [];
	const tagWithDelimiterDecorationRanges: Range[] = [];
	const specialtagDecorationRanges: Range[] = [];
	const projectDecorationRanges: Range[] = [];
	const contextDecorationRanges: Range[] = [];
	const notDueDecorationRanges: Range[] = [];
	const dueDecorationRanges: Range[] = [];
	const overdueDecorationOptions: DecorationOptions[] = [];
	const invalidDueDateDecorationRanges: Range[] = [];
	const closestDueDateDecorationOptions: DecorationOptions[] = [];

	for (const task of extensionState.tasks) {
		if (task.done) {
			completedDecorationRanges.push(new Range(task.lineNumber, 0, task.lineNumber, 0));
		}
		if (task.tagsRange) {
			if (!Global.userSpecifiedAdvancedTagDecorations) {
				tagsDecorationRanges.push(...task.tagsRange);
				tagsDelimiterDecorationRanges.push(...task.tagsDelimiterRanges!);// if `tagsRange` exists - `tagsDelimiterRanges` also exists
			} else {
				// User has advanced decorations. Include tag symbol in decoration range.
				tagWithDelimiterDecorationRanges.push(...task.tagsRange.map(range => new Range(range.start.line, range.start.character - 1, range.end.line, range.end.character)));
			}
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
				overdueDecorationOptions.push({
					range: dueRange,
					renderOptions: {
						after: {
							contentText: `${due.overdueInDays}d`,
						},
					},
				});
				if (task.overdueRange) {
					specialtagDecorationRanges.push(task.overdueRange);
				}
			} else if (due.isDue === DueState.invalid) {
				invalidDueDateDecorationRanges.push(dueRange);
			}
			if (due.isDue === DueState.notDue && due.closestDueDateInTheFuture) {
				closestDueDateDecorationOptions.push({
					range: dueRange,
					renderOptions: {
						after: {
							contentText: `+${due.daysUntilDue}d`,
						},
					},
				});
			}
		}
	}

	editor.setDecorations(Global.completedTaskDecorationType, completedDecorationRanges);
	editor.setDecorations(Global.tagsDecorationType, tagsDecorationRanges);
	editor.setDecorations(Global.tagWithDelimiterDecorationType, tagWithDelimiterDecorationRanges);
	editor.setDecorations(Global.tagsDelimiterDecorationType, tagsDelimiterDecorationRanges);
	editor.setDecorations(Global.specialTagDecorationType, specialtagDecorationRanges);
	editor.setDecorations(Global.priorityADecorationType, priorityADecorationRanges);
	editor.setDecorations(Global.priorityBDecorationType, priorityBDecorationRanges);
	editor.setDecorations(Global.priorityCDecorationType, priorityCDecorationRanges);
	editor.setDecorations(Global.priorityDDecorationType, priorityDDecorationRanges);
	editor.setDecorations(Global.priorityEDecorationType, priorityEDecorationRanges);
	editor.setDecorations(Global.priorityFDecorationType, priorityFDecorationRanges);
	editor.setDecorations(Global.projectDecorationType, projectDecorationRanges);
	editor.setDecorations(Global.contextDecorationType, contextDecorationRanges);
	editor.setDecorations(Global.notDueDecorationType, notDueDecorationRanges);
	editor.setDecorations(Global.dueDecorationType, dueDecorationRanges);
	editor.setDecorations(Global.overdueDecorationType, overdueDecorationOptions);
	editor.setDecorations(Global.invalidDueDateDecorationType, invalidDueDateDecorationRanges);
	editor.setDecorations(Global.closestDueDateDecorationType, closestDueDateDecorationOptions);
	editor.setDecorations(Global.commentDecorationType, extensionState.commentLines);
}
