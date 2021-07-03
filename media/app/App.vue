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
         :class="{'task-list--details-visible': taskDetailsVisible}"
         @scroll.passive="onTaskListScroll">
        <task v-for="task in filteredSortedTasks"
              :key="task.lineNumber + task.rawText"
              :model="task" />
    </div>
    <div v-if="!defaultFileSpecified && !activeDocumentOpened"
         class="welcome">
        <p class="welcome__text">Default file path is not specified.</p>
        <div><a class="btn btn--welcome"
                href="command:todomd.showDefaultFileSetting">Specify Default File</a></div>
    </div>

    <TaskDetails v-if="taskDetailsVisible"
                 ref="taskDetails" />

    <notifications position="bottom right" />

    <vue-context ref="taskContextMenu"
                 :closeOnScroll="false">
        <li title="Start time tracking.">
            <a href="#"
               @click="startTask"><span class="icon codicon codicon-play-circle"></span>Start</a>
        </li>
        <li title="Show task in the file.">
            <a href="#"
               @click="revealTask"><span class="icon codicon codicon-go-to-file"></span>Reveal</a>
        </li>
        <li title="Open helper Quick Pick to choose the due date.">
            <a href="#"
               @click="setDueDate"><span class="icon codicon codicon-milestone"></span>Set due date</a>
        </li>
        <li title="Open delete task dialog.">
            <a href="#"
               @click="deleteTask"><span class="icon codicon codicon-trash"></span>Delete</a>
        </li>
    </vue-context>
</div>
</template>

<script lang="ts" src="./App.ts"></script>