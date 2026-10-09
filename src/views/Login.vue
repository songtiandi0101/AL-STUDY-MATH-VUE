<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 style="text-align:center">系统登录</h2>
      <el-form ref="loginFormRef" :model="loginForm" label-width="80px">
        <el-form-item label="账号">
          <el-input v-model="loginForm.username"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" style="width:100%">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// 修改导入路径，用@
import { loginApi } from '@/api/user/user'
const router = useRouter()
const loginFormRef = ref(null)
const loginForm = ref({
  username: '',
  password: ''
})
// 登录提交函数
const handleLogin = async () => {
  try {
    const res = await loginApi(loginForm.value)
    if (res.code === 200) {
      localStorage.setItem('token', res.data.token)
      // 新增：存储角色ID，Layout动态菜单读取用
      localStorage.setItem('roleId', res.data.roleId)
      alert('登录成功！')
      // 跳转到首页Layout
      router.push('/home')
    } else {
      alert(res.msg || '账号或密码错误')
    }
  } catch (error) {
    console.log(error)
    alert('请求后端失败，请确认SpringBoot已经启动！')
  }
}
</script>
<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
}
.login-card {
  width: 380px;
}
</style>
