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

interface DueReturn {
	isRecurring: boolean;
	isDue: DueState;
}
const dueWithDateRegexp = /^(\d\d\d\d)-(\d\d)-(\d\d)(\|(\w+))?$/;

export function parseDue(due: string, targetDate = new Date()): DueReturn {
	const dueDates = due.split(',').filter(d => d.length);
	const result = dueDates.map(dueDate => parseDueDate(dueDate, targetDate));

	const isRecurring = result.some(r => r.isRecurring);
	const hasOverdue = result.some(r => r.isDue === DueState.overdue);
	const hasDue = result.some(r => r.isDue === DueState.due);
	const isDue = hasOverdue ? DueState.overdue : hasDue ? DueState.due : DueState.notDue;
	return {
		isDue,
		isRecurring,
	};
}

function parseDueDate(due: string, targetDate: Date): DueReturn {
	if (due === 'today') {
		return {
			isRecurring: false,
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
		const dueRecurringPart = match[5];

		if (!dueRecurringPart) {
			isDue = isDueExactDate(dateObject, targetDate);
			isRecurring = false;
		} else {
			isRecurring = true;
			isDue = isDueWithDate(dueRecurringPart, dateObject, targetDate);
		}
	} else {
		// Due date without starting date
		isRecurring = true;
		isDue = isDueToday(due, targetDate);
	}
	return {
		isDue,
		isRecurring,
	};
}
function isDueExactDate(date: Date, targetDate: Date): DueState {
	if (dayjs(targetDate).isBefore(date)) {
		return DueState.notDue;
	}
	const diffInDays = dayjs(date).diff(dayjs(targetDate), 'day');
	return diffInDays === 0 ? DueState.due : DueState.overdue;
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
		isDue,
	};
}

function isDueToday(dueString: string, targetDate: Date): DueState {
	if (dueString === 'ed') {
		return DueState.due;
	}

	const day = targetDate.getDay();
	if (dueString === 'Sun' && day === 0) {
		return DueState.due;
	} else if (dueString === 'Mon' && day === 1) {
		return DueState.due;
	} else if (dueString === 'Tue' && day === 2) {
		return DueState.due;
	} else if (dueString === 'Wed' && day === 3) {
		return DueState.due;
	} else if (dueString === 'Thu' && day === 4) {
		return DueState.due;
	} else if (dueString === 'Fri' && day === 5) {
		return DueState.due;
	} else if (dueString === 'Sat' && day === 6) {
		return DueState.due;
	}
	return DueState.notDue;
}

export function isDueWithDate(dueString: string, dueDateStart: number | Date | undefined, targetDate = new Date()): DueState {
	if (dueDateStart === undefined) {
		throw new Error('dueDate was specified, but dueDateStart is missing');
	}
	const match = /(?!every|e)\s?(\d+)?\s?(d|days?)/.exec(dueString);
	if (match) {
		const interval = match[1] ? +match[1] : 1;
		const unit = match[2];
		if (/^(d|days?)$/.test(unit)) {
			const diffInDays = dayjs(targetDate).diff(dueDateStart, 'day');

			if (diffInDays % interval === 0) return DueState.due;
		}
	}

	return DueState.notDue;
}
