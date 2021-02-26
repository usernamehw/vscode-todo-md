<template>
<div>
    <div :id="'ln' + model.lineNumber"
         class="list-item"
         :class="classes"
         @click.alt="revealTask"
         @click.exact="selectThisTask"
         @contextmenu.prevent.stop="openTaskContextMenu($event, model)">
        <span v-if="model.subtasks.length"
              class="twistie codicon"
              :class="[model.collapseRange ? 'codicon-chevron-right' : 'codicon-chevron-down']"
              @click.stop="toggleTaskCollapse"></span><!--
    --><input type="checkbox"
               :checked="model.done"
               aria-label="Task completion status"
               class="checkbox"
               :class="[config.customCheckboxEnabled ? 'custom-checkbox ' : 'native-checkbox']"
               @click.stop
               @change="toggleDone"><!--
        --><template v-if="nestedCount">
            <span class="nested-count"
                  v-html="nestedCount"></span>
        </template><span class="title"
                  v-html="taskTitle"></span><!--
        --><template v-for="tag of model.tags">
            <span class="tag"
                  :style="styleForTag(tag)"
                  @click.exact.stop="updateFilterValue('#' + tag)"
				  @click.ctrl.stop="updateFilterValue('#' + tag, true)">{{ tag }}</span>
        </template><!--
        --><template v-for="project of model.projects">
            <span class="project"
                  @click.exact.stop="updateFilterValue('+' + project)"
                  @click.ctrl.stop="updateFilterValue('+' + project, true)">{{ project }}</span>
        </template><!--
        --><template v-for="context of model.contexts">
            <span class="context"
                  @click.exact.stop="updateFilterValue('@' + context)"
                  @click.ctrl.stop="updateFilterValue('@' + context, true)">{{ context }}</span>
        </template><!--
        --><span v-if="model.count"
              class="count-container">
            <button class="decrement-count"
                    @click.stop="decrementCount">-</button>
            <span class="count">{{ model.count.current }} / {{ model.count.needed }}</span>
            <button class="increment-count"
                    @click.stop="incrementCount">+</button>
        </span>
        <template v-if="dueDate">
            <span v-html="dueDate"></span>
        </template>
    </div>
    <div v-if="model.subtasks.length && !model.collapseRange">
        <task v-for="model in model.subtasks"
              :key="model.lineNumber + model.rawText"
              :model="model" />
    </div>
</div>
</template>

<script lang="ts" src="./Task.ts"></script>