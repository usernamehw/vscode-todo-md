import * as vscode from 'vscode';
import * as path from 'path';
import dayjs from 'dayjs';

import { state } from '../extension';
import { TheTask } from '../parse';
import { DATE_FORMAT, parseDue } from '../timeUtils';

export function createCalendarWebview() {
	const panel = vscode.window.createWebviewPanel(
		'calendar',
		'Calendar',
		vscode.ViewColumn.Active, // Editor column to show the new webview panel in.
		{
			enableScripts: true,
		}
	);
	const cssFilePath = vscode.Uri.file(
		path.join(state.extensionContext.extensionPath, 'media', 'calendar.css')
	);
	const jsFilePath = vscode.Uri.file(
		path.join(state.extensionContext.extensionPath, 'media', 'calendar.js')
	);
	panel.webview.html = getWebviewContent(panel.webview, cssFilePath, jsFilePath);
}
function getHeaderHtml() {
	let str = '<tr>';
	str += '<th>Mon</th>';
	str += '<th>Tue</th>';
	str += '<th>Wed</th>';
	str += '<th>Thu</th>';
	str += '<th>Fri</th>';
	str += '<th>Sat</th>';
	str += '<th>Sun</th>';
	str += '</tr>';
	return str;
}
function getCell(text: string, dateStr: string) {
	return `<td class="date" data-id="${dateStr}">${text}</td>`;
}
function getWebviewContent(webview: vscode.Webview, cssUri: vscode.Uri, jsUri: vscode.Uri) {
	let htmlAsText = `<table>${getHeaderHtml()}`;
	const firstDateOfMonth = dayjs().startOf('month');
	const firstDateOfMonthDay = firstDateOfMonth.day();
	const lastDateOfMonth = dayjs().endOf('month');
	const howManyEmptyRender = firstDateOfMonthDay === 0 ? 6 : firstDateOfMonthDay - 1;
	htmlAsText += '<tr>';
	htmlAsText += getCell('', '').repeat(howManyEmptyRender);
	for (let i = 0, j = howManyEmptyRender + 1; ; j++, i++) {
		const day = firstDateOfMonth.add(i, 'day');
		const dayAsHtmlStr = getCell(day.date().toString(), day.format(DATE_FORMAT));
		htmlAsText += dayAsHtmlStr;
		if (j === 7) {
			j = 0;
			htmlAsText += '</tr><tr>';
		}
		if (day.isSame(lastDateOfMonth, 'day')) {
			htmlAsText += '</tr>';
			break;
		}
	}

	htmlAsText += '</table>';
	const webviewUri = webview.asWebviewUri(cssUri);
	const scriptUri = webview.asWebviewUri(jsUri);
	const nonce = getNonce();
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" href="${webviewUri}">
    <title>Calendar</title>
</head>
<body>
	${htmlAsText}
	<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

// setTimeout(() => {
// 	createCalendarWebview();
// }, 200);

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
