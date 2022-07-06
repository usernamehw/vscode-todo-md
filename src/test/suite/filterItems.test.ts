import { assert } from 'chai';
import cloneDeep from 'lodash/cloneDeep';
import { describe, it } from 'mocha';
import { filterItems } from '../../filter';
import { TaskInit, TheTask } from '../../TheTask';
import { DueState } from '../../types';
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
		isDue: DueState.Due,
	},
});
const notDueTask = newTask({
	// @ts-ignore
	due: {
		isDue: DueState.NotDue,
	},
});
const overdueTask = newTask({
	// @ts-ignore
	due: {
		isDue: DueState.Overdue,
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
		const filtered = filterItems(items, '#html');
		assert.deepEqual(filtered, [threeTagsTask, oneTagHtmlTask]);
	});
	it('Multiple tags `#html #js`', () => {
		const items = [justTextTask, threeTagsTask];
		const filtered = filterItems(items, '#html #js');
		assert.deepEqual(filtered, [threeTagsTask]);
	});
});
describe('Filter contexts', () => {
	it('One context', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask, multipleContextTask, oneContextTask];
		const filtered = filterItems(items, '@work');
		assert.deepEqual(filtered, [multipleContextTask]);
	});
	it('Multiple contexts', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask, multipleContextTask, oneContextTask];
		const filtered = filterItems(items, '@home @work');
		assert.deepEqual(filtered, [multipleContextTask]);
	});
});
describe('Filter projects', () => {
	it('One project', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask, multipleContextTask, oneContextTask, oneProjectTask, multipleProjectTask];
		const filtered = filterItems(items, '+one');
		assert.deepEqual(filtered, [oneProjectTask, multipleProjectTask]);
	});
	it('Multiple projects', () => {
		const items = [justTextTask, threeTagsTask, oneTagHtmlTask, multipleContextTask, oneContextTask, oneProjectTask, multipleProjectTask];
		const filtered = filterItems(items, '+one +two');
		assert.deepEqual(filtered, [multipleProjectTask]);
	});
});
describe('Filter $done', () => {
	it('$done', () => {
		const items = [doneTask, notDoneTask];
		const filtered = filterItems(items, '$done');
		assert.deepEqual(filtered, [doneTask]);
	});
	it('-$done', () => {
		const items = [doneTask, notDoneTask];
		const filtered = filterItems(items, '-$done');
		assert.deepEqual(filtered, [notDoneTask]);
	});
});
describe('Filter $due', () => {
	it('$due', () => {
		const items = [dueTask, notDueTask, overdueTask];
		const filtered = filterItems(items, '$due');
		assert.deepEqual(filtered, [dueTask, overdueTask]);
	});
	it('$overdue', () => {
		const items = [dueTask, notDueTask, overdueTask];
		const filtered = filterItems(items, '$overdue');
		assert.deepEqual(filtered, [overdueTask]);
	});
});
describe('Filter $C priority', () => {
	it('$C', () => {
		const items = [priorityATask, priorityCTask, priorityETask, priorityZTask];
		const filtered = filterItems(items, '$C');
		assert.deepEqual(filtered, [priorityCTask]);
	});
	it('>$C Priority C or higher', () => {
		const items = [priorityATask, priorityCTask, priorityETask, priorityZTask];
		const filtered = filterItems(items, '>$C');
		assert.deepEqual(filtered, [priorityATask, priorityCTask]);
	});
	it('<$C Priority C or lower', () => {
		const items = [priorityATask, priorityCTask, priorityETask, priorityZTask];
		const filtered = filterItems(items, '<$C');
		assert.deepEqual(filtered, [priorityCTask, priorityETask, priorityZTask]);
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
		const filtered = filterItems(items, '"needle"');
		assert.deepEqual(filtered, [needleInTheTitle]);
	});
});

describe('Filter matches nested tasks (subtasks)', () => {
	it('"Match nested tasks."', () => {
		// Parent
		//     lvl 1 Subtask 1
		//         lvl 2 Subtask 1
		//         lvl 2 Subtask 2 #html #css
		//     lvl 1 Subtask 2 +something
		const parentTask = newTask({ title: 'Parent' });
		const lvl1Subtask1 = newTask({ title: 'lvl 1 Subtask 1' });
		const lvl2Subtask1 = newTask({ title: 'lvl 2 Subtask 1' });
		const lvl2Subtask2 = newTask({ title: 'lvl 2 Subtask 2', tags: ['html', 'css'] });
		const lvl1Subtask2 = newTask({ title: 'lvl 1 Subtask 2', projects: ['something'] });

		lvl1Subtask1.subtasks = [lvl2Subtask1, lvl2Subtask2];

		parentTask.subtasks = [
			lvl1Subtask1,
			lvl1Subtask2,
		];

		// Match for "#html" should produce:
		// Parent
		//     lvl 1 Subtask 1
		//         lvl 2 Subtask 2 #html #css
		const expectedParent = cloneDeep(parentTask);
		expectedParent.subtasks.splice(1, 1);
		expectedParent.subtasks[0].subtasks.splice(0, 1);
		assert.deepEqual(filterItems([parentTask], '#html'), [expectedParent]);

		// Match for "+something" should produce:
		// Parent
		//     lvl 1 Subtask 2 +something
		const expectedParent2 = cloneDeep(parentTask);
		expectedParent2.subtasks.splice(0, 1);
		assert.deepEqual(filterItems([parentTask], '+something'), [expectedParent2]);
	});
});

