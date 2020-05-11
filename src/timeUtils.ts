import dayjs, { Dayjs } from 'dayjs';

import { DueState } from './types';
import { config } from './extension';

export const ONE_MINUTE_IN_MS = 60000;
export const ONE_HOUR_IN_MS = 3600000;
export const ONE_DAY_IN_MS = 86400000;
export const ONE_WEEK_IN_MS = 604800000;

export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:mm:ss';
export const DATE_TIME_FORMAT = `${DATE_FORMAT}T${TIME_FORMAT}`;

/**
 * Get date or datetime ISO 8601
 * Example: `2020-04-21` or `2020-04-30T09:11:17`
 * Uses local time
 */
export function getDateInISOFormat(date: Date | Dayjs = new Date(), includeTime = false): string {
	const format = includeTime ? DATE_TIME_FORMAT : DATE_FORMAT;
	return dayjs(date).format(format);
}

export function calcDiffInDays(d1: number | Date, d2: number | Date): number {
	return Math.trunc((+d2 - +d1) / ONE_DAY_IN_MS);
}
export function calcDiffInDays2(d1: number | Date, d2: number | Date): number {
	return (+d2 - +d1) / ONE_DAY_IN_MS;
}

/**
 * Remove time from date and return new Date object
 */
export function shortenToDate(date: string | number | Date): Date {
	return new Date(new Date(date).setHours(0, 0, 0, 0));
}

interface DueReturn {
	isRecurring: boolean;
	isRange: boolean;
	isDue: DueState;
}
const dueWithDateRegexp = /(\d\d\d\d)-(\d\d)-(\d\d)(-(\w+))?/;
const everyNDayRegexp = /e(\d+)d/;

export function parseDue(due: string): DueReturn[] {
	const dueDates = due.split(',').filter(d => d.length);
	return dueDates.map(dueDate => parseDueDate(dueDate));
}

function parseDueDate(due: string): DueReturn {
	if (due === 'today') {
		return {
			isRecurring: false,
			isRange: false,
			isDue: DueState.due,
		};
	}
	const tryAsRange = due.split('..');
	if (tryAsRange.length > 1) {
		return isDueBetween(tryAsRange[0], tryAsRange[1]);
	}
	let isRecurring = false;
	let isDue = DueState.notDue;
	const match = dueWithDateRegexp.exec(due);
	if (match) {
		const year = Number(match[1]);
		const month = Number(match[2]) - 1;
		const date = Number(match[3]);
		const dateObject = new Date(year, month, date);
		const dueAlgorithm = match[5];
		if (!dueAlgorithm) {
			isDue = isDueExactDate(dateObject);
			isRecurring = false;
		} else {
			isRecurring = true;
			const everyNDay = everyNDayRegexp.exec(dueAlgorithm);
			if (everyNDay) {
				const interval = +everyNDay[1];
				isDue = isDueWithDate(dueAlgorithm, new Date(year, month, date));
			}
		}
	} else {
		// Due date without starting date
		isRecurring = true;
		isDue = isDueToday(due);
	}
	return {
		isDue,
		isRecurring,
		isRange: false,
	};
}

function isDueExactDate(date: Date): DueState {
	const now = new Date();
	if (now.getTime() < date.getTime()) {
		return DueState.notDue;
	}
	const diffInDays = calcDiffInDays(shortenToDate(now), shortenToDate(date));
	if (diffInDays === 0) {
		return DueState.due;
	} else {
		return DueState.overdue;
	}
}

function isDueBetween(d1: string, d2: string): DueReturn {
	const now = dayjs();
	const date1 = dayjs(d1);
	const date2 = dayjs(d2);
	let isDue;
	if (date1.isBefore(now, 'day') && date2.isBefore(now, 'day')) {
		isDue = DueState.overdue;
	} else {
		isDue = dayjs().isBetween(d1, dayjs(d2), 'day', '[]') ? DueState.due : DueState.notDue;
	}
	return {
		isRecurring: false,
		isRange: true,
		isDue,
	};
}

function isDueToday(due: string): DueState {
	if (due === 'ed') {
		return DueState.due;
	}

	const day = new Date().getDay();
	if (due === 'Sun' && day === 0) {
		return DueState.due;
	} else if (due === 'Mon' && day === 1) {
		return DueState.due;
	} else if (due === 'Tue' && day === 2) {
		return DueState.due;
	} else if (due === 'Wed' && day === 3) {
		return DueState.due;
	} else if (due === 'Thu' && day === 4) {
		return DueState.due;
	} else if (due === 'Fri' && day === 5) {
		return DueState.due;
	} else if (due === 'Sat' && day === 6) {
		return DueState.due;
	}
	return DueState.notDue;
}

export function isDueWithDate(dueDate: string, dueDateStart: number | Date | undefined, date: number | Date = new Date()): DueState {
	const targetTimestamp: number = +date;
	if (dueDateStart === undefined) {
		throw new Error('dueDate was specified, but dueDateStart is missing');
	}
	const match = /(?!every|each|e)\s?(\d+)?\s?(d|days?)/.exec(dueDate);
	if (match) {
		const interval = match[1] ? +match[1] : 1;
		const unit = match[2];
		if (/^(d|days?)$/.test(unit)) {
			const diffInDays = calcDiffInDays(shortenToDate(dueDateStart), shortenToDate(targetTimestamp));

			if (diffInDays % interval === 0) return DueState.due;
		} else if (/^(m|months?)$/.test(unit)) {
		}
	}

	return DueState.notDue;
}
