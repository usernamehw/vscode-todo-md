import { describe, it } from 'mocha';
import vscode, { Range, Position, Selection } from 'vscode';
import { expect } from 'chai';

import { filterItems } from '../../filter';
import { Task, TaskInit } from '../../parse';
import { DueState } from '../../types';

type Init = Partial<TaskInit>;
function newTask(task: Init) {
	// @ts-ignore
	return new Task(task);
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

