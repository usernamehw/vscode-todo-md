<template>
<div>
    <div class="list-item"
         :class="classes"
         @click.alt="revealTask">
        <span v-if="model.subtasks.length"
              class="twistie codicon"
              :class="[model.collapseRange ? 'codicon-chevron-right' : 'codicon-chevron-down']"
              @click="toggleTaskCollapse"></span>
        <input type="checkbox"
               :checked="model.done"
               aria-label="Task completion status"
               class="checkbox"
               :class="[config.customCheckboxEnabled ? 'custom-checkbox ' + config.checkboxStyle : 'native-checkbox']"
               @change="toggleDone"><!--
        --><template v-if="config.markdownEnabled">
            <span class="title"
                  v-html="taskTitle"></span>
        </template><!--
        --><template v-else>
            <span class="title">{{ taskTitle }}</span>
        </template><!--
        --><template v-for="tag of model.tags">
            <span :key="tag"
                  class="tag"
                  :style="styleForTag(tag)"
                  @click.exact="updateFilterValue('#' + tag)"
				  @click.ctrl="updateFilterValue('#' + tag, true)">{{ tag }}</span>
        </template><!--
        --><template v-for="project of model.projects">
            <span :key="project"
                  class="project"
                  @click.exact="updateFilterValue('+' + project)"
                  @click.ctrl="updateFilterValue('+' + project, true)">{{ project }}</span>
        </template><!--
        --><template v-for="context of model.contexts">
            <span :key="context"
                  class="context"
                  @click.exact="updateFilterValue('@' + context)"
                  @click.ctrl="updateFilterValue('@' + context, true)">{{ context }}</span>
        </template><!--
        --><span v-if="model.specialTags.count"
              class="count-container">
            <button class="decrement-count"
                    @click="decrementCount">-</button>
            <span class="count">{{ model.specialTags.count.current }} / {{ model.specialTags.count.needed }}</span>
            <button class="increment-count"
                    @click="incrementCount">+</button>
        </span><!--
        --><template v-if="!config.markdownEnabled">
            <template v-for="link of model.links">
                <a :href="link.value"
                   :title="link.value">{{ link.value }}</a>
            </template>
        </template>
    </div>
    <div v-if="model.subtasks.length && !model.collapseRange">
        <task v-for="model in model.subtasks"
              :key="model.lineNumber"
              :model="model" />
    </div>
</div>
</template>

<script lang="ts" src="./Task.ts"></script>