import { assert } from 'chai';
import cloneDeep from 'lodash/cloneDeep';
import { describe, it } from 'mocha';
import { filterTasks } from '../../filter';
import { TaskInit, TheTask } from '../../TheTask';
import { IsDue } from '../../types';
import { headerDelimiter } from './testUtils';

function newTask(task: Partial<TaskInit>) {
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
		isDue: IsDue.Due,
	},
});
const notDueTask = newTask({
	// @ts-ignore
	due: {
		isDue: IsDue.NotDue,
	},
});
const overdueTask = newTask({
	// @ts-ignore
	due: {
		isDue: IsDue.Overdue,
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
describe(`${headerDelimiter('filter')}Filter tags`, () => {
	it('One tag', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask];
		const filtered = filterTasks(items, '#html');
		assert.deepEqual(filtered.tasks, [threeTagsTask, oneTagHtmlTask]);
	});
	it('Multiple tags `#html #js`', () => {
		const items = [justTextTask, threeTagsTask];
		const filtered = filterTasks(items, '#html #js');
		assert.deepEqual(filtered.tasks, [threeTagsTask]);
	});
});
describe('Filter contexts', () => {
	it('One context', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask, multipleContextTask, oneContextTask];
		const filtered = filterTasks(items, '@work');
		assert.deepEqual(filtered.tasks, [multipleContextTask]);
	});
	it('Multiple contexts', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask, multipleContextTask, oneContextTask];
		const filtered = filterTasks(items, '@home @work');
		assert.deepEqual(filtered.tasks, [multipleContextTask]);
	});
});
describe('Filter projects', () => {
	it('One project', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask, multipleContextTask, oneContextTask, oneProjectTask, multipleProjectTask];
		const filtered = filterTasks(items, '+one');
		assert.deepEqual(filtered.tasks, [oneProjectTask, multipleProjectTask]);
	});
	it('Multiple projects', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask, multipleContextTask, oneContextTask, oneProjectTask, multipleProjectTask];
		const filtered = filterTasks(items, '+one +two');
		assert.deepEqual(filtered.tasks, [multipleProjectTask]);
	});
});
describe('Filter $done', () => {
	it('$done', () => {
		const items = [doneTask, notDoneTask];
		const filtered = filterTasks(items, '$done');
		assert.deepEqual(filtered.tasks, [doneTask]);
	});
	it('-$done', () => {
		const items = [doneTask, notDoneTask];
		const filtered = filterTasks(items, '-$done');
		assert.deepEqual(filtered.tasks, [notDoneTask]);
	});
});
describe('Filter $due', () => {
	it('$due', () => {
		const items = [dueTask, notDueTask, overdueTask];
		const filtered = filterTasks(items, '$due');
		assert.deepEqual(filtered.tasks, [dueTask, overdueTask]);
	});
	it('$overdue', () => {
		const items = [dueTask, notDueTask, overdueTask];
		const filtered = filterTasks(items, '$overdue');
		assert.deepEqual(filtered.tasks, [overdueTask]);
	});
});
describe('Filter $C priority', () => {
	it('$C', () => {
		const items = [priorityATask, priorityCTask, priorityETask, priorityZTask];
		const filtered = filterTasks(items, '$C');
		assert.deepEqual(filtered.tasks, [priorityCTask]);
	});
	it('>$C Priority C or higher', () => {
		const items = [priorityATask, priorityCTask, priorityETask, priorityZTask];
		const filtered = filterTasks(items, '>$C');
		assert.deepEqual(filtered.tasks, [priorityATask, priorityCTask]);
	});
	it('<$C Priority C or lower', () => {
		const items = [priorityATask, priorityCTask, priorityETask, priorityZTask];
		const filtered = filterTasks(items, '<$C');
		assert.deepEqual(filtered.tasks, [priorityCTask, priorityETask, priorityZTask]);
	});
});

describe('Filter "title"', () => {
	it('"needle"', () => {
		const needleInTheTag = newTask({
			title: '',
			tags: ['needle'],
		});
		const needleInTheTitle = newTask({
			title: 'needle',
		});
		const items = [needleInTheTag, needleInTheTitle];
		const filtered = filterTasks(items, '"needle"');
		assert.deepEqual(filtered.tasks, [needleInTheTitle]);
	});
});


