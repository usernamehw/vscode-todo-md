import { DecorationOptions, Range, TextEditor, ThemeColor, window } from 'vscode';
import { extensionConfig, extensionState, Global } from './extension';
import { DueState } from './types';
import { forEachTask } from './utils/taskUtils';
import { isEmptyObject } from './utils/utils';
import { svgToUri } from './utils/vscodeUtils';
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
		fontWeight: 'normal',
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
	const enum DueDecorations {
		padding = '0 0.5ch',
		margin = '0.5ch',
		border = '1px dashed',
	}
	Global.overdueDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.overdueForeground'),
		after: {
			color: new ThemeColor('todomd.overdueForeground'),
			border: DueDecorations.border,
			textDecoration: `;margin-left:${DueDecorations.margin};text-align:center;padding:${DueDecorations.padding};`,
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
			border: DueDecorations.border,
			color: new ThemeColor('todomd.specialTagForeground'),
			textDecoration: `;margin-left:${DueDecorations.margin};text-align:center;padding:${DueDecorations.padding};`,
		},
	});
	Global.nestedTasksCountDecorationType = window.createTextEditorDecorationType({
		isWholeLine: true,
		after: {
			backgroundColor: new ThemeColor('todomd.nestedTasksCountBackground'),
			color: new ThemeColor('todomd.nestedTasksCountForeground'),
			border: '1px solid',
			borderColor: new ThemeColor('todomd.nestedTasksCountBorder'),
			margin: `0 0 0 ${DueDecorations.margin}`,
			textDecoration: `;text-align:center;padding:${DueDecorations.padding};position:relative;`,
		},
	});
	Global.nestedTasksPieDecorationType = window.createTextEditorDecorationType({
		isWholeLine: true,
		after: {
			width: `${extensionState.editorLineHeight}px`,
			height: `${extensionState.editorLineHeight}px`,
			margin: `0 0 0 ${DueDecorations.margin}`,
			textDecoration: `;vertical-align:middle;position:relative;top:-1px;`,
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
	const nestedTasksDecorationOptions: DecorationOptions[] = [];
	const nestedTasksPieOptions: DecorationOptions[] = [];

	forEachTask(task => {
		// When decoration have `isWholeLine` range can be empty / wouldn't matter
		const emptyRange = new Range(task.lineNumber, 0, task.lineNumber, 0);
		if (task.done) {
			completedDecorationRanges.push(emptyRange);
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
		if (task.subtasks.length) {
			let numberOfSubtasks = 0;
			let numberOfCompletedSubtasks = 0;
			forEachTask(subtask => {
				numberOfSubtasks++;
				if (subtask.done) {
					numberOfCompletedSubtasks++;
				}
			}, task.subtasks);
			nestedTasksDecorationOptions.push({
				range: emptyRange,
				renderOptions: {
					after: {
						contentText: `${numberOfCompletedSubtasks}/${numberOfSubtasks}`,
					},
				},
			});
			nestedTasksPieOptions.push({
				range: emptyRange,
				renderOptions: {
					after: {
						contentIconPath: svgToUri(createPieProgressSvg(extensionState.editorLineHeight, numberOfCompletedSubtasks, numberOfSubtasks)),
					},
				},
			});
		}
	});

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
	editor.setDecorations(Global.nestedTasksCountDecorationType, nestedTasksDecorationOptions);
	editor.setDecorations(Global.nestedTasksPieDecorationType, nestedTasksPieOptions);
	editor.setDecorations(Global.commentDecorationType, extensionState.commentLines);
}

/**
 * Create round svg in a shape of a pie diagram.
 */
function createPieProgressSvg(size: number, done: number, all: number) {
	const enum Svg {
		width = 20,
	}
	const targetPercentage = done / all * 100;
	const circleBg = `%23${extensionConfig.progressBackground.slice(1)}`;
	const pieBg = `%23${extensionConfig.progressForeground.slice(1)}`;

	let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" height="${size}" width="${size}" viewBox="0 0 ${Svg.width} ${Svg.width}">`;
	svgStr += `<circle r="10" cx="10" cy="10" fill="${circleBg}" />`;
	svgStr += `<circle r="5" cx="10" cy="10" fill="transparent" stroke="${pieBg}" stroke-width="10" stroke-dasharray="calc(${targetPercentage} * 31.4 / 100) 31.4" transform="rotate(-90) translate(-20)" />`;
	svgStr += '</svg>';
	return svgStr;
}
