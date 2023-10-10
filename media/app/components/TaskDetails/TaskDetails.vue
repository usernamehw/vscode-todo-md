<template>
<div class="details">
    <header class="details__header">Edit task as raw text:</header>
    <textarea ref="detailsTaskTitle"
              rows="1"
              class="details__input"
              :value="inputValue"
              @input="onTaskTitleChange"></textarea>
</div>
</template>

<script lang="ts" src="./TaskDetails.ts"></script>