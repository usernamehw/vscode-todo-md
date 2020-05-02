import { config } from './extension';

/**
 * Get date or datetime ISO 8601
 * Example: `2020-04-21` or `2020-04-30T09:11:17`
 */
export function getDateInISOFormat(date: Date, includeTime = false): string {
	if (config.useLocalDateTime) {
		date = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
	}
	return date.toISOString().slice(0, includeTime ? 19 : 10);
}
