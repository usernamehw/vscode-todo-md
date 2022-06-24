import { TheTask } from './TheTask';
import { DueState } from './types';

const enum FilterType {
	RawContains,
	TitleContains,
	TagEqual,
	ContextEqual,
	ProjectEqual,
	PriorityEqual,
	HasDue,
	Due,
	Overdue,
	Recurring,
	Done,
	Started,
	NoTag,
	NoProject,
	NoContext,
}
/**
 * When the filter has `>` or `<` symbols.
 */
const enum FilterMoreLess {
	None,
	More,
	Less,
}
interface Filter {
	value: string;
	filterType: FilterType;
	isNegation?: boolean;
	filterMoreLess?: FilterMoreLess;
}
/**
 * Take tasks and a filter string and return filtered tasks.
 */
export function filterItems(tasks: TheTask[], filterStr = ''): TheTask[] {
	if (filterStr.length === 0) {
		return tasks;
	}
	const filters = parseFilter(filterStr);
	const filteredTasks = tasks.filter(task => {
		const results = [];
		for (const filter of filters) {
			let filterResult = false;
			if (task.subtasks.length) {
				const nestedMatch = filterItems(task.subtasks, filterStr);
				if (nestedMatch.length > 0) {
					filterResult = true;
				}
			}
			if (filter.filterType === FilterType.RawContains) {
				// Anything in the string (rawText)
				if (task.rawText.toLowerCase().includes(filter.value.toLowerCase())) {
					filterResult = true;
				}
			} else if (filter.filterType === FilterType.TitleContains) {
				// Title match
				if (task.title.toLowerCase().includes(filter.value.toLowerCase())) {
					filterResult = true;
				}
			} else if (filter.filterType === FilterType.TagEqual) {
				// #Tag
				if (task.tags.includes(filter.value)) {
					filterResult = true;
				}
			} else if (filter.filterType === FilterType.ContextEqual) {
				// @Context
				if (task.contexts.includes(filter.value)) {
					filterResult = true;
				}
			} else if (filter.filterType === FilterType.ProjectEqual) {
				// +Project
				if (task.projects.includes(filter.value)) {
					filterResult = true;
				}
			} else if (filter.filterType === FilterType.PriorityEqual) {
				// $A - $Z priority
				if (filter.filterMoreLess) {
					// >$A <$A
					if (filter.filterMoreLess === FilterMoreLess.More) {
						filterResult = filter.value >= task.priority;
					} else {
						filterResult = filter.value <= task.priority;
					}
				} else {
					// Simple equal
					if (task.priority === filter.value) {
						filterResult = true;
					}
				}
			} else if (filter.filterType === FilterType.Done) {
				// $done
				if (task.done) {
					filterResult = true;
				}
			} else if (filter.filterType === FilterType.Started) {
				// $started
				if (task.startRange && !task.durationRange) {
					filterResult = true;
				}
			} else if (filter.filterType === FilterType.HasDue) {
				// $hasDue
				if (task.due) {
					filterResult = true;
				}
			} else if (filter.filterType === FilterType.Due) {
				// $due
				if (task.due?.isDue === DueState.Due || task.due?.isDue === DueState.Overdue) {
					filterResult = true;
				}
			} else if (filter.filterType === FilterType.Overdue) {
				// $overdue
				if (task.due?.isDue === DueState.Overdue) {
					filterResult = true;
				}
			} else if (filter.filterType === FilterType.Recurring) {
				// $recurring
				if (task.due?.isRecurring === true) {
					filterResult = true;
				}
			} else if (filter.filterType === FilterType.NoTag) {
				// $noTag
				if (task.tags.length === 0) {
					filterResult = true;
				}
			} else if (filter.filterType === FilterType.NoProject) {
				// $noProject
				if (task.projects.length === 0) {
					filterResult = true;
				}
			} else if (filter.filterType === FilterType.NoContext) {
				// $noContext
				if (task.contexts.length === 0) {
					filterResult = true;
				}
			}
			if (filter.isNegation) {
				filterResult = !filterResult;
			}
			results.push(filterResult);
		}
		return results.every(r => r === true);
	});
	return filteredTasks;
}
/**
 * Determine which type of filter this is and if it has negation or range (<,>).
 */
function parseFilter(filterStr = '') {
	const filters: Filter[] = [];
	const titleRegex = /(-)?"(.+?)"/;
	const titleMatch = titleRegex.exec(filterStr);
	if (titleMatch) {
		filters.push({
			filterType: FilterType.TitleContains,
			value: titleMatch[2],
			isNegation: Boolean(titleMatch[1]),
		});
		filterStr = filterStr.replace(titleRegex, '');
	}
	const words = filterStr.split(' ');
	for (const word of words) {
		if (!word.length) {
			continue;
		}
		const filter: Filter = {
			isNegation: false,
			value: '',
			filterType: FilterType.RawContains,
		};
		let isNegation;
		let value;
		let firstChar;
		if (word[0] === '-') {
			isNegation = true;
			value = word.slice(2);
			firstChar = word[1];
		} else {
			if (word[0] === '>' || word[0] === '<') {
				firstChar = word[1];
				value = word.slice(2);
				filter.filterMoreLess = word[0] === '>' ? FilterMoreLess.More : FilterMoreLess.Less;
			} else {
				value = word.slice(1);
				firstChar = word[0];
			}
		}
		switch (firstChar) {
			case '#': {
				const tags = word.split('#').filter(tag => tag.length);
				for (const tag of tags) {
					filters.push({
						filterType: FilterType.TagEqual,
						value: tag,
					});
				}
				continue;
			}
			case '@': {
				filter.filterType = FilterType.ContextEqual; break;
			}
			case '+': {
				filter.filterType = FilterType.ProjectEqual; break;
			}
			case '$': {
				if (value === 'done') {
					filter.filterType = FilterType.Done;
				} else if (value === 'started') {
					filter.filterType = FilterType.Started;
				} else if (value === 'hasDue') {
					filter.filterType = FilterType.HasDue;
				} else if (value === 'due') {
					filter.filterType = FilterType.Due;
				} else if (value === 'overdue') {
					filter.filterType = FilterType.Overdue;
				} else if (value === 'recurring') {
					filter.filterType = FilterType.Recurring;
				} else if (value === 'noProject') {
					filter.filterType = FilterType.NoProject;
				} else if (value === 'noContext') {
					filter.filterType = FilterType.NoContext;
				} else if (value === 'noTag') {
					filter.filterType = FilterType.NoTag;
				} else if (/^[A-Z]$/.test(value)) {
					filter.filterType = FilterType.PriorityEqual;
				}
				break;
			}
			default: {
				value = word;
				filter.filterType = FilterType.RawContains;
			}
		}
		filter.value = value;
		filter.isNegation = isNegation;
		filters.push(filter);
	}
	return filters;
}

