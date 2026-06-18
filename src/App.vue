<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <router-view />
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
</script>
