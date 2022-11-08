import { assert } from 'chai';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import relativeTime from 'dayjs/plugin/relativeTime';
import _ from 'lodash';
import { describe, it } from 'mocha';
import { DueDate } from '../../dueDate';
import { IsDue } from '../../types';
import { headerDelimiter } from './testUtils';

dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(isoWeek);
dayjs.extend(duration);
dayjs.Ls.en.weekStart = 1;

function addDays(date: Date, n: number) {
	return dayjs(date).add(n, 'day').toDate();
}

/**
 * Just an ok date, first day of the year, month, week
 */
const $1jan2018monday = new Date(2018, 0, 1);
const $2jan2018tuesday = new Date(2018, 0, 2);
const $3jan2018wednesday = new Date(2018, 0, 3);
const $4jan2018thursday = new Date(2018, 0, 4);
const $5jan2018friday = new Date(2018, 0, 5);
const $6jan2018saturday = new Date(2018, 0, 6);
const $7jan2018sunday = new Date(2018, 0, 7);

const $1jan2018mondayDueDate = new DueDate('2018-01-01', {
	targetDate: $1jan2018monday,
});

describe(`${headerDelimiter('due date')}Not recurring`, () => {
	it('Simple date format `2018-01-01` is due at that date.', () => {
		assert.equal($1jan2018mondayDueDate.isDue, IsDue.Due);
	});
	it('`2018-01-01` is not recurring', () => {
		assert.isFalse($1jan2018mondayDueDate.isRecurring);
	});
});

describe('♻ Recurring', () => {
	it('`ed` (every day alias). Is due on any day', () => {
		const ed = new DueDate('ed', {
			targetDate: addDays($1jan2018monday, _.random(-100, 100)),
		});
		assert.equal(ed.isDue, IsDue.Due);
	});
	it('`monday` is recurring', () => {
		assert.isTrue(new DueDate('monday').isRecurring);
	});
	it('Week days like `Monday` are case insensitive', () => {
		const mondayDueDate = new DueDate('Monday');
		assert.notEqual(mondayDueDate.isDue, IsDue.Invalid);
		assert.isTrue(mondayDueDate.isRecurring);
	});
	it('monday', () => {
		assert.equal(new DueDate('monday', { targetDate: $1jan2018monday }).isDue, IsDue.Due, 'monday');
		assert.equal(new DueDate('mon', { targetDate: $1jan2018monday }).isDue, IsDue.Due, 'mon');
	});
	it('monday is not due on any other day', () => {
		assert.equal(new DueDate('monday', { targetDate: $2jan2018tuesday }).isDue, IsDue.NotDue, 'tuesday');
		assert.equal(new DueDate('monday', { targetDate: $3jan2018wednesday }).isDue, IsDue.NotDue, 'wednesday');
		assert.equal(new DueDate('monday', { targetDate: $4jan2018thursday }).isDue, IsDue.NotDue, 'thursday');
		assert.equal(new DueDate('monday', { targetDate: $5jan2018friday }).isDue, IsDue.NotDue, 'friday');
		assert.equal(new DueDate('monday', { targetDate: $6jan2018saturday }).isDue, IsDue.NotDue, 'saturday');
		assert.equal(new DueDate('monday', { targetDate: $7jan2018sunday }).isDue, IsDue.NotDue, 'sunday');
	});
	it('tuesday', () => {
		assert.equal(new DueDate('tuesday', { targetDate: $2jan2018tuesday }).isDue, IsDue.Due, 'tuesday');
		assert.equal(new DueDate('tue', { targetDate: $2jan2018tuesday }).isDue, IsDue.Due, 'tue');
	});
	it('wednesday', () => {
		assert.equal(new DueDate('wednesday', { targetDate: $3jan2018wednesday }).isDue, IsDue.Due, 'wednesday');
		assert.equal(new DueDate('wed', { targetDate: $3jan2018wednesday }).isDue, IsDue.Due, 'wed');
	});
	it('thursday', () => {
		assert.equal(new DueDate('thursday', { targetDate: $4jan2018thursday }).isDue, IsDue.Due, 'thursday');
		assert.equal(new DueDate('thu', { targetDate: $4jan2018thursday }).isDue, IsDue.Due, 'thu');
	});
	it('friday', () => {
		assert.equal(new DueDate('friday', { targetDate: $5jan2018friday }).isDue, IsDue.Due, 'friday');
		assert.equal(new DueDate('fri', { targetDate: $5jan2018friday }).isDue, IsDue.Due, 'fri');
	});
	it('saturday', () => {
		assert.equal(new DueDate('saturday', { targetDate: $6jan2018saturday }).isDue, IsDue.Due, 'saturday');
		assert.equal(new DueDate('sat', { targetDate: $6jan2018saturday }).isDue, IsDue.Due, 'sat');
	});
	it('sunday', () => {
		assert.equal(new DueDate('sunday', { targetDate: $7jan2018sunday }).isDue, IsDue.Due, 'sunday');
		assert.equal(new DueDate('sun', { targetDate: $7jan2018sunday }).isDue, IsDue.Due, 'sun');
	});
});

