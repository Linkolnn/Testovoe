<template>
  <div id="app">
    <AccountManagement />
  </div>
</template>

<script setup lang="ts">
import AccountManagement from '@components/AcccountManagment.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
}
</style>