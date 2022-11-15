<template>
<div>
    <div>
        <Suggest ref="suggest"
                 :value="storeStore.filterInputValue"
                 :suggestItems="storeStore.suggestItems"
                 :autoshow="storeStore.config.webview.autoShowSuggest"
                 @input="onInput"
                 @keydownDown="onDown"
                 @keydownUp="onUp" />
    </div>
    <div v-if="storeStore.filteredSortedTasks.tasks && storeStore.filteredSortedTasks.tasks.length"
         class="task-list"
         :class="{ 'task-list--details-visible': taskDetailsVisible }"
         @scroll.passive="onTaskListScroll">
        <Task v-for="task of storeStore.filteredSortedTasks.tasks"
              :key="task.lineNumber + task.rawText"
              :model="task" />
    </div>

    <TaskDetails v-show="taskDetailsVisible"
                 ref="taskDetails" />

    <div v-if="!storeStore.defaultFileSpecified && !storeStore.activeDocumentOpened"
         class="welcome">
        <p class="welcome__text">Default file path (<code>todomd.defaultFile</code> setting) is not set.</p>
        <div><a class="btn btn--welcome"
                href="command:todomd.showDefaultFileSetting">Specify Default File Path</a></div>
    </div>

    <notifications position="bottom right"
                   group="group1" />

    <div ref="taskContextMenu"
         hidden
         class="context-menu">
        <li title="Start time tracking.">
            <a href="#"
               @click="startTask"><span class="icon codicon codicon-play-circle"></span>Start</a>
        </li>
        <li title="Show task in the file.">
            <a href="#"
               @click="revealTask"><span class="icon codicon codicon-go-to-file"></span>Reveal</a>
        </li>
        <li title="Toggle task favorite status.">
            <a href="#"
               @click="toggleFavorite"><span class="icon codicon codicon-heart"></span>Toggle Favorite</a>
        </li>
        <li title="Hide or show task (hidden special tag).">
            <a href="#"
               @click="toggleHidden"><span class="icon codicon codicon-eye-closed"></span>Toggle Hidden status</a>
        </li>
        <li title="Open helper Quick Pick to choose the due date.">
            <a href="#"
               @click="setDueDate"><span class="icon codicon codicon-milestone"></span>Set due date</a>
        </li>
        <li title="Open delete task dialog.">
            <a href="#"
               @click="deleteTask"><span class="icon codicon codicon-trash"></span>Delete</a>
        </li>
    </div>
</div>
</template>

<script lang="ts" src="./App.ts"></script>