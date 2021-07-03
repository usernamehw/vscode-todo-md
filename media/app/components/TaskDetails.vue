<template>
<div class="details">
    <textarea ref="detailsTaskTitle"
              rows="1"
              class="details__input"
              @input="onTaskTitleChange">{{ inputValue }}</textarea>
</div>
</template>

<script lang="ts" src="./TaskDetails.ts"></script>