describe('♻ Recurring with starting date (days)', () => {
	const dueString = '2018-01-01|e2d';

	it(`${dueString} is not due before the starting date`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2017, 11, 31) }).isDue, IsDue.NotDue);
		assert.equal(new DueDate(dueString, { targetDate: new Date(2017, 11, 30) }).isDue, IsDue.NotDue);
		assert.equal(new DueDate(dueString, { targetDate: new Date(2017, 11, 29) }).isDue, IsDue.NotDue);
	});
	it(`${dueString} is due on the same day`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2018, 0, 1) }).isDue, IsDue.Due);
	});
	it(`${dueString} is not due on the next day`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2018, 0, 2) }).isDue, IsDue.NotDue);
	});
	it(`${dueString} is due in 2 days`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2018, 0, 3) }).isDue, IsDue.Due);
	});
});
// ────────────────────────────────────────────────────────────
describe('♻ Recurring with starting date (months) e1m', () => {
	const dueString = '2018-01-01|e1m';

	it(`${dueString} is not due before the starting date`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2017, 11, 1) }).isDue, IsDue.NotDue, new Date(2017, 11, 1).toString());
	});
	it(`${dueString} is due on the same day`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2018, 0, 1) }).isDue, IsDue.Due, new Date(2018, 0, 1).toString());
	});
	it(`${dueString} is not due on the next day`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2018, 0, 2) }).isDue, IsDue.NotDue, new Date(2018, 0, 2).toString());
	});
	it(`${dueString} is due on the first date of the next month`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2018, 1, 1) }).isDue, IsDue.Due, new Date(2018, 1, 1).toString());
	});
});
describe('♻ Recurring with starting date (months) e2m', () => {
	const dueString = '2018-01-01|e2m';

	it(`${dueString} is due on the same day`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2018, 0, 1) }).isDue, IsDue.Due, new Date(2018, 0, 1).toString());
	});
	it(`${dueString} is not due on the next day`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2018, 0, 2) }).isDue, IsDue.NotDue, new Date(2018, 0, 2).toString());
	});
	it(`${dueString} is not due on the same day the next month`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2018, 1, 1) }).isDue, IsDue.NotDue, new Date(2018, 1, 1).toString());
	});
	it(`${dueString} is due on the same day in 2 months`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2018, 2, 1) }).isDue, IsDue.Due, new Date(2018, 2, 1).toString());
	});
});
describe('♻ Recurring with starting date (months) e2m (last day)', () => {
	const dueString = '2022-01-31|e2m';

	it(`${dueString} is due on the same day the same month (last day)`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 0, 31) }).isDue, IsDue.Due, new Date(2022, 0, 31).toString());
	});
	it(`${dueString} is not due on the last day the next month (last day)`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 1, 28) }).isDue, IsDue.NotDue, new Date(2022, 1, 28).toString());
	});
	it(`${dueString} is due on the same day in 2 months`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 2, 31) }).isDue, IsDue.Due, new Date(2022, 2, 31).toString());
	});
});
describe('♻ Recurring with starting date (months) e2m (last day)', () => {
	const dueString = '2022-02-31|e2m';

	it(`${dueString} is not due on the days before and after the starting due date`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 1, 27) }).isDue, IsDue.NotDue, new Date(2022, 1, 27).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 2, 1) }).isDue, IsDue.NotDue, new Date(2022, 2, 1).toString());
	});
	it(`${dueString} is due on the last day of the same month`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 1, 28) }).isDue, IsDue.Due, new Date(2022, 1, 28).toString());
	});
	it(`${dueString} is not due on the last day of the next month`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 2, 31) }).isDue, IsDue.NotDue, new Date(2022, 2, 31).toString());
	});
	it(`${dueString} is due on the last day in 2 months`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 3, 30) }).isDue, IsDue.Due, new Date(2022, 3, 30).toString());
	});
});

