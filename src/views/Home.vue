<template>
  <el-card>
    <h2>首页</h2>
    <el-button type="primary" @click="logout">退出登录</el-button>
  </el-card>
</template>
<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>
