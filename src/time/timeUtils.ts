import dayjs, { Dayjs } from 'dayjs';

export const ONE_MINUTE_IN_MS = 60000;
export const ONE_HOUR_IN_MS = 3600000;
export const ONE_DAY_IN_MS = 86400000;
export const ONE_WEEK_IN_MS = 604800000;

export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:mm:ss';
export const DATE_TIME_FORMAT = `${DATE_FORMAT}T${TIME_FORMAT}`;

export const dayOfTheWeekRegexp = /^(sun|sunday|mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday)$/i;

/**
 * Get date or datetime ISO 8601
 * Example: `2020-04-21` or `2020-04-30T09:11:17`
 * Uses local time
 */
export function getDateInISOFormat(date: Date | Dayjs = new Date(), includeTime = false): string {
	const format = includeTime ? DATE_TIME_FORMAT : DATE_FORMAT;
	return dayjs(date).format(format);
}

export function dayOfWeekToIndexOfWeek(dayOfWeek: string): number {
	if (/^(sun|sunday)$/i.test(dayOfWeek)) {
		return 0;
	} else if (/^(mon|monday)$/i.test(dayOfWeek)) {
		return 1;
	} else if (/^(tue|tuesday)$/i.test(dayOfWeek)) {
		return 2;
	} else if (/^(wed|wednesday)$/i.test(dayOfWeek)) {
		return 3;
	} else if (/^(thu|thursday)$/i.test(dayOfWeek)) {
		return 4;
	} else if (/^(fri|friday)$/i.test(dayOfWeek)) {
		return 5;
	} else if (/^(sat|saturday)$/i.test(dayOfWeek)) {
		return 6;
	}
	throw Error('Unknown day of the week.');
}
/**
 * Short day of the week `Mon` - `Sun`
 */
export function dayOfTheWeek(date: dayjs.Dayjs): string {
	return date.format('ddd');
}
/**
 * Human readable date diff? `in 2 days`
 */
export function dateDiff(date: dayjs.Dayjs): string {
	return dayjs().to(date);
}
