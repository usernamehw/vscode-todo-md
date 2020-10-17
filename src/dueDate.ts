import dayjs from 'dayjs';
import { DATE_FORMAT } from './timeUtils';
import { DueState } from './types';

export class DueDate {
	private static readonly dueWithDateRegexp = /^(\d\d\d\d)-(\d\d)-(\d\d)(\|(e\d+d))?$/;
	private static readonly dueRecurringRegexp = /^ed|sun|sunday|mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday$/i;
	/** Unmodified value of due date */
	raw: string;
	isRecurring = false;
	isDue = DueState.notDue;
	closestDueDateInTheFuture: string | undefined;

	constructor(dueString: string, options?: { targetDate?: Date; overdue?: string }) {
		this.raw = dueString;

		const result = DueDate.parseDue(dueString, options?.targetDate, options?.overdue);
		this.isRecurring = result.isRecurring;
		this.isDue = result.isDue;
		if (result.isDue === DueState.notDue) {
			this.closestDueDateInTheFuture = this.calcClosestDueDateInTheFuture();
		}
	}

	calcClosestDueDateInTheFuture() {
		for (let i = 1; i < 100; i++) {
			const date = dayjs().add(i, 'day');
			const { isDue } = DueDate.parseDue(this.raw, date.toDate());
			if (isDue) {
				return `${date.format('ddd')} [${dayjs().to(date)}]`;
			}
		}
		return 'More than 100 days';
	}
	static parseDue(due: string, targetDate = new Date(), overdue?: string): DueReturn {
		const dueDates = due.split(',').filter(d => d.length);
		const result = dueDates.map(dueDate => DueDate.parseDueDate(dueDate, targetDate));

		const isRecurring = result.some(r => r.isRecurring);
		const hasInvalid = result.some(r => r.isDue === DueState.invalid);
		const hasOverdue = result.some(r => r.isDue === DueState.overdue) || overdue;
		const hasDue = result.some(r => r.isDue === DueState.due);
		const isDue = hasInvalid ? DueState.invalid :
			hasOverdue ? DueState.overdue :
				hasDue ? DueState.due : DueState.notDue;

		return {
			isDue,
			isRecurring,
		};
	}
	private static parseDueDate(due: string, targetDate: Date): DueReturn {
		if (due === 'today') {
			return {
				isRecurring: false,
				isDue: DueState.due,
			};
		}
		const tryAsRange = due.split('..');
		if (tryAsRange.length > 1) {
			return DueDate.isDueBetween(tryAsRange[0], tryAsRange[1]);
		}
		let isRecurring = false;
		let isDue = DueState.notDue;
		const dueWithDateMatch = DueDate.dueWithDateRegexp.exec(due);
		if (dueWithDateMatch) {
			const year = Number(dueWithDateMatch[1]);
			const month = Number(dueWithDateMatch[2]) - 1;
			const date = Number(dueWithDateMatch[3]);
			const dateObject = new Date(year, month, date);
			const dueRecurringPart = dueWithDateMatch[5];

			if (!dueRecurringPart) {
				isDue = DueDate.isDueExactDate(dateObject, targetDate);
				isRecurring = false;
			} else {
				isRecurring = true;
				isDue = DueDate.isDueWithDate(dueRecurringPart, dateObject, targetDate);
			}
		} else {
			// Due date without starting date
			if (DueDate.dueRecurringRegexp.test(due)) {
				isRecurring = true;
				isDue = DueDate.isDueToday(due, targetDate);
			} else {
				isDue = DueState.invalid;
			}
		}
		return {
			isDue,
			isRecurring,
		};
	}
	private static isDueExactDate(date: Date, targetDate: Date): DueState {
		if (dayjs(targetDate).isBefore(date)) {
			return DueState.notDue;
		}
		const diffInDays = dayjs(date).diff(dayjs(targetDate), 'day');
		return diffInDays === 0 ? DueState.due : DueState.overdue;
	}
	private static isDueBetween(d1: string, d2: string): DueReturn {
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

	private static isDueToday(dueString: string, targetDate: Date): DueState {
		const value = dueString.toLowerCase();
		if (value === 'ed') {
			return DueState.due;
		}

		switch (targetDate.getDay()) {
			case 0: {
				if (value === 'sun' || value === 'sunday') {
					return DueState.due;
				}
				break;
			}
			case 1: {
				if (value === 'mon' || value === 'monday') {
					return DueState.due;
				}
				break;
			}
			case 2: {
				if (value === 'tue' || value === 'tuesday') {
					return DueState.due;
				}
				break;
			}
			case 3: {
				if (value === 'wed' || value === 'wednesday') {
					return DueState.due;
				}
				break;
			}
			case 4: {
				if (value === 'thu' || value === 'thursday') {
					return DueState.due;
				}
				break;
			}
			case 5: {
				if (value === 'fri' || value === 'friday') {
					return DueState.due;
				}
				break;
			}
			case 6: {
				if (value === 'sat' || value === 'saturday') {
					return DueState.due;
				}
				break;
			}
		}
		return DueState.notDue;
	}
	private static isDueWithDate(dueString: string, dueDateStart: number | Date | undefined, targetDate = new Date()): DueState {
		if (dueDateStart === undefined) {
			throw new Error('dueDate was specified, but dueDateStart is missing');
		}
		const match = /e(\d+)(d)/.exec(dueString);
		if (match) {
			const interval = match[1] ? +match[1] : 1;
			const unit = match[2];
			if (unit === 'd') {
				const diffInDays = dayjs(targetDate).diff(dueDateStart, 'day');
				if (diffInDays % interval === 0) {
					return DueState.due;
				}
			}
		}

		return DueState.notDue;
	}
	/**
	 * - Returns undefined for invalid input
	 * - Returns string value of due date for valid input
	 */
	static helpCreateDueDate(str: string): string | undefined {
		if (str === '+') {
			str = '+1';// alias for tomorrow
		}
		const dayShiftMatch = /(\+|-)(\d+)(d|w)?$/.exec(str);
		if (dayShiftMatch) {
			const sign = dayShiftMatch[1];
			const number = Number(dayShiftMatch[2]);
			const unit = dayShiftMatch[3] ?? 'd';
			let date: dayjs.Dayjs;
			if (sign === '+') {
				if (unit === 'd') {
					date = dayjs().add(number, 'day');
				} else if (unit === 'w') {
					date = dayjs().add(number, 'week');
				} else {
					throw Error('Should never happen');
				}
			} else {
				if (unit === 'd') {
					date = dayjs().subtract(number, 'day');
				} else if (unit === 'w') {
					date = dayjs().subtract(number, 'week');
				} else {
					throw Error('Should never happen');
				}
			}
			return date.format(DATE_FORMAT);
		} else {
			return undefined;
		}
	}
}

interface DueReturn {
	isRecurring: boolean;
	isDue: DueState;
	// isRange: boolean;
}
