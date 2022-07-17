import { DecorationOptions, Range, TextEditor, TextEditorDecorationType, ThemeColor, window } from 'vscode';
import { $config, $state } from './extension';
import { makeClosestDueDateDecoration } from './languageFeatures/getTaskHover';
import { IsDue } from './types';
import { forEachTask } from './utils/taskUtils';
import { svgToUri } from './utils/vscodeUtils';

let completedTaskDecorationType: TextEditorDecorationType;
let favoriteTaskDecorationType: TextEditorDecorationType;
let commentDecorationType: TextEditorDecorationType;
let priorityADecorationType: TextEditorDecorationType;
let priorityBDecorationType: TextEditorDecorationType;
let priorityCDecorationType: TextEditorDecorationType;
let priorityDDecorationType: TextEditorDecorationType;
let priorityEDecorationType: TextEditorDecorationType;
let priorityFDecorationType: TextEditorDecorationType;
let tagsDecorationType: TextEditorDecorationType;
let tagWithDelimiterDecorationType: TextEditorDecorationType;
let specialTagDecorationType: TextEditorDecorationType;
let projectDecorationType: TextEditorDecorationType;
let contextDecorationType: TextEditorDecorationType;
let notDueDecorationType: TextEditorDecorationType;
let dueDecorationType: TextEditorDecorationType;
let overdueDecorationType: TextEditorDecorationType;
let invalidDueDateDecorationType: TextEditorDecorationType;
let closestDueDateDecorationType: TextEditorDecorationType;
let nestedTasksCountDecorationType: TextEditorDecorationType;
let nestedTasksPieDecorationType: TextEditorDecorationType;

export function disposeDecorations() {
	completedTaskDecorationType?.dispose();
	favoriteTaskDecorationType?.dispose();
	commentDecorationType?.dispose();
	priorityADecorationType?.dispose();
	priorityBDecorationType?.dispose();
	priorityCDecorationType?.dispose();
	priorityDDecorationType?.dispose();
	priorityEDecorationType?.dispose();
	priorityFDecorationType?.dispose();
	tagsDecorationType?.dispose();
	tagWithDelimiterDecorationType?.dispose();
	specialTagDecorationType?.dispose();
	projectDecorationType?.dispose();
	contextDecorationType?.dispose();
	notDueDecorationType?.dispose();
	dueDecorationType?.dispose();
	overdueDecorationType?.dispose();
	invalidDueDateDecorationType?.dispose();
	closestDueDateDecorationType?.dispose();
	nestedTasksCountDecorationType?.dispose();
	nestedTasksPieDecorationType?.dispose();
}

/**
 * Update editor decoration style
 */
