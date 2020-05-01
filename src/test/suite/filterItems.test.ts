import { describe, it } from 'mocha';
import vscode, { Range, Position, Selection } from 'vscode';
import { expect } from 'chai';

import { filterItems } from '../../filter';
import { Task } from '../../parse';

let items: Task[] = [];

// ──────────────────────────────────────────────────────────────────────
describe('...', () => {
	it('...', () => {
		const filtered = filterItems(items, '');
		expect(filtered).to.have.length(0);
	});
});

function assignFilterItems() {
	
}