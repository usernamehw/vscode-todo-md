import dayjs from 'dayjs';
import { dateAndDateDiff, dateWithoutTime, dayOfTheWeek, isValidDate } from './time/timeUtils';
import { IsDue } from './types';

export type DueType = 'invalid' | 'normalDate' | 'recurringWithDate' | 'recurringWithoutStartingDate';

/**
 * Should handle most of the due date functions
 */
export class DueDate {
	private static readonly dueWithDateRegexp = /^(\d\d\d\d)-(\d\d)-(\d\d)(\|(e\d+d))?$/;
	private static readonly dueRecurringRegexp = /^(ed|sun|sunday|mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday)$/i;
	/** Unmodified value of due date */
	raw: string;
	/** Due type (normal or recurring, recurring with or without a starting date) */
	type: DueType;
	/** If this due date is recurring or not */
	isRecurring = false;
	/** Due state. Can be: due, notDue, overdue, invalid */
	isDue = IsDue.NotDue;
	/** Closest due date (assigned only when the task is not due today) */
	closestDueDateInTheFuture: string;
	/** Days until this task is due */
	daysUntilDue = 0;
	/** Overdue date when the task was first time missed to complete. */
	overdueStr?: string;
	/** Number of days that task is overdue */
	overdueInDays?: number;

