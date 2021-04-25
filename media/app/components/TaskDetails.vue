<template>
<div class="task-details">
    <textarea ref="detailsTaskTitle"
              rows="1"
              class="task-title"
              @input="onTaskTitleChange">{{ inputValue }}</textarea>
</div>
</template>

<script lang="ts" src="./TaskDetails.ts"></script>