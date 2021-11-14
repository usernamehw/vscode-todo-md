import { marked } from 'marked';
import Vue, { CreateElement } from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { mapState } from 'vuex';
import { ExtensionConfig } from '../../../src/types';
import { updateFilterValueMutation } from '../store';
import { VueEvents } from '../webviewTypes';

@Component({
	computed: {
		...mapState(['config', 'filterInputValue']),
	},
})
export default class TaskTitle extends Vue {
	@Prop(String) readonly stuff!: string;

	config!: ExtensionConfig['webview'];
	filterInputValue!: string;

	// ──────────────────────────────────────────────────────────────────────
	updateFilterValue(e: MouseEvent) {
		// @ts-ignore
		const newValue: string | undefined = e.target?.innerText;
		if (!newValue) {
			return;
		}
		if (e.ctrlKey) {
			updateFilterValueMutation(`${this.filterInputValue} ${newValue}`);
		} else {
			updateFilterValueMutation(newValue);
		}
		this.$root.$emit(VueEvents.focusFilterInput);
	}

	render(h: CreateElement) {
		const returnEl = h('span', {}, []);
		const words = this.stuff.split(' ');

		const currentWords = [];

		for (const word of words) {
			if (
				word.length > 1 &&
				(word[0] === '#' || word[0] === '+' || word[0] === '@')
			) {
				const currentWordsAsText = `${currentWords.join(' ')} `;
				currentWords.length = 0;
				returnEl.children?.push(h('span', {
					domProps: {
						innerHTML: marked(currentWordsAsText),
					},
				}));

				returnEl.children?.push(h('span', {
					class: word[0] === '#' ? 'task__tag' : word[0] === '+' ? 'task__project' : 'task__context',
					domProps: {
						innerText: word,
					},
					on: {
						click: this.updateFilterValue,
					},
				}));

				returnEl.children?.push(h('span', ' '));
			} else {
				currentWords.push(word);
			}
		}

		const currentWordsAsText = currentWords.join(' ');

		returnEl.children?.push(h('span', {
			domProps: {
				innerHTML: marked(currentWordsAsText),
			},
		}));

		return returnEl;
	}
}
