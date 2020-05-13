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
		vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
		{
			enableScripts: true,
		}
	);
	const cssFilePath = vscode.Uri.file(
		path.join(state.extensionContext.extensionPath, 'media', 'calendar.css')
	);
	panel.webview.html = getWebviewContent(panel.webview, cssFilePath);
}
function getWebviewContent(webview: vscode.Webview, cssFilePath: vscode.Uri) {
	let htmlAsText = 'wow, such calendar';

	// And the uri we use to load this script in the webview
	const cssUri = webview.asWebviewUri(cssFilePath);
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" href="${cssUri}">
    <title>Cat Coding</title>
</head>
<body>
    ${htmlAsText}
</body>
</html>`;
}
