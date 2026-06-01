<template>
  <el-tag :type="status === '已消课' ? 'success' : 'warning'" effect="light">
    {{ status }}
  </el-tag>
</template>

<script setup>
defineProps({
  status: {
    type: String,
    required: true,
  },
});
</script>
