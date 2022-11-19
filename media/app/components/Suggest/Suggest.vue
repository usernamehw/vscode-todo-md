<template>
<div id="suggest-container"
     class="suggest-container">
    <div class="suggest">
        <input ref="input"
               class="suggest__input"
               :value="value"
               @input="onInput($event)"
               @keydown.down="onKeydownDown"
               @keydown.up="onKeydownUp"
               @keydown.enter="acceptActiveSuggest"
               @keydown.tab="acceptActiveSuggest"
               @keydown.esc="hide"
               @keydown.ctrl.space="show">
        <div v-if="suggestItemsVisible"
             class="suggest__autocomplete-container">
            <div v-for="(suggestItem, index) of filteredSuggestItems"
                 :id="'index' + String(index)"
                 :key="suggestItem + String(Math.random())"
                 class="suggest__autocomplete-item"
                 :class="{'suggest__autocomplete-item--active': index === activeIndex}"
                 @click="selectItemAtIndex(index);acceptActiveSuggest()"
                 v-html="fuzzyHighlight(suggestItem)"></div>
        </div>
    </div>
</div>
</template>

<script lang="ts" src="./Suggest.ts"></script>