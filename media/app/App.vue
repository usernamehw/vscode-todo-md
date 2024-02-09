<template>
<div>
    <div v-if="mainStore.defaultFilePerWorkspace && mainStore.noWorkspaceOpened">
        <p class="welcome__text">
            No workspace.<br>
            Using <code>${workspaceFolder}</code> variable in <b><code>"todomd.defaultFile"</code></b> setting only works when any folder is opened.
        </p>
    </div>

    <div v-else-if="mainStore.defaultFilePerWorkspace && mainStore.defaultFileDoesntExist">
        <p class="welcome__text">
            Default file doesn't exist.
        </p>
        <div><a class="btn btn--welcome"
                :href="'command:todomd.createFile?' + encodeURIComponent(JSON.stringify(mainStore.defaultFileReplacedValue || mainStore.config.defaultFile))"
                title="Create empty file using `todomd.defaultFile` setting value.">Create</a></div>
        <div><a class="btn btn--welcome"
                href="command:workbench.action.openSettings?%22todomd.defaultFile%22"
                title="Open Settings UI and reveal `todomd.defaultFile` setting.">Reveal in Settings</a></div>
    </div>

    <div v-else-if="!mainStore.defaultFileSpecified && !mainStore.activeDocumentOpened"
         class="welcome">
        <p class="welcome__text">
            Open a file that matches <b><code>"todomd.activatePattern"</code></b> (<code>{{ mainStore.config.activatePattern }}</code>) or set default file path <b><code>"todomd.defaultFile"</code></b>.
        </p>
        <div><a class="btn btn--welcome"
                href="command:todomd.specifyDefaultFile"
                title="Pick a file that will be used as `todomd.defaultFile` setting value.">Specify Default File Path</a></div>
        <div><a class="btn btn--welcome"
                href="command:workbench.action.openSettings?%22todomd.defaultFile%22"
                title="Open Settings UI and reveal `todomd.defaultFile` setting.">Reveal in Settings</a></div>
    </div>

    <div v-else>
        <header>
            <Suggest ref="suggest"
                     :value="mainStore.filterInputValue"
                     :suggestItems="mainStore.suggestItems"
                     :autoshow="mainStore.config.webview.autoShowSuggest"
                     @input="onInput"
                     @keydownDown="onDown"
                     @keydownUp="onUp" />
        </header>
        <div v-if="mainStore.isWebviewLoaded && mainStore.tasksAsTree.length === 0 && mainStore.filterInputValue.length === 0"
             class="non-ideal-state">
            No tasks
        </div>
        <div v-else-if="mainStore.isWebviewLoaded && mainStore.tasksAsTree.length && mainStore.filterInputValue !== '' && !mainStore.filteredSortedTasks.tasks.length"
             class="non-ideal-state">
            No matches
        </div>
        <div v-else-if="mainStore.filteredSortedTasks.tasks && mainStore.filteredSortedTasks.tasks.length"
             ref="taskList"
             class="task-list"
             :class="{ 'task-list--details-visible': taskDetailsVisible }"
             @scroll.passive="onTaskListScroll">
            <Task v-for="task of mainStore.filteredSortedTasks.tasks"
                  :key="task.lineNumber + task.rawText"
                  :model="task" />
        </div>
    </div>

    <TaskDetails v-show="taskDetailsVisible"
                 ref="taskDetails" />

    <vue-final-modal v-model="isNewTaskModalVisible"
                     classes="modal-container"
                     contentClass="modal-content"
                     :escToClose="true"
                     :focusRetain="false"
                     @closed="modalClosed">
        <h3 class="new-task__header">New task {{ newTaskAt === 'subtask' ? 'as a subtask' : 'at root' }}</h3>
        <div class="new-task__input-container">
            <input ref="newTaskInput"
                   v-model="newTaskAsText"
                   class="suggest__input"
                   @keyup.enter="addTask">
            <button class="btn"
                    title="Add new task."
                    @click="addTask"><span class="icon codicon codicon-plus new-task__add-codicon"></span></button>
        </div>
        <button class="modal-close"
                title="Close modal dialog."
                @click="hideAddNewTaskModal"><span class="icon codicon codicon-close"></span></button>
    </vue-final-modal>

    <vue-final-modal v-model="isPickSortModalVisible"
                     classes="modal-container"
                     contentClass="modal-content"
                     :escToClose="true"
                     :focusRetain="false"
                     @closed="modalClosed">
        <h3 class="pick-sort__header">Pick sorting for webview:</h3>
        <div class="pick-sort__item"
             @click="mainStore.updateSortProperty('Default');hidePickSortModal();">
            Default
            <template v-if="mainStore.sortProperty === 'Default'">☑️</template>
        </div>
        <div class="pick-sort__item"
             @click="mainStore.updateSortProperty('priority');hidePickSortModal();">
            Priority
            <template v-if="mainStore.sortProperty === 'priority'">☑️</template>
        </div>
        <div class="pick-sort__item"
             @click="mainStore.updateSortProperty('project');hidePickSortModal();">
            Project
            <template v-if="mainStore.sortProperty === 'project'">☑️</template>
        </div>
        <div class="pick-sort__item"
             @click="mainStore.updateSortProperty('tag');hidePickSortModal();">
            Tag
            <template v-if="mainStore.sortProperty === 'tag'">☑️</template>
        </div>
        <div class="pick-sort__item"
             @click="mainStore.updateSortProperty('context');hidePickSortModal();">
            Context
            <template v-if="mainStore.sortProperty === 'context'">☑️</template>
        </div>
        <button class="modal-close"
                title="Close modal dialog."
                @click="hidePickSortModal"><span class="icon codicon codicon-close"></span></button>
    </vue-final-modal>

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