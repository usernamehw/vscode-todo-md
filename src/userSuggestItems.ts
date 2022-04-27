import { $config, $state } from './extension';

/**
 * Get autocomplete items from user setting
 */
export function updateUserSuggestItems() {
	const tags: Record<string, string> = {};
	const projects: Record<string, string> = {};
	const contexts: Record<string, string> = {};
	for (const item in $config.suggestItems) {
		const description = $config.suggestItems[item];
		switch (item[0]) {
			case '#': tags[item.slice(1)] = description; break;
			case '+': projects[item.slice(1)] = description; break;
			case '@': contexts[item.slice(1)] = description; break;
		}
	}
	$state.suggestTags = tags;
	$state.suggestProjects = projects;
	$state.suggestContexts = contexts;
}
