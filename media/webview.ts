/* eslint-disable no-undef */
import fuzzysort from 'fuzzysort';
import escapeRegexp from 'lodash/escapeRegExp';
import marked from 'marked';
import { filterItems } from '../src/filter';
import { defaultSortTasks } from '../src/sort';
import type { TheTask } from '../src/TheTask';
import { DueState, IExtensionConfig, WebviewMessage } from '../src/types';

// @ts-expect-error
const awesomplete = new Awesomplete($filterInputEl, {
	list: [],
	autoFirst: true,
	minChars: 1,
	maxItems: 6,
	// @ts-ignore
	tabSelect: true,
	// @ts-expect-error
	filter(text: {label: string; value: string}, input) {
		if (!state.config.autoShowSuggest) {
			return false;
		}
		const result = fuzzysort.go(input, [text.value]);
		return result.length > 0;
	},
	// @ts-expect-error
	item(text: {label: string; value: string}, input) {
		const li = document.createElement('li');
		li.innerHTML = fuzzysort.highlight(fuzzysort.single(input, text.value), '<mark>', '</mark>');
		return li as HTMLElement;
	},
});

function updateFilterInputAutocomplete(tags: string[], projects: string[], contexts: string[]) {
	const filterConstants = [
		'$due',
		'$done',
		'$overdue',
		'$recurring',
		'$noTag',
		'$noProject',
		'$noContext',
	];
	const autocompleteTags = tags.map(tag => `#${tag}`);
	const autocompleteProjects = projects.map(project => `+${project}`);
	const autocompleteContexts = contexts.map(context => `@${context}`);
	awesomplete.list = filterConstants.concat(autocompleteTags, autocompleteProjects, autocompleteContexts);
}
