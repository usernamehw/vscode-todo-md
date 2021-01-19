<template>
<div>
    <div :id="'ln' + model.lineNumber"
         class="list-item"
         :class="classes"
         @click.alt="revealTask"
         @click.self.exact="selectThisTask"
         @contextmenu.prevent.stop="openTaskContextMenu($event, model)">
        <span v-if="model.subtasks.length"
              class="twistie codicon"
              :class="[model.collapseRange ? 'codicon-chevron-right' : 'codicon-chevron-down']"
              @click="toggleTaskCollapse"></span><!--
    --><input type="checkbox"
               :checked="model.done"
               aria-label="Task completion status"
               class="checkbox"
               :class="[config.customCheckboxEnabled ? 'custom-checkbox ' + config.checkboxStyle : 'native-checkbox']"
               @change="toggleDone"><!--
        --><span class="title"
                  v-html="taskTitle"></span><!--
        --><template v-for="tag of model.tags">
            <span class="tag"
                  :style="styleForTag(tag)"
                  @click.exact="updateFilterValue('#' + tag)"
				  @click.ctrl="updateFilterValue('#' + tag, true)">{{ tag }}</span>
        </template><!--
        --><template v-for="project of model.projects">
            <span class="project"
                  @click.exact="updateFilterValue('+' + project)"
                  @click.ctrl="updateFilterValue('+' + project, true)">{{ project }}</span>
        </template><!--
        --><template v-for="context of model.contexts">
            <span class="context"
                  @click.exact="updateFilterValue('@' + context)"
                  @click.ctrl="updateFilterValue('@' + context, true)">{{ context }}</span>
        </template><!--
        --><span v-if="model.count"
              class="count-container">
            <button class="decrement-count"
                    @click="decrementCount">-</button>
            <span class="count">{{ model.count.current }} / {{ model.count.needed }}</span>
            <button class="increment-count"
                    @click="incrementCount">+</button>
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