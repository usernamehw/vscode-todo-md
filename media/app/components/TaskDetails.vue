<template>
<div class="task-details">
    <textarea ref="detailsTaskTitle"
              class="task-title"
              @input="onTaskTitleChange">{{ selectedTaskForDetails.title }}</textarea>
</div>
</template>

<script lang="ts" src="./TaskDetails.ts"></script>