import dayjs from 'dayjs';
import { DecorationOptions, Range, TextEditor, ThemeColor, window } from 'vscode';
import { $config, $state, Global } from './extension';
import { weekdayNamesShort } from './time/timeUtils';
import { DueState } from './types';
import { forEachTask } from './utils/taskUtils';
import { isEmptyObject } from './utils/utils';
import { svgToUri } from './utils/vscodeUtils';
/**
 * Update editor decoration style
 */
export function updateEditorDecorationStyle() {
	Global.userSpecifiedAdvancedTagDecorations = !isEmptyObject($config.decorations.tag);
	Global.completedTaskDecorationType = window.createTextEditorDecorationType({
		isWholeLine: true,
		textDecoration: $config.completedStrikeThrough ? 'line-through rgba(255, 255, 255, 0.35)' : undefined,
		light: {
			textDecoration: $config.completedStrikeThrough ? 'line-through rgba(0, 0, 0, 0.25)' : undefined,
		},
		...$config.decorations.completedTask,
	});
	Global.commentDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.commentForeground'),
		isWholeLine: true,
		fontWeight: 'normal',
		...$config.decorations.comment,
	});
	Global.priorityADecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityAForeground'),
		fontWeight: 'bold',
		...$config.decorations.priorityAForeground,
	});
	Global.priorityBDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityBForeground'),
		fontWeight: 'bold',
		...$config.decorations.priorityBForeground,
	});
	Global.priorityCDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityCForeground'),
		fontWeight: 'bold',
		...$config.decorations.priorityCForeground,
	});
	Global.priorityDDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityDForeground'),
		fontWeight: 'bold',
		...$config.decorations.priorityDForeground,
	});
	Global.priorityEDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityEForeground'),
		fontWeight: 'bold',
		...$config.decorations.priorityEForeground,
	});
	Global.priorityFDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityFForeground'),
		fontWeight: 'bold',
		...$config.decorations.priorityFForeground,
	});
	const tagCounterBadgeDecoration = ';position:absolute;display:inline-flex;align-items:center;padding:0px 1px;border-radius:2px;font-size:9px;top:-10%;height:50%;';
	const tagCounterBadgeDecorationLight = 'background-color:rgba(0,0,0,0.06);color:#111;';
	const tagCounterBadgeDecorationDark = 'background-color:rgba(255,255,255,0.12);color:#eee;';
	Global.tagsDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.tagForeground'),
		light: {
			after: {
				textDecoration: $config.tagCounterBadgeEnabled ? `${tagCounterBadgeDecoration}${tagCounterBadgeDecorationLight}` : undefined,
			},
		},
		dark: {
			after: {
				textDecoration: $config.tagCounterBadgeEnabled ? `${tagCounterBadgeDecoration}${tagCounterBadgeDecorationDark}` : undefined,
			},
		},
		...$config.decorations.tag,
	});
	Global.tagWithDelimiterDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.tagForeground'),
		...$config.decorations.tag,
	});
	Global.tagsDelimiterDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.tagDelimiterForeground'),
	});
	Global.specialTagDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.specialTagForeground'),
	});
	Global.projectDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.projectForeground'),
		...$config.decorations.project,
	});
	Global.contextDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.contextForeground'),
		...$config.decorations.context,
	});
	Global.notDueDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.notDueForeground'),
		...$config.decorations.notDue,
	});
	Global.dueDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.dueForeground'),
		...$config.decorations.due,
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
		...$config.decorations.overdue,
	});
	Global.invalidDueDateDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.invalidDueDateForeground'),
		backgroundColor: new ThemeColor('todomd.invalidDueDateBackground'),
		...$config.decorations.invalidDue,
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
			width: `${$state.editorLineHeight}px`,
			height: `${$state.editorLineHeight}px`,
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
	const tagsDecorationOptions: DecorationOptions[] = [];
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
		const emptyRange = new Range(task.lineNumber, 0, task.lineNumber, 0);// TODO: move outside?
		if (task.done) {
			completedDecorationRanges.push(emptyRange);
		}
		if (task.tagsRange) {
			if (!Global.userSpecifiedAdvancedTagDecorations) {
				for (let i = 0; i < task.tags.length; i++) {
					let contentText: string | undefined = undefined;
					if ($config.tagCounterBadgeEnabled) {
						contentText = String($state.tagsForTreeView.find(tag => tag.title === task.tags[i])?.tasks.length || '');
					}
					tagsDecorationOptions.push({
						range: task.tagsRange[i],
						renderOptions: {
							after: {
								contentText,
							},
						},
					});
				}
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
			if (due.isDue === DueState.Due) {
				dueDecorationRanges.push(dueRange);
			} else if (due.isDue === DueState.NotDue) {
				notDueDecorationRanges.push(dueRange);
			} else if (due.isDue === DueState.Overdue) {
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
			} else if (due.isDue === DueState.Invalid) {
				invalidDueDateDecorationRanges.push(dueRange);
			}
			if (due.isDue === DueState.NotDue && due.closestDueDateInTheFuture) {
				closestDueDateDecorationOptions.push({
					range: dueRange,
					renderOptions: {
						after: {
							contentText: `+${due.daysUntilDue}d${$config.closestDueDateIncludeWeekday ? ` ${weekdayNamesShort[dayjs().add(due.daysUntilDue, 'day').get('day')]}` : ''} `,
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
						contentIconPath: svgToUri(createPieProgressSvg($state.editorLineHeight, numberOfCompletedSubtasks, numberOfSubtasks)),
					},
				},
			});
		}
	});

	editor.setDecorations(Global.completedTaskDecorationType, completedDecorationRanges);
	editor.setDecorations(Global.tagsDecorationType, tagsDecorationOptions);
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
	editor.setDecorations(Global.commentDecorationType, $state.commentLines);
}

/**
 * Create round svg in a shape of a pie diagram.
 */
function createPieProgressSvg(size: number, done: number, all: number) {
	const enum Svg {
		width = 20,
	}
	const targetPercentage = done / all * 100;
	const circleBg = `%23${$config.progressBackground.slice(1)}`;
	const pieBg = `%23${$config.progressForeground.slice(1)}`;

	let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" height="${size}" width="${size}" viewBox="0 0 ${Svg.width} ${Svg.width}">`;
	svgStr += `<circle r="10" cx="10" cy="10" fill="${circleBg}" />`;
	svgStr += `<circle r="5" cx="10" cy="10" fill="transparent" stroke="${pieBg}" stroke-width="10" stroke-dasharray="calc(${targetPercentage} * 31.4 / 100) 31.4" transform="rotate(-90) translate(-20)" />`;
	svgStr += '</svg>';
	return svgStr;
}