describe('♻ Recurring with starting date (months) e1m (not last day of month / last day of month)', () => {
	const dueString = '2022-03-30|e1m';

	it(`${dueString} is not due. Starting date - not last day of month. Target date - last day of month.`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 5, 30) }).isDue, IsDue.Due, new Date(2022, 5, 30).toString());
	});
});
// ────────────────────────────────────────────────────────────
describe('♻ Recurring with starting date (years) e1y', () => {
	const dueString = '2022-01-01|e1y';

	it(`${dueString} not due before the starting date year`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2021, 0, 1) }).isDue, IsDue.NotDue, new Date(2021, 0, 1).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2020, 0, 1) }).isDue, IsDue.NotDue, new Date(2020, 0, 1).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2019, 0, 1) }).isDue, IsDue.NotDue, new Date(2019, 0, 1).toString());
	});
	it(`${dueString} due at the starting year date`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 0, 1) }).isDue, IsDue.Due, new Date(2022, 0, 1).toString());
	});
	it(`${dueString} due when it should`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2023, 0, 1) }).isDue, IsDue.Due, new Date(2023, 0, 1).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2024, 0, 1) }).isDue, IsDue.Due, new Date(2024, 0, 1).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2025, 0, 1) }).isDue, IsDue.Due, new Date(2025, 0, 1).toString());
	});
	it(`${dueString} not due at other dates`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 0, 2) }).isDue, IsDue.NotDue, new Date(2022, 0, 2).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 0, 31) }).isDue, IsDue.NotDue, new Date(2022, 0, 31).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 1, 1) }).isDue, IsDue.NotDue, new Date(2022, 1, 1).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 11, 1) }).isDue, IsDue.NotDue, new Date(2022, 11, 1).toString());
	});
});

describe('♻ Recurring with starting date (years) e2y', () => {
	const dueString = '2022-01-01|e2y';

	it(`${dueString} due when should`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 0, 1) }).isDue, IsDue.Due, new Date(2022, 0, 1).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2024, 0, 1) }).isDue, IsDue.Due, new Date(2024, 0, 1).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2026, 0, 1) }).isDue, IsDue.Due, new Date(2026, 0, 1).toString());
	});
	it(`${dueString} not due when shouldn't`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2023, 0, 1) }).isDue, IsDue.NotDue, new Date(2023, 0, 1).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 1, 1) }).isDue, IsDue.NotDue, new Date(2022, 1, 1).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2025, 1, 1) }).isDue, IsDue.NotDue, new Date(2025, 1, 1).toString());
	});
});

describe('♻ Recurring with starting date (years) e2y (last day)', () => {
	const dueString = '2022-02-31|e2y';

	it(`${dueString} is not due on the days before and after the starting due date`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 1, 27) }).isDue, IsDue.NotDue, new Date(2022, 1, 27).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 2, 1) }).isDue, IsDue.NotDue, new Date(2022, 2, 1).toString());
	});
	it(`${dueString} is due on the last day of the same month`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 1, 28) }).isDue, IsDue.Due, new Date(2022, 1, 28).toString());
	});
	it(`${dueString} is not due on the last day of the next month`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 2, 31) }).isDue, IsDue.NotDue, new Date(2022, 2, 31).toString());
	});
	it(`${dueString} is due when it should`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2022, 1, 28) }).isDue, IsDue.Due, new Date(2022, 1, 28).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2024, 1, 29) }).isDue, IsDue.Due, new Date(2024, 1, 29).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2026, 1, 28) }).isDue, IsDue.Due, new Date(2026, 1, 28).toString());
	});
	it(`${dueString} is not due when it shouldn't`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2023, 1, 28) }).isDue, IsDue.NotDue, new Date(2023, 1, 28).toString());
		assert.equal(new DueDate(dueString, { targetDate: new Date(2024, 1, 28) }).isDue, IsDue.NotDue, new Date(2024, 1, 28).toString());
	});
});


describe('Comma delimited `,`', () => {
	it('`mon,sun`', () => {
		assert.equal(new DueDate('mon,sun', { targetDate: $1jan2018monday }).isDue, IsDue.Due);
		assert.equal(new DueDate('mon,sun', { targetDate: $7jan2018sunday }).isDue, IsDue.Due);
		assert.equal(new DueDate('mon,sun', { targetDate: $2jan2018tuesday }).isDue, IsDue.NotDue);
		assert.equal(new DueDate('mon,sun', { targetDate: $3jan2018wednesday }).isDue, IsDue.NotDue);
		assert.equal(new DueDate('mon,sun', { targetDate: $4jan2018thursday }).isDue, IsDue.NotDue);
		assert.equal(new DueDate('mon,sun', { targetDate: $5jan2018friday }).isDue, IsDue.NotDue);
		assert.equal(new DueDate('mon,sun', { targetDate: $6jan2018saturday }).isDue, IsDue.NotDue);
	});
});

describe('🚫 Invalid due date', () => {
	it('Due date should have `invalid` state', () => {
		assert.equal(new DueDate('2020').isDue, IsDue.Invalid, '2020');
		assert.equal(new DueDate('2020-05-2').isDue, IsDue.Invalid, '2020-05-2');
		assert.equal(new DueDate('2020-07-31|e14').isDue, IsDue.Invalid, '2020-07-31|e14');
		assert.equal(new DueDate('2020-07-35').isDue, IsDue.Invalid, '2020-07-35');
	});
});