export function updateEditorDecorationStyle() {
	disposeDecorations();

	completedTaskDecorationType = window.createTextEditorDecorationType({
		isWholeLine: true,
		textDecoration: $config.completedStrikeThrough ? 'line-through rgba(255, 255, 255, 0.35)' : undefined,
		light: {
			textDecoration: $config.completedStrikeThrough ? 'line-through rgba(0, 0, 0, 0.25)' : undefined,
		},
		...$config.decorations.completedTask,
	});
	favoriteTaskDecorationType = window.createTextEditorDecorationType({
		isWholeLine: true,
		backgroundColor: new ThemeColor('todomd.favoriteTaskBackground'),
	});
	commentDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.commentForeground'),
		isWholeLine: true,
		fontWeight: 'normal',
		...$config.decorations.comment,
	});
	priorityADecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityAForeground'),
		fontWeight: 'bold',
		...$config.decorations.priorityAForeground,
	});
	priorityBDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityBForeground'),
		fontWeight: 'bold',
		...$config.decorations.priorityBForeground,
	});
	priorityCDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityCForeground'),
		fontWeight: 'bold',
		...$config.decorations.priorityCForeground,
	});
	priorityDDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityDForeground'),
		fontWeight: 'bold',
		...$config.decorations.priorityDForeground,
	});
	priorityEDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityEForeground'),
		fontWeight: 'bold',
		...$config.decorations.priorityEForeground,
	});
	priorityFDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.priorityFForeground'),
		fontWeight: 'bold',
		...$config.decorations.priorityFForeground,
	});
	const counterBadgeDecoration = ';position:absolute;display:inline-flex;align-items:center;padding:0px 1px;border-radius:2px;font-size:9px;top:-10%;height:50%;';
	const counterBadgeDecorationLight = 'background-color:rgba(0,0,0,0.06);color:#111;';
	const counterBadgeDecorationDark = 'background-color:rgba(255,255,255,0.12);color:#eee;';
	tagsDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.tagForeground'),
		light: {
			after: {
				textDecoration: $config.counterBadgeEnabled ? `${counterBadgeDecoration}${counterBadgeDecorationLight}` : undefined,
			},
		},
		dark: {
			after: {
				textDecoration: $config.counterBadgeEnabled ? `${counterBadgeDecoration}${counterBadgeDecorationDark}` : undefined,
			},
		},
		...$config.decorations.tag,
	});
	tagWithDelimiterDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.tagForeground'),
		...$config.decorations.tag,
	});
	specialTagDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.specialTagForeground'),
	});
	projectDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.projectForeground'),
		light: {
			after: {
				textDecoration: $config.counterBadgeEnabled ? `${counterBadgeDecoration}${counterBadgeDecorationLight}` : undefined,
			},
		},
		dark: {
			after: {
				textDecoration: $config.counterBadgeEnabled ? `${counterBadgeDecoration}${counterBadgeDecorationDark}` : undefined,
			},
		},
		...$config.decorations.project,
	});
	contextDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.contextForeground'),
		light: {
			after: {
				textDecoration: $config.counterBadgeEnabled ? `${counterBadgeDecoration}${counterBadgeDecorationLight}` : undefined,
			},
		},
		dark: {
			after: {
				textDecoration: $config.counterBadgeEnabled ? `${counterBadgeDecoration}${counterBadgeDecorationDark}` : undefined,
			},
		},
		...$config.decorations.context,
	});
	notDueDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.notDueForeground'),
		...$config.decorations.notDue,
	});
	dueDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.dueForeground'),
		...$config.decorations.due,
	});
	const enum DueDecorations {
		Padding = '0 0.5ch',
		Margin = '0.5ch',
		Border = '1px dashed',
	}
	overdueDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.overdueForeground'),
		after: {
			color: new ThemeColor('todomd.overdueForeground'),
			border: DueDecorations.Border,
			textDecoration: `;margin-left:${DueDecorations.Margin};text-align:center;padding:${DueDecorations.Padding};`,
		},
		...$config.decorations.overdue,
	});
	invalidDueDateDecorationType = window.createTextEditorDecorationType({
		color: new ThemeColor('todomd.invalidDueDateForeground'),
		backgroundColor: new ThemeColor('todomd.invalidDueDateBackground'),
		...$config.decorations.invalidDue,
	});
	closestDueDateDecorationType = window.createTextEditorDecorationType({
		after: {
			border: DueDecorations.Border,
			color: new ThemeColor('todomd.specialTagForeground'),
			textDecoration: `;margin-left:${DueDecorations.Margin};text-align:center;padding:${DueDecorations.Padding};`,
		},
	});
	nestedTasksCountDecorationType = window.createTextEditorDecorationType({
		isWholeLine: true,
		after: {
			backgroundColor: new ThemeColor('todomd.nestedTasksCountBackground'),
			color: new ThemeColor('todomd.nestedTasksCountForeground'),
			border: '1px solid',
			borderColor: new ThemeColor('todomd.nestedTasksCountBorder'),
			margin: `0 0 0 ${DueDecorations.Margin}`,
			textDecoration: `;text-align:center;padding:${DueDecorations.Padding};position:relative;`,
		},
	});
	nestedTasksPieDecorationType = window.createTextEditorDecorationType({
		isWholeLine: true,
		after: {
			width: `${$state.editorLineHeight}px`,
			height: `${$state.editorLineHeight}px`,
			margin: `0 0 0 ${DueDecorations.Margin}`,
			textDecoration: `;vertical-align:middle;position:relative;top:-1px;`,
		},
	});
}
/**
 * Actually update the editor decorations
 */
