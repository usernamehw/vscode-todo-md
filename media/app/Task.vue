<template>
<div>
    <div :id="'ln' + model.lineNumber"
         class="task"
         :class="classes"
         @click.alt="revealTask"
         @click.exact="selectThisTask"
         @contextmenu.prevent.stop="openTaskContextMenu($event, model)">
        <template v-if="dueDate">
            <span v-html="dueDate"></span>
        </template>
        <span v-if="model.subtasks.length"
              class="task__twistie codicon"
              :class="[model.collapseRange ? 'codicon-chevron-right' : 'codicon-chevron-down']"
              @click.stop.exact="toggleTaskCollapse"
              @click.alt.stop="toggleTaskCollapseRecursive"></span><!--
    --><input v-if="config.showCheckbox"
               type="checkbox"
               :checked="model.done"
               aria-label="Task completion status"
               class="checkbox"
               :class="[config.customCheckboxEnabled ? 'checkbox--custom' : 'checkbox--native']"
               @click.stop
               @change="toggleDone"><!--
        --><template v-if="nestedCount">
            <span class="task__nested-count"
                  v-html="nestedCount"></span>
        </template><template v-if="duration">
            <span class="task__duration"
                  title="Duration (time since started)"><span class="icon codicon codicon-watch"></span> {{ duration }}</span>
            </template><span class="task__title"
                  v-html="taskTitle"></span><!--
        --><template v-for="tag of model.tags">
            <span class="task__tag"
                  :style="styleForTag(tag)"
                  @click.exact.stop="updateFilterValue('#' + tag)"
				  @click.ctrl.stop="updateFilterValue('#' + tag, true)">{{ tag }}</span>
        </template><!--
        --><template v-for="project of model.projects">
            <span class="task__project"
                  @click.exact.stop="updateFilterValue('+' + project)"
                  @click.ctrl.stop="updateFilterValue('+' + project, true)">{{ project }}</span>
        </template><!--
        --><template v-for="context of model.contexts">
            <span class="task__context"
                  @click.exact.stop="updateFilterValue('@' + context)"
                  @click.ctrl.stop="updateFilterValue('@' + context, true)">{{ context }}</span>
        </template><!--
        --><span v-if="model.count"
              class="task__count-container">
            <button class="task__decrement-count"
                    @click.stop="decrementCount">-</button>
            <span class="task__count">{{ model.count.current }} / {{ model.count.needed }}</span>
            <button class="task__increment-count"
                    @click.stop="incrementCount">+</button>
        </span>
    </div>
    <div v-if="model.subtasks.length && !model.collapseRange">
        <task v-for="model in model.subtasks"
              :key="model.lineNumber + model.rawText"
              :model="model" />
    </div>
</div>
</template>

<script lang="ts" src="./Task.ts"></script>