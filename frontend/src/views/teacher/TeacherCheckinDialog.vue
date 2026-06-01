<template>
  <el-dialog :model-value="modelValue" title="打卡消课" width="560px" @update:model-value="$emit('update:modelValue', $event)">
    <el-form :model="form" label-position="top">
      <el-form-item label="消课课时">
        <el-input-number v-model="form.lesson_hours" :min="0.5" :step="0.5" />
      </el-form-item>
      <el-form-item label="课堂反馈">
        <el-input v-model="form.feedback" placeholder="填写本次学习情况" type="textarea" />
      </el-form-item>
      <el-form-item label="错题/备注">
        <el-input v-model="form.wrong_notes" placeholder="填写错题、薄弱点或课后任务" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="$emit('confirm')">确认消课</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  form: {
    type: Object,
    required: true,
  },
});

defineEmits(["update:modelValue", "confirm"]);
</script>
