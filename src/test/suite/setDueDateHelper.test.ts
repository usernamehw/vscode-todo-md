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

describe(`${headerDelimiter('set due date helper')}Relative date`, () => {
	it('`+` - tomorrow', () => {
		const due = helpCreateDueDate('+', $1jan2018monday);
		expect(due?.isSame($2jan2018tuesday, 'day')).to.be.ok;
		expect(!due?.isSame($1jan2018monday, 'day')).to.be.ok;
	});
	it('`+1` - tomorrow', () => {
		const due = helpCreateDueDate('+1', $1jan2018monday);
		expect(due?.isSame($2jan2018tuesday, 'day')).to.be.ok;
	});
	it('`+0` - today', () => {
		const due = helpCreateDueDate('+0', $1jan2018monday);
		expect(due?.isSame($1jan2018monday, 'day')).to.be.ok;
	});
	it('`+2` - the day after tomorrow', () => {
		const due = helpCreateDueDate('+2', $1jan2018monday);
		expect(due?.isSame($3jan2018wednesday, 'day')).to.be.ok;
	});
	it('`-` - yesterday', () => {
		const due = helpCreateDueDate('-', $2jan2018tuesday);
		expect(due?.isSame($1jan2018monday, 'day')).to.be.ok;
	});
	it('`-1` - yesterday', () => {
		const due = helpCreateDueDate('-1', $2jan2018tuesday);
		expect(due?.isSame($1jan2018monday, 'day')).to.be.ok;
	});
	it('`-2` - the day before yesterday', () => {
		const due = helpCreateDueDate('-2', $3jan2018wednesday);
		expect(due?.isSame($1jan2018monday, 'day')).to.be.ok;
	});
});
describe('Absolute date', () => {
	it('`4` Just the next day if the current date is 3.', () => {
		const due = helpCreateDueDate('4', $3jan2018wednesday);
		expect(due?.isSame($4jan2018thursday, 'day')).to.be.ok;
	});
	it('`4` The same date if the current date is 4.', () => {
		const due = helpCreateDueDate('4', $4jan2018thursday);
		expect(due?.isSame($4jan2018thursday, 'day')).to.be.ok;
	});
	it('`4` About a month later if current the date is 5.', () => {
		const due = helpCreateDueDate('4', $5jan2018friday);
		expect(due?.isSame(dayjs(new Date(2018, 1, 4)), 'day')).to.be.ok;
	});
});
