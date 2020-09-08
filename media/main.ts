/* eslint-disable no-undef */
// TODO: reuse sorting functions from the extension
// TODO: toggle done should be used from the extension

import type { TheTask } from '../src/parse';
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

const filterInputEl = document.getElementById('filterInput') as HTMLInputElement;

filterInputEl.addEventListener('input', e => {
	updateTasks();
});

window.addEventListener('click', event => {
	const target = event.target;
	if (target instanceof HTMLElement) {
		const closestTask = target.closest('.list-item');
		if (closestTask) {
			const lineNumber = closestTask.attributes['data-id'].value;
			if (target.classList.contains('checkbox')) {
				vscode.postMessage({
					type: 'toggleDone',
					value: Number(lineNumber),
				});
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
	const elements = [];

	let filteredTasks = state.tasks;
	if (filterInputEl.value !== '') {
		const filterValueLowercase = filterInputEl.value.toLowerCase();
		filteredTasks = filteredTasks.filter(task => task.rawText.toLowerCase().includes(filterValueLowercase));
	}
	if (!state.config.showCompleted) {
		filteredTasks = filteredTasks.filter(task => !task.done);
	}
	const dueTasks = filteredTasks.filter(task => task.due?.isDue === 1 || task.due?.isDue === 2);
	const notDueTasks = filteredTasks.filter(task => task.due?.isDue !== 1 && task.due?.isDue !== 2);
	for (const task of dueTasks) {
		elements.push(renderTask(task));
	}
	for (const task of notDueTasks) {
		elements.push(renderTask(task));
	}
	list.textContent = '';
	for (const element of elements) {
		list.appendChild(element);
	}
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
	title.textContent = task.title;
	taskListItem.appendChild(title);
	if (task.specialTags.link) {
		const link = document.createElement('a');
		link.href = task.specialTags.link;
		link.text = ` ${task.specialTags.link}`;
		taskListItem.appendChild(link);
	}
	if (task.tags.length) {
		for (const tag of task.tags) {
			const tagElement = document.createElement('span');
			tagElement.classList.add('tag');
			tagElement.textContent = tag;
			taskListItem.appendChild(tagElement);
		}
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
