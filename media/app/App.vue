<template>
<div>
    <div v-if="!storeStore.defaultFileSpecified && !storeStore.activeDocumentOpened"
         class="welcome">
        <p class="welcome__text">
            Open a file that matches <b><code>"todomd.activatePattern"</code></b> (<code>{{ storeStore.config.activatePattern }}</code>) or set default file path <b><code>"todomd.defaultFile"</code></b>.
        </p>
        <div><a class="btn btn--welcome"
                href="command:todomd.specifyDefaultFile">Specify Default File Path</a></div>
    </div>

    <div v-else>
        <header>
            <Suggest ref="suggest"
                     :value="storeStore.filterInputValue"
                     :suggestItems="storeStore.suggestItems"
                     :autoshow="storeStore.config.webview.autoShowSuggest"
                     @input="onInput"
                     @keydownDown="onDown"
                     @keydownUp="onUp" />
        </header>
        <div v-if="storeStore.filteredSortedTasks.tasks && storeStore.filteredSortedTasks.tasks.length"
             ref="taskList"
             class="task-list"
             :class="{ 'task-list--details-visible': taskDetailsVisible }"
             @scroll.passive="onTaskListScroll">
            <Task v-for="task of storeStore.filteredSortedTasks.tasks"
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
        <h3>New task {{ newTaskAt === 'subtask' ? 'as a subtask' : 'at root' }}.</h3>
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
             @click="storeStore.updateSortProperty('Default');hidePickSortModal();">Default</div>
        <div class="pick-sort__item"
             @click="storeStore.updateSortProperty('priority');hidePickSortModal();">Priority</div>
        <div class="pick-sort__item"
             @click="storeStore.updateSortProperty('project');hidePickSortModal();">Project</div>
        <div class="pick-sort__item"
             @click="storeStore.updateSortProperty('tag');hidePickSortModal();">Tag</div>
        <div class="pick-sort__item"
             @click="storeStore.updateSortProperty('context');hidePickSortModal();">Context</div>
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