	constructor(dueString: string, options?: { targetDate?: Date; overdueStr?: string }) {
		this.raw = dueString;

		const result = DueDate.parseDue(dueString, options?.targetDate, options?.overdueStr);
		this.isRecurring = result.isRecurring;
		this.isDue = result.isDue;
		this.type = result.dueType;
		this.overdueStr = options?.overdueStr;
		if (result.isDue === IsDue.NotDue) {
			const closest = this.calcClosestDueDateInTheFuture();
			this.closestDueDateInTheFuture = closest.closestString;
			this.daysUntilDue = closest.daysUntil;
		} else if (result.isDue === IsDue.Due || result.isDue === IsDue.Overdue) {
			this.closestDueDateInTheFuture = `${dayOfTheWeek(dayjs())} [today]`;
		} else {
			this.closestDueDateInTheFuture = '';
		}
		if (this.isDue === IsDue.Overdue) {
			this.overdueInDays = this.getOverdueInDays();
		}
	}
	/**
	 * When the next time the task is going to be due.
	 */
	private calcClosestDueDateInTheFuture() {
		if (this.type === 'normalDate') {
			const date = dayjs(this.raw);
			return {
				closestString: dateAndDateDiff(date),
				daysUntil: dayjs(date).diff(dayjs(), 'day') + 1,
			};
		}
		for (let i = 1; i < 100; i++) {
			const date = dayjs().add(i, 'day');
			const { isDue } = DueDate.parseDue(this.raw, date.toDate());
			if (isDue) {
				return {
					closestString: dateAndDateDiff(date),
					daysUntil: i,
				};
			}
		}
		return {
			closestString: 'More than 100 days',
			daysUntil: 100,
		};
	}
	/**
	 * Get diff (in days) between today and overdue date
	 */
	private getOverdueInDays(): number {
		if (this.overdueStr) {
			return dayjs().diff(this.overdueStr, 'day');
		} else {
			const nowWithoutTime = dateWithoutTime(new Date());
			return dayjs(nowWithoutTime).diff(dayjs(this.raw), 'day');
		}
	}
	/**
	 * Parse due date that can be multiple of them delimited by comma
	 */
	static parseDue(due: string, targetDate = new Date(), overdue?: string): DueReturn {
		const dueDates = due.split(',').filter(d => d.length);
		const result = dueDates.map(dueDate => DueDate.parseDueDate(dueDate, targetDate));

		const isRecurring = result.some(r => r.isRecurring);
		const hasInvalid = result.some(r => r.isDue === IsDue.Invalid);
		const hasOverdue = result.some(r => r.isDue === IsDue.Overdue) || overdue;
		const hasDue = result.some(r => r.isDue === IsDue.Due);
		const isDue = hasInvalid ? IsDue.Invalid :
			hasOverdue ? IsDue.Overdue :
				hasDue ? IsDue.Due : IsDue.NotDue;
		const dueType = result[0].dueType;

		return {
			isDue,
			isRecurring,
			dueType,
		};
	}
	/**
	 * Determines what kind of due date it is and returns an object with info.
	 */
	private static parseDueDate(due: string, targetDate: Date): DueReturn {
		if (due === 'today') {
			return {
				isRecurring: false,
				isDue: IsDue.Due,
				dueType: 'recurringWithoutStartingDate',
			};
		}
		let isRecurring = false;
		let isDue = IsDue.NotDue;
		let dueType: DueType;

		const dueWithDateMatch = DueDate.dueWithDateRegexp.exec(due);
		if (dueWithDateMatch) {
			const year = Number(dueWithDateMatch[1]);
			const month = Number(dueWithDateMatch[2]) - 1;
			const date = Number(dueWithDateMatch[3]);
			const dateObject = new Date(year, month, date);
			const dueRecurringPart = dueWithDateMatch[5];

			const isDueDateValid = isValidDate(year, month, date);
			if (!isDueDateValid) {
				return {
					isRecurring: Boolean(dueRecurringPart),
					dueType: 'invalid',
					isDue: IsDue.Invalid,
				};
			}

			if (!dueRecurringPart) {
				isDue = DueDate.isDueExactDate(dateObject, targetDate);
				isRecurring = false;
				dueType = 'normalDate';
			} else {
				isDue = DueDate.isDueWithDate(dueRecurringPart, dateObject, targetDate);
				isRecurring = true;
				dueType = 'recurringWithDate';
			}
		} else {
			// Due date without starting date
			if (DueDate.dueRecurringRegexp.test(due)) {
				isDue = DueDate.isDueToday(due, targetDate);
				isRecurring = true;
				dueType = 'recurringWithoutStartingDate';
			} else {
				isDue = IsDue.Invalid;
				dueType = 'invalid';
			}
		}
		return {
			isDue,
			isRecurring,
			dueType,
		};
	}
	/**
	 * Parse a simple date `2020-02-15`
	 */
	private static isDueExactDate(date: Date, targetDate: Date): IsDue {
		if (dayjs(targetDate).isBefore(date)) {
			return IsDue.NotDue;
		}
		const diffInDays = dayjs(date).diff(dayjs(targetDate), 'day');
		return diffInDays === 0 ? IsDue.Due : IsDue.Overdue;
	}
	// private static isDueBetween(d1: string, d2: string): DueReturn {
	// 	const now = dayjs();
	// 	const date1 = dayjs(d1);
	// 	const date2 = dayjs(d2);
	// 	let isDue;
	// 	if (date1.isBefore(now, 'day') && date2.isBefore(now, 'day')) {
	// 		isDue = IsDue.overdue;
	// 	} else {
	// 		isDue = dayjs().isBetween(d1, dayjs(d2), 'day', '[]') ? IsDue.due : IsDue.notDue;
	// 	}
	// 	return {
	// 		isRecurring: false,
	// 		isDue,
	// 	};
	// }
	/**
	 * Parse constant due date
	 */
	private static isDueToday(dueString: string, targetDate: Date): IsDue {
		const value = dueString.toLowerCase();
		if (value === 'ed') {
			return IsDue.Due;
		}

		switch (targetDate.getDay()) {
			case 0: {
				if (value === 'sun' || value === 'sunday') {
					return IsDue.Due;
				}
				break;
			}
			case 1: {
				if (value === 'mon' || value === 'monday') {
					return IsDue.Due;
				}
				break;
			}
			case 2: {
				if (value === 'tue' || value === 'tuesday') {
					return IsDue.Due;
				}
				break;
			}
			case 3: {
				if (value === 'wed' || value === 'wednesday') {
					return IsDue.Due;
				}
				break;
			}
			case 4: {
				if (value === 'thu' || value === 'thursday') {
					return IsDue.Due;
				}
				break;
			}
			case 5: {
				if (value === 'fri' || value === 'friday') {
					return IsDue.Due;
				}
				break;
			}
			case 6: {
				if (value === 'sat' || value === 'saturday') {
					return IsDue.Due;
				}
				break;
			}
		}
		return IsDue.NotDue;
	}
	/**
	 * Parse recurring due date with starting date `due:2019-06-19|e2d`
	 */
	private static isDueWithDate(dueString: string, dueDateStart: Date | number | undefined, targetDate = new Date()): IsDue {
		if (dueDateStart === undefined) {
			throw new Error('dueDate was specified, but dueDateStart is missing');
		}
		const match = /e(\d+)(d)/.exec(dueString);
		if (match) {
			const interval = match[1] ? +match[1] : 1;
			const unit = match[2];
			if (unit === 'd') {
				const diffInDays = dayjs(dateWithoutTime(targetDate)).diff(dueDateStart, 'day');
				if (diffInDays % interval === 0) {
					return IsDue.Due;
				}
			}
		}

		return IsDue.NotDue;
	}
}

interface DueReturn {
	isRecurring: boolean;
	isDue: IsDue;
	dueType: DueType;
	// isRange: boolean;
}
