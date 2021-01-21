<template>
<div>
    <vue-autosuggest
        ref="autosuggest"
        :value="filterInputValue"
        :suggestions="filteredSuggestions"
        :inputProps="{id:'autosuggest__input'}"
        :shouldRenderSuggestions="(size, loading) => (size >= 0 && !loading) && config.autoShowSuggest && !shouldHideSuggest"
        @input="onFilterChangeDebounced"
        @selected="onSelected"
        @keydown.tab="tabHandler"
        @keydown.ctrl.space="openSuggest"
        @keydown.down="downHandler"
        @keydown.up="upHandler"
        @closed="onClosedSuggest"
        @opened="onOpenedSuggest">
        <div slot-scope="{suggestion}">
            <div v-html="fuzzyHighlight(suggestion.item)"></div>
        </div>
    </vue-autosuggest>
    <div v-if="filteredSortedTasks && filteredSortedTasks.length"
         class="task-list"
         @scroll.passive="onTaskListScroll">
        <task v-for="task in filteredSortedTasks"
              :key="task.lineNumber + task.rawText"
              :model="task" />
    </div>
    <div v-if="!defaultFileSpecified && !activeDocumentOpened">
        <p class="welcome-text">Default file path is not specified.</p>
        <div class="welcome"><a class="btn btn-welcome"
                                href="command:todomd.specifyDefaultFile">Specify Default File</a></div>
    </div>
    <notifications position="bottom right" />
    <vue-context ref="taskContextMenu"
                 :closeOnScroll="false">
        <li>
            <a href="#"
               @click="deleteTask">Delete</a>
        </li>
        <!-- <div class="codicon codicon-trash"></div> -->
    </vue-context>
</div>
</template>

<script lang="ts" src="./App.ts"></script>