import * as vscode from 'vscode';
import * as path from 'path';
import dayjs from 'dayjs';

import { state } from '../extension';
import { TheTask } from '../parse';
import { DATE_FORMAT, parseDue } from '../timeUtils';

export function createAgendaWebview() {
	const panel = vscode.window.createWebviewPanel(
		'agenda',
		'Agenda',
		vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
		{
			enableScripts: true,
		}
	);
	panel.webview.html = getWebviewContent(panel.webview, state.tasks);
}

function getWebviewContent(webview: vscode.Webview, tasks: TheTask[]) {
	const weekStart = dayjs().startOf('isoWeek');
	const week = [];
	const tasksWithDue = tasks.filter(t => t.due);
	for (let i = 0; i < 7; i++) {
		const localDate = new Date(weekStart.add(i, 'day').format(DATE_FORMAT).slice(0, 10));
		const dueOnDate = tasksWithDue.filter(t => parseDue(t.due!, localDate).isDue);
		week.push({
			date: localDate,
			dueOnDate,
		});
	}
	let tasksAsHtml = '';
	for (const day of week) {
		const isToday = dayjs(day.date).isSame(dayjs(), 'day') ? ' today' : '';
		tasksAsHtml += `<div class="day${isToday}">`;
		tasksAsHtml += `${dayjs(day.date).format('dddd')}<br>`;
		for (const dueTask of day.dueOnDate) {
			tasksAsHtml += `${dueTask.title}<br>`;
		}
		tasksAsHtml += '</div>';
	}
	const scriptPathOnDisk = vscode.Uri.file(
		path.join(state.extensionContext.extensionPath, 'media', 'agenda.css')
	);

	// And the uri we use to load this script in the webview
	const cssUri = webview.asWebviewUri(scriptPathOnDisk);
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" href="${cssUri}">
    <title>Cat Coding</title>
</head>
<body>
    ${tasksAsHtml}
</body>
</html>`;
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}