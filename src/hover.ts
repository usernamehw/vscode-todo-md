import * as vscode from 'vscode';
import dayjs from 'dayjs';
import table from 'markdown-table';

import { G } from './extension';
import { DATE_FORMAT } from './timeUtils';

export function updateHover() {
	if (G.hoverDisposable) {
		G.hoverDisposable.dispose();
	}
	G.hoverDisposable =	vscode.languages.registerHoverProvider({ scheme: 'file' }, {
		provideHover(document, position, token) {
			const dateRegexp = /\d{4}-\d{2}-\d{2}/;
			const range = document.getWordRangeAtPosition(position, dateRegexp);
			if (!range) {
				return undefined;
			}
			const word = document.getText(range);
			const date = word ? dayjs(word) : dayjs();
			const firstDateOfMonth = date.startOf('month');
			const firstDateOfMonthDay = firstDateOfMonth.day();
			const lastDateOfMonth = date.endOf('month');
			const howManyEmptyRender = firstDateOfMonthDay === 0 ? 6 : firstDateOfMonthDay - 1;
			const mdTableAsArray = ['`Mo`', '`Tu`', '`We`', '`Th`', '`Fr`', '`Sa`', '`Su`'];
			const empty = Array.from({ length: howManyEmptyRender }, () => '');
			mdTableAsArray.push(...empty);

			// const today = dayjs();
			for (let i = 0, j = howManyEmptyRender + 1; ; j++, i++) {
				const day = firstDateOfMonth.add(i, 'day');
				const dayAs = `[\`${String(i + 1).padStart(2, '0')}\`](${prepareCommand('2020', position)})`;
				mdTableAsArray.push(dayAs);
				if (j === 7) {
					j = 0;
				}
				if (day.isSame(lastDateOfMonth, 'day')) {
					break;
				}
			}
			const mdTable = chunk(mdTableAsArray, 7);

			const diff = dayjs().to(dayjs(word));
			const calendar = `\n\n${table(mdTable, { align: ['r', 'r', 'r', 'r', 'r', 'r', 'r'] })}`;
			const md = new vscode.MarkdownString(`${diff}`);
			md.isTrusted = true;
			return new vscode.Hover(md);
		},
	});
}
function prepareCommand(date: string, position: vscode.Position) {
	return vscode.Uri.parse(
		`command:todomd.setDate?${encodeURIComponent(JSON.stringify([date, position]))}`
	);
}


function chunk(arr: any[], len: number) {
	let chunks = [],
		i = 0,
		n = arr.length;

	while (i < n) {
		chunks.push(arr.slice(i, i += len));
	}

	return chunks;
}
