<template>
  <section class="stack admin-page">
    <el-card shadow="never" class="feature-guide">
      <el-button
        v-for="item in navItems"
        :key="item.name"
        :type="route.name === item.name ? 'primary' : 'default'"
        plain
        @click="router.push({ name: item.name })"
      >
        {{ item.label }}
      </el-button>
    </el-card>

    <router-view :state="state" @state-updated="forwardState" />
  </section>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";

defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["state-updated"]);
const route = useRoute();
const router = useRouter();

const navItems = [
  { name: "admin-overview", label: "后台概览" },
  { name: "admin-users", label: "信息管理" },
  { name: "admin-schedule", label: "课程编排" },
  { name: "admin-permissions", label: "管理员权限" },
];

function forwardState(payload) {
  emit("state-updated", payload);
}
</script>
