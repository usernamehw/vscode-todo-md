import dayjs from 'dayjs';
import { dateAndDateDiff, dateWithoutTime, isValidDate } from './time/timeUtils';
import { IsDue } from './types';

export type DueType = 'invalid' | 'normalDate' | 'recurringWithDate' | 'recurringWithoutStartingDate';
// type RecurringIntervalUnit = 'd' | 'm' | 'y';

/**
 * Should handle most of the due date functions
 */
export class DueDate {
	private static readonly dueWithDateRegexp = /^(\d\d\d\d)-(\d\d)-(\d\d)(\|(e\d+(d|m|y)))?$/i;
	private static readonly dueRecurringRegexp = /^(today|ed|sun|sunday|mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday)$/i;
	public static readonly futureFarAwayDueDateMessage = 'More than 100 days.';

	/** Unmodified value of due date */
	public readonly raw: string;
	/** Due type (normal or recurring, recurring with or without a starting date) */
	public readonly type: DueType;
	/** If this due date is recurring or not */
	public isRecurring = false;
	/** Due state. Can be: due, notDue, overdue, invalid */
	public isDue = IsDue.NotDue;
	/** Closest due date (assigned only when the task is not due today) */
	public closestDueDateInTheFuture = '';
	/** Days until this task is due */
	public daysUntilDue = 0;
	/** Overdue date when the task was first time missed to complete. */
	public readonly overdueStr?: string;
	/** Number of days that task is overdue */
	public readonly overdueInDays?: number;