export function doUpdateEditorDecorations(editor: TextEditor) {
	const completedDecorationRanges: Range[] = [];
	const favoriteDecorationRanges: Range[] = [];
	const tagsDecorationOptions: DecorationOptions[] = [];
	const projectDecorationOptions: DecorationOptions[] = [];
	const contextDecorationOptions: DecorationOptions[] = [];
	const priorityADecorationRanges: Range[] = [];
	const priorityBDecorationRanges: Range[] = [];
	const priorityCDecorationRanges: Range[] = [];
	const priorityDDecorationRanges: Range[] = [];
	const priorityEDecorationRanges: Range[] = [];
	const priorityFDecorationRanges: Range[] = [];
	const tagWithDelimiterDecorationRanges: Range[] = [];
	const specialtagDecorationRanges: Range[] = [];
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
		if (task.favorite) {
			favoriteDecorationRanges.push(emptyRange);
		}
		if (task.tagsRange) {
			for (let i = 0; i < task.tags.length; i++) {
				let contentText: string | undefined = undefined;
				if ($config.counterBadgeEnabled) {
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
			for (let i = 0; i < task.contexts.length; i++) {
				let contentText: string | undefined = undefined;
				if ($config.counterBadgeEnabled) {
					contentText = String($state.contextsForTreeView.find(context => context.title === task.contexts[i])?.tasks.length || '');
				}
				contextDecorationOptions.push({
					range: task.contextRanges[i],
					renderOptions: {
						after: {
							contentText,
						},
					},
				});
			}
		}
		if (task.projectRanges && task.projectRanges.length) {
			for (let i = 0; i < task.projects.length; i++) {
				let contentText: string | undefined = undefined;
				if ($config.counterBadgeEnabled) {
					contentText = String($state.projectsForTreeView.find(project => project.title === task.projects[i])?.tasks.length || '');
				}
				projectDecorationOptions.push({
					range: task.projectRanges[i],
					renderOptions: {
						after: {
							contentText,
						},
					},
				});
			}
		}
		if (task.due) {
			const due = task.due;
			const dueRange = task.dueRange!;// if due exists - dueRange exists too
			if (due.isDue === IsDue.Due) {
				dueDecorationRanges.push(dueRange);
			} else if (due.isDue === IsDue.NotDue) {
				notDueDecorationRanges.push(dueRange);
			} else if (due.isDue === IsDue.Overdue) {
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
			} else if (due.isDue === IsDue.Invalid) {
				invalidDueDateDecorationRanges.push(dueRange);
			}
			if (due.isDue === IsDue.NotDue && due.closestDueDateInTheFuture) {
				closestDueDateDecorationOptions.push({
					range: dueRange,
					renderOptions: {
						after: {
							contentText: makeClosestDueDateDecoration(task),
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

	editor.setDecorations(completedTaskDecorationType, completedDecorationRanges);
	editor.setDecorations(favoriteTaskDecorationType, favoriteDecorationRanges);
	editor.setDecorations(tagsDecorationType, tagsDecorationOptions);
	editor.setDecorations(projectDecorationType, projectDecorationOptions);
	editor.setDecorations(contextDecorationType, contextDecorationOptions);
	editor.setDecorations(tagWithDelimiterDecorationType, tagWithDelimiterDecorationRanges);
	editor.setDecorations(specialTagDecorationType, specialtagDecorationRanges);
	editor.setDecorations(priorityADecorationType, priorityADecorationRanges);
	editor.setDecorations(priorityBDecorationType, priorityBDecorationRanges);
	editor.setDecorations(priorityCDecorationType, priorityCDecorationRanges);
	editor.setDecorations(priorityDDecorationType, priorityDDecorationRanges);
	editor.setDecorations(priorityEDecorationType, priorityEDecorationRanges);
	editor.setDecorations(priorityFDecorationType, priorityFDecorationRanges);
	editor.setDecorations(notDueDecorationType, notDueDecorationRanges);
	editor.setDecorations(dueDecorationType, dueDecorationRanges);
	editor.setDecorations(overdueDecorationType, overdueDecorationOptions);
	editor.setDecorations(invalidDueDateDecorationType, invalidDueDateDecorationRanges);
	editor.setDecorations(closestDueDateDecorationType, closestDueDateDecorationOptions);
	editor.setDecorations(nestedTasksCountDecorationType, nestedTasksDecorationOptions);
	editor.setDecorations(nestedTasksPieDecorationType, nestedTasksPieOptions);
	editor.setDecorations(commentDecorationType, $state.commentLines);
}

/**
 * Create round svg in a shape of a pie diagram.
 */
function createPieProgressSvg(size: number, done: number, all: number) {
	const enum Svg {
		Width = 20,
	}
	const targetPercentage = done / all * 100;
	const circleBg = `%23${$config.progressBackground.slice(1)}`;
	const pieBg = `%23${$config.progressForeground.slice(1)}`;

	let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" height="${size}" width="${size}" viewBox="0 0 ${Svg.Width} ${Svg.Width}">`;
	svgStr += `<circle r="10" cx="10" cy="10" fill="${circleBg}" />`;
	svgStr += `<circle r="5" cx="10" cy="10" fill="transparent" stroke="${pieBg}" stroke-width="10" stroke-dasharray="calc(${targetPercentage} * 31.4 / 100) 31.4" transform="rotate(-90) translate(-20)" />`;
	svgStr += '</svg>';
	return svgStr;
}
