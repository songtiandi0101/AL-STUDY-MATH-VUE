<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 style="text-align:center;">系统登录</h2>
      <el-form ref="loginFormRef" :model="loginForm" label-width="80px">
        <el-form-item label="账号">
          <el-input v-model="loginForm.username"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loginFormRef = ref(null)
const loginForm = ref({
  username: '',
  password: ''
})

const handleLogin = () => {
  if (loginForm.value.username === 'admin' && loginForm.value.password === '123456') {
    localStorage.setItem('token', 'test-token-123')
    router.push('/')
  } else {
    alert('账号或密码错误')
  }
}
</script>

<style scoped>
.login-container {
  /* 占满整个视口高度 */
  height: 100vh;
  width: 100vw;
  background-color: #1f2937;
  /* flex居中 */
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0;
}
.login-card {
  width: 400px;
  padding: 30px;
}
</style>
