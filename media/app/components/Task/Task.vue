<template>
<div>
    <div :id="'ln' + model.lineNumber"
         class="task"
         :class="classes"
         :style="style"
         @click.alt="revealTask"
         @click.exact="selectThisTask"
         @contextmenu.prevent.stop="openTaskContextMenu($event, model)">
        <template v-if="dueDate">
            <span v-html="dueDate"></span>
        </template>
        <template v-if="model.favorite">
            <span title="Favorite task."
                  class="task__favorite codicon codicon-heart"></span>
        </template>
        <span v-if="model.subtasks.length"
              class="task__twistie codicon"
              :class="[model.collapseRange ? 'codicon-chevron-right' : 'codicon-chevron-down']"
              @click.stop.exact="toggleTaskCollapse"
              @click.alt.stop="toggleTaskCollapseRecursive"></span><!--
    --><input v-if="mainStore.config.webview.showCheckbox"
               type="checkbox"
               :checked="model.done"
               aria-label="Task completion status"
               class="checkbox"
               :class="[mainStore.config.webview.customCheckboxEnabled ? 'checkbox--custom' : 'checkbox--native']"
               @click.stop
               @change="toggleDone"><!--
        --><template v-if="nestedCount && mainStore.config.webview.showNestedTaskCount">
            <span class="task__nested-count"
                  v-html="nestedCount"></span>
        </template><template v-if="duration">
            <span class="task__duration"
                  title="Duration (time since started)"><span class="icon codicon codicon-watch"></span> {{ duration }}</span>
            </template>
        <TaskTitle :stuff="model.title" /><!--
        --><span v-if="model.count"
                 class="task__count-container">
            <button class="task__decrement-count"
                    title="Decrement count."
                    @click.stop="decrementCount">-</button>
            <span class="task__count">{{ model.count.current }} / {{ model.count.needed }}</span>
            <button class="task__increment-count"
                    title="Increment count."
                    @click.stop="incrementCount">+</button>
        </span>
    </div>
    <div v-if="model.subtasks.length && !model.collapseRange">
        <Task v-for="subtask in model.subtasks"
              :key="subtask.lineNumber + subtask.rawText"
              :model="subtask" />
    </div>
</div>
</template>

<script lang="ts" src="./Task.ts"></script>