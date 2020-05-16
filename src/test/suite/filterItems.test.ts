import { describe, it } from 'mocha';
import { expect } from 'chai';

import { filterItems } from '../../filter';
import { TheTask, TaskInit } from '../../parse';
import { DueState } from '../../types';

type Init = Partial<TaskInit>;
function newTask(task: Init) {
	// @ts-ignore
	return new TheTask(task);
}

const justTextTask = newTask({
	title: 'just text',
});
const threeTagsTask = newTask({
	title: 'three tags',
	tags: ['html', 'css', 'js'],
});
const oneTagHtmlTask = newTask({
	title: 'one tag',
	tags: ['html'],
});
const oneContextTask = newTask({
	title: 'one context',
	contexts: ['home'],
});
const multipleContextTask = newTask({
	title: 'multiple contexts',
	contexts: ['home', 'work', 'email'],
});
const oneProjectTask = newTask({
	title: 'one project',
	projects: ['one'],
});
const multipleProjectTask = newTask({
	title: 'multiple projects',
	projects: ['one', 'two', 'three'],
});
const doneTask = newTask({
	done: true,
});
const notDoneTask = newTask({
	done: false,
});
const dueTask = newTask({
	// @ts-ignore
	due: {
		isDue: DueState.due,
	},
});
const notDueTask = newTask({
	// @ts-ignore
	due: {
		isDue: DueState.notDue,
	},
});
const overdueTask = newTask({
	// @ts-ignore
	due: {
		isDue: DueState.overdue,
	},
});
const priorityATask = newTask({
	priority: 'A',
});
const priorityCTask = newTask({
	priority: 'C',
});
const priorityETask = newTask({
	priority: 'E',
});
const priorityZTask = newTask({
	priority: 'Z',
});
// ──────────────────────────────────────────────────────────────────────
describe('Filter tags', () => {
	it('One tag', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask];
		const filtered = filterItems(items, '#html');
		expect(filtered).to.have.length(2);
		expect(filtered).to.have.same.members([threeTagsTask, oneTagHtmlTask]);
	});
	it('Multiple tags', () => {
		const items = [justTextTask, threeTagsTask];
		const filtered = filterItems(items, '#html #js');
		expect(filtered).to.have.length(1);
		expect(filtered).to.have.same.members([threeTagsTask]);
	});
});
describe('Filter contexts', () => {
	it('One context', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask, multipleContextTask, oneContextTask];
		const filtered = filterItems(items, '@work');
		expect(filtered).to.have.length(1);
		expect(filtered).to.have.same.members([multipleContextTask]);
	});
	it('Multiple contexts', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask, multipleContextTask, oneContextTask];
		const filtered = filterItems(items, '@home @work');
		expect(filtered).to.have.length(1);
		expect(filtered).to.have.same.members([multipleContextTask]);
	});
});
describe('Filter projects', () => {
	it('One project', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask, multipleContextTask, oneContextTask, oneProjectTask, multipleProjectTask];
		const filtered = filterItems(items, '+one');
		expect(filtered).to.have.length(2);
		expect(filtered).to.have.same.members([multipleProjectTask, oneProjectTask]);
	});
	it('Multiple projects', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask, multipleContextTask, oneContextTask, oneProjectTask, multipleProjectTask];
		const filtered = filterItems(items, '+one +two');
		expect(filtered).to.have.length(1);
		expect(filtered).to.have.same.members([multipleProjectTask]);
	});
});
describe('Filter $done', () => {
	it('$done', () => {
		const items = [doneTask, notDoneTask];
		const filtered = filterItems(items, '$done');
		expect(filtered).to.have.length(1);
		expect(filtered).to.have.same.members([doneTask]);
	});
	it('-$done', () => {
		const items = [doneTask, notDoneTask];
		const filtered = filterItems(items, '-$done');
		expect(filtered).to.have.length(1);
		expect(filtered).to.have.same.members([notDoneTask]);
	});
});
describe('Filter $due', () => {
	it('$due', () => {
		const items = [dueTask, notDueTask, overdueTask];
		const filtered = filterItems(items, '$due');
		expect(filtered).to.have.length(2);
		expect(filtered).to.have.same.members([dueTask, overdueTask]);
	});
	it('$overdue', () => {
		const items = [dueTask, notDueTask, overdueTask];
		const filtered = filterItems(items, '$overdue');
		expect(filtered).to.have.length(1);
		expect(filtered).to.have.same.members([overdueTask]);
	});
});
describe('Filter $C priority', () => {
	it('$C', () => {
		const items = [priorityATask, priorityCTask, priorityETask, priorityZTask];
		const filtered = filterItems(items, '$C');
		expect(filtered).to.have.same.members([priorityCTask]);
	});
	it('>$C Priority C or higher', () => {
		const items = [priorityATask, priorityCTask, priorityETask, priorityZTask];
		const filtered = filterItems(items, '>$C');
		expect(filtered).to.have.same.members([priorityCTask, priorityATask]);
	});
	it('<$C Priority C or lower', () => {
		const items = [priorityATask, priorityCTask, priorityETask, priorityZTask];
		const filtered = filterItems(items, '<$C');
		expect(filtered).to.have.same.members([priorityCTask, priorityETask, priorityZTask]);
	});
});

