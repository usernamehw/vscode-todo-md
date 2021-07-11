import { extensionConfig, extensionState } from './extension';

/**
 * Get autocomplete items from user setting
 */
export function updateUserSuggestItems() {
	const tags: Record<string, string> = {};
	const projects: Record<string, string> = {};
	const contexts: Record<string, string> = {};
	for (const item in extensionConfig.suggestItems) {
		const description = extensionConfig.suggestItems[item];
		switch (item[0]) {
			case '#': tags[item.slice(1)] = description; break;
			case '+': projects[item.slice(1)] = description; break;
			case '@': contexts[item.slice(1)] = description; break;
		}
	}
	extensionState.suggestTags = tags;
	extensionState.suggestProjects = projects;
	extensionState.suggestContexts = contexts;
}