	constructor(dueString: string, options?: { targetDate?: Date; overdueStr?: string }) {
		this.raw = dueString;

		const result = DueDate.parseDue(dueString, options?.targetDate, options?.overdueStr);
		this.isRecurring = result.isRecurring;
		this.isDue = result.isDue;
		this.type = result.dueType;
		this.overdueStr = options?.overdueStr;
		this.calcClosestDueDateInTheFuture();
		if (this.isDue === IsDue.Overdue) {
			this.overdueInDays = this.getOverdueInDays();
		}
	}
	/**
	 * When the next time the task is going to be due.
	 */
	private calcClosestDueDateInTheFuture(): void {
		if (this.type === 'invalid' || this.isDue === IsDue.Overdue || this.isDue === IsDue.Due) {
			return;
		}
		if (this.type === 'normalDate') {
			const date = dayjs(this.raw);
			this.closestDueDateInTheFuture = dateAndDateDiff(date);
			this.daysUntilDue = dayjs(date).diff(dayjs(), 'day') + 1;
			return;
		}

		for (let i = 1; i <= 100; i++) {
			const date = dayjs().add(i, 'day');
			const { isDue } = DueDate.parseDue(this.raw, date.toDate());
			if (isDue === IsDue.Due) {
				this.closestDueDateInTheFuture = dateAndDateDiff(date);
				this.daysUntilDue = i;
				return;
			}
		}

		this.closestDueDateInTheFuture = DueDate.futureFarAwayDueDateMessage;
		this.daysUntilDue = 100;
	}
	/**
	 * Get diff (in days) between today and overdue date
	 */
	private getOverdueInDays(): number {
		if (this.overdueStr) {
			return dayjs().diff(this.overdueStr, 'day');
		} else {
			return dayjs(dateWithoutTime(new Date())).diff(dayjs(this.raw), 'day');
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
		const dueType: DueType = hasInvalid ? 'invalid' : result[0].dueType;

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
		let isRecurring = false;
		let isDue = IsDue.NotDue;
		let dueType: DueType;

		const dueWithDateMatch = DueDate.dueWithDateRegexp.exec(due);
		if (dueWithDateMatch) {
			const year = Number(dueWithDateMatch[1]);
			const month = Number(dueWithDateMatch[2]) - 1;
			const date = Number(dueWithDateMatch[3]);
			const rawStartingDate = datePartsToRawFormattedDate(year, month, date);
			const startingDate = new Date(year, month, date);
			const dueRecurringPart = dueWithDateMatch[5];

			if (!dueRecurringPart) {
				const isDueDateValid = isValidDate(year, month, date);
				if (!isDueDateValid) {
					return {
						isRecurring: false,
						dueType: 'invalid',
						isDue: IsDue.Invalid,
					};
				}
				isDue = DueDate.isDueExactDate(startingDate, targetDate);
				isRecurring = false;
				dueType = 'normalDate';
			} else {
				isDue = DueDate.isDueRecurringWithDate(dueRecurringPart, startingDate, rawStartingDate, targetDate);
				isRecurring = true;
				dueType = 'recurringWithDate';
			}
		} else {
			// Due date without starting date
			if (DueDate.dueRecurringRegexp.test(due)) {
				isDue = DueDate.isDueWeekday(due, targetDate);
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
	/**
	 * Parse constant due date like `monday`.
	 */
	private static isDueWeekday(dueString: string, targetDate: Date): IsDue {
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
	 * Parse recurring due date with starting date `due:2019-06-19|e2d` or
	 * `due:2019-06-19|e2m`.
	 *
	 */
	private static isDueRecurringWithDate(dueString: string, startingDate: Date | undefined, rawStartingDate: string, targetDate: Date): IsDue {
		if (startingDate === undefined) {
			throw new Error('Starting date is missing.');
		}

		const match = /e(\d+)(d|m|y)/i.exec(dueString);
		if (!match) {
			throw new Error('Recurring due date format is wrong.');
		}

		const interval = match[1] ? Number(match[1]) : 1;
		const unit = match[2].toLowerCase() as 'd' | 'm' | 'y';
		if (unit === 'd') {
			if (dayjs(targetDate).isBefore(dayjs(startingDate))) {
				return IsDue.NotDue;
			}
			const diffInDays = dayjs(dateWithoutTime(targetDate)).diff(startingDate, 'day');
			if (diffInDays % interval === 0) {
				return IsDue.Due;
			}
		} else if (unit === 'm') {
			const isLastStartingDate = isLastOrNonExistingDateInMonth(rawStartingDate);
			if (isLastStartingDate === undefined) {
				return IsDue.Invalid;
			}
			const isLastTargetDate = isLastOrNonExistingDateInMonth(datePartsToRawFormattedDate(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
			const startingDateParts = rawFormattedDateToDateParts(rawStartingDate);
			const startingDateLastDayOfMonth = dayjs(new Date(startingDateParts.year, startingDateParts.month, 1)).daysInMonth();
			if (isLastStartingDate) {
				startingDate = new Date(startingDateParts.year, startingDateParts.month, startingDateLastDayOfMonth);
			}

			if (dayjs(targetDate).isBefore(dayjs(startingDate), 'month')) {
				return IsDue.NotDue;
			}

			const diffInMonths = dayjs(targetDate).diff(startingDate, 'month');

			if (!(diffInMonths % interval === 0)) {
				return IsDue.NotDue;
			}

			if (isLastStartingDate) {
				// last day of month, handle as special case - 31 of Feb will match 28/29 (last of Feb) and other months too
				if (isLastTargetDate) {
					return IsDue.Due;
				}
			} else {
				// not last day of the month, precise date of month match
				if (dayjs(dateWithoutTime(targetDate)).date() === startingDate.getDate()) {
					return IsDue.Due;
				}
			}
		} else if (unit === 'y') {
			// similar to month's logic but not the same
			const isLastStartingDate = isLastOrNonExistingDateInMonth(rawStartingDate);
			if (isLastStartingDate === undefined) {
				return IsDue.Invalid;
			}
			const isLastTargetDate = isLastOrNonExistingDateInMonth(datePartsToRawFormattedDate(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
			const startingDateParts = rawFormattedDateToDateParts(rawStartingDate);
			const startingDateLastDayOfMonth = dayjs(new Date(startingDateParts.year, startingDateParts.month, 1)).daysInMonth();
			if (isLastStartingDate) {
				startingDate = new Date(startingDateParts.year, startingDateParts.month, startingDateLastDayOfMonth);
			}

			const diffInYears = dayjs(targetDate).diff(startingDate, 'year');

			if (!(diffInYears % interval === 0)) {
				return IsDue.NotDue;
			}

			if (dayjs(targetDate).isBefore(dayjs(startingDate), 'year')) {
				return IsDue.NotDue;
			}

			if (targetDate.getMonth() !== startingDate.getMonth()) {
				return IsDue.NotDue;
			}

			if (isLastStartingDate) {
				// last day of month, handle as special case - 31 of Feb will match 28/29 (last of Feb) and other months too
				if (isLastTargetDate) {
					return IsDue.Due;
				}
			} else {
				// not last day of the month, precise date of month match
				if (dayjs(dateWithoutTime(targetDate)).date() === startingDate.getDate()) {
					return IsDue.Due;
				}
			}
		}

		return IsDue.NotDue;
	}
}


/**
 * TODO: memoize?
 */
function isLastOrNonExistingDateInMonth(dateString: string): boolean | undefined {
	const parts = dateString.split('-');
	const year = Number(parts[0]);
	const month = Number(parts[1]) - 1;
	const date = Number(parts[2]);

	if (date >= 32) {
		return undefined;
	}
	if (month >= 12) {
		return undefined;
	}

	const firstDayOfTargetMonth = new Date(year, month, 1);
	const daysInTargetMonth = dayjs(firstDayOfTargetMonth).daysInMonth();
	if (date >= daysInTargetMonth) {
		return true;
	}
	return false;
}

/**
 * Transform raw date (not autocorrected by js: `2022-10-40`) into `{year:2022, month:9, date:40}`
 */
function rawFormattedDateToDateParts(rawFormattedString: string) {
	const parts = rawFormattedString.split('-');
	return {
		year: Number(parts[0]),
		month: Number(parts[1]) - 1,
		date: Number(parts[2]),
	};
}

function datePartsToRawFormattedDate(year: number, month: number, date: number) {
	return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
}


interface DueReturn {
	isRecurring: boolean;
	isDue: IsDue;
	dueType: DueType;
	// isRange: boolean;
}

/**
 * - 0  January - 31 days
 * - 1  February - 28 days in a common year and 29 days in leap years
 * - 2  March - 31 days
 * - 3  April - 30 days
 * - 4  May - 31 days
 * - 5  June - 30 days
 * - 6  July - 31 days
 * - 7  August - 31 days
 * - 8  September - 30 days
 * - 9  October - 31 days
 * - 10 November - 30 days
 * - 11 December - 31 days
 */
