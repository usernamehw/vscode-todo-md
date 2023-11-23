import { marked } from 'marked';
import { mapStores } from 'pinia';
import { defineComponent, h, VNodeArrayChildren } from 'vue';
import { useMainStore } from '../../store';

export default defineComponent({
	name: 'TaskTitle',
	props: {
		stuff: {
			required: true,
			default: '',
			type: String,
		},
	},
	data: () => ({}),
	computed: {
		...mapStores(useMainStore),
	},
	methods: {
		updateFilterValue(e: MouseEvent) {
			const newValue: string | undefined = (e.target as HTMLElement)?.innerText;
			if (!newValue) {
				return;
			}
			if (e.ctrlKey) {
				this.mainStore.updateFilterValue(newValue, true);
			} else {
				this.mainStore.updateFilterValue(newValue);
			}
			this.mainStore.focusFilterInput();
		},
		styleForTag(tag: string) {
			if (tag in this.mainStore.config.webview.tagStyles) {
				return this.mainStore.config.webview.tagStyles[tag];
			}
			return undefined;
		},
	},
	render() {
		const returnEl = h('span', {
			class: 'task__title',
		}, []);
		const words = this.stuff.split(' ');
		const currentWords = [];

		const updateFilterValue = this.updateFilterValue;

		for (const word of words) {
			if (
				word.length > 1 &&
				(word[0] === '#' || word[0] === '+' || word[0] === '@')
			) {
				const currentWordsAsText = `${currentWords.join(' ')} `;
				currentWords.length = 0;
				(returnEl.children as VNodeArrayChildren)?.push(h('span', {
					innerHTML: marked(currentWordsAsText),
				}));

				let style;
				if (word[0] === '#') {
					style = this.styleForTag(word.slice(1));
				}

				(returnEl.children as VNodeArrayChildren)?.push(h('span', {
					class: word[0] === '#' ? 'task__tag' : word[0] === '+' ? 'task__project' : 'task__context',
					style,
					innerText: word,
					onClick(event: MouseEvent) {
						updateFilterValue(event);
					},
				}));

				(returnEl.children as VNodeArrayChildren)?.push(h('span', ' '));
			} else {
				currentWords.push(word);
			}
		}

		const currentWordsAsText = currentWords.join(' ');

		(returnEl.children as VNodeArrayChildren)?.push(h('span', {
			innerHTML: marked(currentWordsAsText),
		}));

		return returnEl;
	},
});
