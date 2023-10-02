<template>
<div class="details">
    <textarea ref="detailsTaskTitle"
              rows="1"
              class="details__input"
              :value="inputValue"
              @input="onTaskTitleChange"></textarea>
</div>
</template>

<script lang="ts" src="./TaskDetails.ts"></script>