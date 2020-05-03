import { config } from './extension';

export const ONE_MINUTE_IN_MS = 60000;
export const ONE_HOUR_IN_MS = 3600000;
export const ONE_DAY_IN_MS = 86400000;
export const ONE_WEEK_IN_MS = 604800000;

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

export function calcDiffInDays(d1: number | Date, d2: number | Date): number {
	return Math.trunc((+d2 - +d1) / ONE_DAY_IN_MS);
}
export function calcDiffInDays2(d1: number | Date, d2: number | Date): number {
	return (+d2 - +d1) / ONE_DAY_IN_MS;
}

/**
 * Shift date by the amount of days (positive or negative)
 * ```
 * shiftDays(new Date(), -4)// 4 days ago
 * shiftDays(new Date(), 10)// 10 days in the future
 * ```
 */
export function shiftDays(date: Date | number, numberOfDays: number): Date {
	return new Date(+date + ONE_DAY_IN_MS * numberOfDays);
}
/**
 * Check if the date **year/month/day** is the same (ignoring time)
 */
export function isTheSameDay(d1: number | Date, d2: number | Date): boolean {
	return new Date(d1).toDateString() === new Date(d2).toDateString();
}
/**
 * Remove time from date and return new Date object
 */
export function shortenToDate(date: string | number | Date): Date {
	return new Date(new Date(date).setHours(0, 0, 0, 0));
}
