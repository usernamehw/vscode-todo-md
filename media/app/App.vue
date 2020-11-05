<template>
<div>
    <vue-autosuggest
        ref="autosuggest"
        v-model="filterInputValue"
        :suggestions="filteredSuggestions"
        :inputProps="{id:'autosuggest__input'}"
        :shouldRenderSuggestions="(size, loading) => (size >= 0 && !loading) && config.autoShowSuggest"
        @input="onFilterInputChange"
        @selected="onSelect"
        @keydown.tab="tabHandler"
        @keydown.ctrl.space="openSuggest"
        @closed="onClosed">
        <div slot-scope="{suggestion}">
            <div v-html="fuzzyHighlight(suggestion.item)"></div>
        </div>
    </vue-autosuggest>
    <div v-if="filteredSortedTasks.length"
         class="task-list">
        <task v-for="task in filteredSortedTasks"
              :key="task.lineNumber"
              :model="task" />
    </div>
    <div v-if="!defaultFileSpecified && !activeDocumentOpened">
        <p class="welcome-text">Default file path is not specified.</p>
        <div class="welcome"><a class="btn btn-welcome"
                                href="command:todomd.specifyDefaultFile">Specify Default File</a></div>
    </div>
</div>
</template>

<script lang="ts" src="./App.ts"></script>