import { Hover, languages, MarkdownString } from 'vscode';
import { $state, Global } from '../extension';
import { parseWord } from '../parse';
import { getTaskAtLineExtension } from '../utils/taskUtils';
import { getWordRangeAtPosition } from '../utils/vscodeUtils';
import { getTaskHoverMd } from './getTaskHover';
import { getTodoMdFileDocumentSelector } from './languageFeatures';

export function updateHover() {
	Global.hoverDisposable?.dispose();

	Global.hoverDisposable = languages.registerHoverProvider(
		getTodoMdFileDocumentSelector(),
		{
			provideHover(document, position, token) {
				const task = getTaskAtLineExtension(position.line);
				if (!task) {
					return undefined;
				}

				const range = getWordRangeAtPosition(document, position);
				const word = document.getText(range);
				/**
				 * Add hover description from the user setting "todomd.suggestItems".
				 */
				const hoveredWordUserDescription = new MarkdownString(undefined, true);
				hoveredWordUserDescription.isTrusted = true;
				/**
				 * Add all tasks with the same project/tag/context.
				 */
				const otherTasks: MarkdownString[] = [];

				if (range) {
					const parsedWord = parseWord(word, position.line, range.start.character);
					if (parsedWord.type === 'project') {
						const projectName = parsedWord.value;
						if ($state.suggestProjects[projectName]) {
							hoveredWordUserDescription.appendMarkdown($state.suggestProjects[projectName]);
						}

						for (const otherTask of $state.projectsForTreeView.find(project => project.title === projectName)?.tasks || []) {
							if (otherTask.lineNumber === task.lineNumber) {
								continue;
							}
							otherTasks.push(getTaskHoverMd(otherTask));
						}
					} else if (parsedWord.type === 'context') {
						const contextName = parsedWord.value;
						if ($state.suggestContexts[contextName]) {
							hoveredWordUserDescription.appendMarkdown($state.suggestContexts[contextName]);
						}

						for (const otherTask of $state.contextsForTreeView.find(context => context.title === contextName)?.tasks || []) {
							if (otherTask.lineNumber === task.lineNumber) {
								continue;
							}
							otherTasks.push(getTaskHoverMd(otherTask));
						}
					} else if (parsedWord.type === 'tags') {
						let index = 0;
						for (let i = 0; i < parsedWord.ranges.length; i++) {
							const tagRange = parsedWord.ranges[i];
							if (tagRange.contains(position)) {
								index = i;
								break;
							}
						}
						const tagName = parsedWord.value[index];

						if ($state.suggestTags[tagName]) {
							hoveredWordUserDescription.appendMarkdown($state.suggestTags[tagName]);
						}

						for (const otherTask of $state.tagsForTreeView.find(tag => tag.title === tagName)?.tasks || []) {
							if (otherTask.lineNumber === task.lineNumber) {
								continue;
							}
							otherTasks.push(getTaskHoverMd(otherTask));
						}
					}
				}
				return new Hover([
					hoveredWordUserDescription,
					getTaskHoverMd(task),
					...otherTasks,
				]);
			},
		},
	);
}
