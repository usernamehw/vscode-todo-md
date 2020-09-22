/* eslint-disable no-undef */
// TODO: enable typescipt-eslint for this file

import { defaultSortTasks } from '../src/sort';
import type { TheTask } from '../src/TheTask';
import type { IExtensionConfig, WebviewMessage } from '../src/types';

interface VscodeWebviewApi {
	getState(): any;
	setState(state: any): void;
	postMessage(message: WebviewMessage): void;
}
/** @ts-ignore */
const vscode: VscodeWebviewApi = acquireVsCodeApi();

const state: { tasks: TheTask[]; config: IExtensionConfig['webview'] } = {
	tasks: [],
	config: {
		showCompleted: true,
	},
};
let filteredTasksGlobal: TheTask[] = [];

const filterInputEl = document.getElementById('filterInput') as HTMLInputElement;

filterInputEl.addEventListener('input', e => {
	updateTasks();// TODO: update webview counter
});
filterInputEl.addEventListener('keydown', e => {
	if (e.altKey && e.key === 'd') {
		const firstMatch = filteredTasksGlobal[0];
		if (!firstMatch) {
			showNotification('No matches');
			return;
		}
		vscode.postMessage({
			type: 'toggleDone',
			value: firstMatch.lineNumber
		});
	}
})

window.addEventListener('click', event => {
	const target = event.target;
	if (target instanceof HTMLElement) {
		const closestTask = target.closest('.list-item');
		if (closestTask) {
			const lineNumber = Number(closestTask.attributes['data-id'].value);
			if (target.classList.contains('checkbox')) {
				vscode.postMessage({
					type: 'toggleDone',
					value: lineNumber,
				});
			} else if (event.altKey) {
				vscode.postMessage({
					type: 'goToTask',
					value: lineNumber,
				})
			}
		}
	}
});

function showNotification(text: string) {
	vscode.postMessage({
		type: 'showNotification',
		value: text,
	});
}
function updateTasks() {
	const list = document.querySelector('.list') as HTMLElement;
	list.textContent = '';

	let filteredTasks = state.tasks;
	if (filterInputEl.value !== '') {
		const filterValueLowercase = filterInputEl.value.toLowerCase();
		filteredTasks = filteredTasks.filter(task => task.rawText.toLowerCase().includes(filterValueLowercase));
	}
	if (!state.config.showCompleted) {
		filteredTasks = filteredTasks.filter(task => !task.done);
	}
	const sortedTasks = defaultSortTasks(filteredTasks);
	for (const task of sortedTasks) {
		list.appendChild(renderTask(task));
	}
	filteredTasksGlobal = sortedTasks;
}

function renderTask(task: TheTask): HTMLElement {
	const taskListItem = document.createElement('div');
	taskListItem.classList.add('list-item');
	taskListItem.dataset.id = String(task.lineNumber);
	if (task.priority) {
		switch (task.priority) {
			case 'A': taskListItem.classList.add('pri1'); break;
			case 'B': taskListItem.classList.add('pri2'); break;
			case 'C': taskListItem.classList.add('pri3'); break;
			case 'D': taskListItem.classList.add('pri4'); break;
			case 'E': taskListItem.classList.add('pri5'); break;
			case 'F': taskListItem.classList.add('pri6'); break;
		}
	}
	const checkbox = document.createElement('input');
	checkbox.classList.add('checkbox');
	checkbox.type = 'checkbox';
	if (task.done) {
		checkbox.checked = true;
	}
	taskListItem.appendChild(checkbox);
	const title = document.createElement('span');
	let titleText = task.title;
	const linkElements = [];
	if (task.links.length) {
		for (const link of task.links) {
			const linkEl = document.createElement('a');
			linkEl.href = link.value;
			linkEl.text = ` ${link.value} `;
			linkElements.push(linkEl);
			titleText = titleText.slice(0, link.characterRange[0]) + titleText.slice(link.characterRange[1]);// TODO: fails to parse when special things are present such as priority (A) resulting in wrong substring
		}
	}
	title.textContent = titleText;
	taskListItem.appendChild(title);
	for (const linkEl of linkElements) {
		taskListItem.appendChild(linkEl);
	}
	if (task.tags.length) {
		for (const tag of task.tags) {
			const tagEl = document.createElement('span');
			tagEl.classList.add('tag');
			tagEl.textContent = tag;
			taskListItem.appendChild(tagEl);
		}
	}
	if (task.projects.length) {
		for (const project of task.projects) {
			const projectEl = document.createElement('span');
			projectEl.classList.add('project');
			projectEl.textContent = project;
			taskListItem.appendChild(projectEl);
		}
	}
	if (task.specialTags.count) {
		const countEl = document.createElement('span');
		countEl.classList.add('count');
		countEl.textContent = `${task.specialTags.count.current} / ${task.specialTags.count.needed}`;
		taskListItem.appendChild(countEl);
	}
	return taskListItem;
}
// Handle messages sent from the extension to the webview
window.addEventListener('message', event => {
	const message: WebviewMessage = event.data; // The json data that the extension sent
	switch (message.type) {
		case 'updateTasks': {
			state.tasks = message.value;
			updateTasks();
			break;
		}
		case 'updateConfig': {
			state.config = message.value;
			break;
		}
	}
});
