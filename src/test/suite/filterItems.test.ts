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

const justText = newTask({
	title: 'just text',
});
const threeTags = newTask({
	title: 'three tags',
	tags: ['html', 'css', 'js'],
});
const oneTagHtml = newTask({
	title: 'one tag',
	tags: ['html'],
});

// ──────────────────────────────────────────────────────────────────────
describe('Filter tags', () => {
	it('One tag', () => {
		const items = [justText, threeTags, oneTagHtml];
		const filtered = filterItems(items, '#html');
		expect(filtered).to.have.length(2);
		expect(filtered).to.have.same.members([threeTags, oneTagHtml]);
	});
	it('Multiple tags', () => {
		const items = [justText, threeTags];
		const filtered = filterItems(items, '#html #js');
		expect(filtered).to.have.length(1);
		expect(filtered).to.have.same.members([threeTags]);
	});
});

