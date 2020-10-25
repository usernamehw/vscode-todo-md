import { expect } from 'chai';
import dayjs from 'dayjs';
import { describe, it } from 'mocha';
import { helpCreateDueDate } from '../../time/setDueDateHelper';
import { headerDelimiter } from './testUtils';

const $1jan2018monday = new Date(2018, 0, 1);
const $2jan2018tuesday = new Date(2018, 0, 2);
const $3jan2018wednesday = new Date(2018, 0, 3);
const $4jan2018thursday = new Date(2018, 0, 4);
const $5jan2018friday = new Date(2018, 0, 5);
const $6jan2018saturday = new Date(2018, 0, 6);
const $7jan2018sunday = new Date(2018, 0, 7);
const $8jan2018monday = new Date(2018, 0, 8);

describe(`${headerDelimiter('set due date helper')}Relative date`, () => {
	it('`+` - tomorrow', () => {
		const due = helpCreateDueDate('+', $1jan2018monday);
		expect(due?.isSame($2jan2018tuesday, 'date')).to.be.ok;
		expect(!due?.isSame($1jan2018monday, 'date')).to.be.ok;
	});
	it('`+1` - tomorrow', () => {
		const due = helpCreateDueDate('+1', $1jan2018monday);
		expect(due?.isSame($2jan2018tuesday, 'date')).to.be.ok;
	});
	it('`+1d` - tomorrow', () => {
		const due = helpCreateDueDate('+1', $1jan2018monday);
		expect(due?.isSame($2jan2018tuesday, 'date')).to.be.ok;
	});
	it('`+1w` - in a week', () => {
		const due = helpCreateDueDate('+1w', $1jan2018monday);
		expect(due?.isSame($8jan2018monday, 'date')).to.be.ok;
	});
	it('`+1m` - in a month', () => {
		const due = helpCreateDueDate('+1m', $1jan2018monday);
		expect(due?.isSame(new Date(2018, 1, 1), 'date')).to.be.ok;
	});
	it('`+0` - today', () => {
		const due = helpCreateDueDate('+0', $1jan2018monday);
		expect(due?.isSame($1jan2018monday, 'date')).to.be.ok;
	});
	it('`+2` - the day after tomorrow', () => {
		const due = helpCreateDueDate('+2', $1jan2018monday);
		expect(due?.isSame($3jan2018wednesday, 'date')).to.be.ok;
	});
	it('`-` - yesterday', () => {
		const due = helpCreateDueDate('-', $2jan2018tuesday);
		expect(due?.isSame($1jan2018monday, 'date')).to.be.ok;
	});
	it('`-1` - yesterday', () => {
		const due = helpCreateDueDate('-1', $2jan2018tuesday);
		expect(due?.isSame($1jan2018monday, 'date')).to.be.ok;
	});
	it('`-1d` - yesterday', () => {
		const due = helpCreateDueDate('-1d', $2jan2018tuesday);
		expect(due?.isSame($1jan2018monday, 'date')).to.be.ok;
	});
	it('`-1w` - A week ago', () => {
		const due = helpCreateDueDate('-1w', $1jan2018monday);
		expect(due?.isSame(new Date(2017, 11, 25), 'date')).to.be.ok;
	});
	it('`-1m` - A month ago', () => {
		const due = helpCreateDueDate('-1m', $1jan2018monday);
		expect(due?.isSame(new Date(2017, 11, 1), 'date')).to.be.ok;
	});
	it('`-2` - the day before yesterday', () => {
		const due = helpCreateDueDate('-2', $3jan2018wednesday);
		expect(due?.isSame($1jan2018monday, 'date')).to.be.ok;
	});
});
describe('Absolute date', () => {
	it('`4` Just the next day if the current date is 3.', () => {
		const due = helpCreateDueDate('4', $3jan2018wednesday);
		expect(due?.isSame($4jan2018thursday, 'date')).to.be.ok;
	});
	it('`4` The same date if the current date is 4.', () => {
		const due = helpCreateDueDate('4', $4jan2018thursday);
		expect(due?.isSame($4jan2018thursday, 'date')).to.be.ok;
	});
	it('`4` About a month later if current the date is 5.', () => {
		const due = helpCreateDueDate('4', $5jan2018friday);
		expect(due?.isSame(dayjs(new Date(2018, 1, 4)), 'date')).to.be.ok;
	});
});
describe('Closest future day of the week', () => {
	it('`mon` & `monday` In 6 days.', () => {
		const due = helpCreateDueDate('mon', $2jan2018tuesday);
		expect(due?.isSame($8jan2018monday, 'date')).to.be.ok;
		const dueFull = helpCreateDueDate('monday', $2jan2018tuesday);
		expect(dueFull?.isSame($8jan2018monday, 'date')).to.be.ok;
	});
	it('`tue` & `tuesday` The same day.', () => {
		const due = helpCreateDueDate('tue', $2jan2018tuesday);
		expect(due?.isSame($2jan2018tuesday, 'date')).to.be.ok;
		const dueFull = helpCreateDueDate('tuesday', $2jan2018tuesday);
		expect(dueFull?.isSame($2jan2018tuesday, 'date')).to.be.ok;
	});
	it('`wed` & `wednesday` The next day.', () => {
		const due = helpCreateDueDate('wed', $2jan2018tuesday);
		expect(due?.isSame($3jan2018wednesday, 'date')).to.be.ok;
		const dueFull = helpCreateDueDate('wednesday', $2jan2018tuesday);
		expect(dueFull?.isSame($3jan2018wednesday, 'date')).to.be.ok;
	});
	it('`thu` & `thursday` In 2 days.', () => {
		const due = helpCreateDueDate('thu', $2jan2018tuesday);
		expect(due?.isSame($4jan2018thursday, 'date')).to.be.ok;
		const dueFull = helpCreateDueDate('thursday', $2jan2018tuesday);
		expect(dueFull?.isSame($4jan2018thursday, 'date')).to.be.ok;
	});
	it('`fri` & `friday` In 3 days.', () => {
		const due = helpCreateDueDate('fri', $2jan2018tuesday);
		expect(due?.isSame($5jan2018friday, 'date')).to.be.ok;
		const dueFull = helpCreateDueDate('friday', $2jan2018tuesday);
		expect(dueFull?.isSame($5jan2018friday, 'date')).to.be.ok;
	});
	it('`sat` & `saturday` In 4 days.', () => {
		const due = helpCreateDueDate('sat', $2jan2018tuesday);
		expect(due?.isSame($6jan2018saturday, 'date')).to.be.ok;
		const dueFull = helpCreateDueDate('saturday', $2jan2018tuesday);
		expect(dueFull?.isSame($6jan2018saturday, 'date')).to.be.ok;
	});
	it('`sun` & `sunday` In 5 days.', () => {
		const due = helpCreateDueDate('sun', $2jan2018tuesday);
		expect(due?.isSame($7jan2018sunday, 'date')).to.be.ok;
		const dueFull = helpCreateDueDate('sunday', $2jan2018tuesday);
		expect(dueFull?.isSame($7jan2018sunday, 'date')).to.be.ok;
	});
});
describe('Closest future month/date', () => {
	it('`jan 2` is the same date.', () => {
		const due = helpCreateDueDate('jan 2', $2jan2018tuesday);
		expect(due?.isSame($2jan2018tuesday, 'date')).to.be.ok;
		const dueFull = helpCreateDueDate('January 2', $2jan2018tuesday);
		expect(dueFull?.isSame($2jan2018tuesday, 'date')).to.be.ok;
		const dueFullNoSpace = helpCreateDueDate('jan2', $2jan2018tuesday);
		expect(dueFullNoSpace?.isSame($2jan2018tuesday, 'date')).to.be.ok;
	});
	it('`jan 1` in a year.', () => {
		const due = helpCreateDueDate('jan 1', $2jan2018tuesday);
		expect(due?.isSame(new Date(2019, 0, 1), 'date')).to.be.ok;
	});
	it('`jan 5` in a few days.', () => {
		const due = helpCreateDueDate('jan 5', $2jan2018tuesday);
		expect(due?.isSame($5jan2018friday, 'date')).to.be.ok;
	});
});
