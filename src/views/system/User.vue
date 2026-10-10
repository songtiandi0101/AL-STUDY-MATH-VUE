<template>
  <div class="user-container">
    <el-card>
      <!-- 查询区域 -->
      <el-form :model="queryForm" inline>
        <el-form-item label="用户名">
          <el-input v-model="queryForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadUserList">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin:15px 0;">
        <el-button type="primary" @click="openAddDialog">新增用户</el-button>
      </div>
      <!-- 表格 -->
      <el-table :data="tableData" border stripe>
        <el-table-column prop="username" label="用户名"></el-table-column>
        <el-table-column prop="nickName" label="昵称"></el-table-column>
        <el-table-column prop="phone" label="手机号"></el-table-column>
        <el-table-column prop="email" label="邮箱"></el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页组件 -->
      <el-pagination
        style="margin-top:16px;text-align:right"
        v-model:current-page="queryForm.pageNum"
        v-model:page-size="queryForm.pageSize"
        :total="total"
        :page-sizes="[5,10,20,50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadUserList"
        @current-change="loadUserList"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" title="用户信息">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username"></el-input>
        </el-form-item>
        <!-- 密码框：新增、编辑都显示，编辑留空则不修改密码 -->
        <el-form-item label="密码" prop="password">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model="formData.nickName"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email"></el-input>
        </el-form-item>

        <!-- ⭐ 新增：角色选择（多选） -->
        <el-form-item label="角色" prop="roleIds">
          <el-select
            v-model="formData.roleIds"
            multiple
            placeholder="请选择角色"
            style="width:100%"
          >
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.roleName"
              :value="role.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserListApi, addUserApi, getUserByIdApi, updateUserApi, deleteUserApi } from '@/api/user/user'
// ⭐ 新增：引入查询所有角色的接口
import { getAllRoleApi } from '@/api/role/role'

// 查询条件增加分页参数 pageNum pageSize
const queryForm = reactive({
  username: '',
  pageNum: 1,
  pageSize: 10
})
const tableData = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const formRef = ref(null)

const formData = reactive({
  id: null,
  username: '',
  password: '',
  nickName: '',
  phone: '',
  email: '',
  status: 1,
  roleIds: []   // ⭐ 新增：角色ID数组
})

// ⭐ 新增：角色下拉列表
const roleList = ref([])

const formRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    {
      validator: (rule, value, callback) => {
        if (formData.id === null) {
          if (!value) {
            callback(new Error('请输入密码'))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  nickName: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
})

// 加载列表
const loadUserList = async () => {
  const res = await getUserListApi(queryForm)
  tableData.value = res.records
  total.value = res.total
}

// ⭐ 新增：加载所有角色
const loadRoleList = async () => {
  try {
    const res = await getAllRoleApi()
    roleList.value = res || []
  } catch (err) {
    console.error('加载角色列表失败', err)
  }
}

// 重置查询
const resetQuery = () => {
  queryForm.username = ''
  queryForm.pageNum = 1
  loadUserList()
}

// 打开新增弹窗
const openAddDialog = () => {
  dialogVisible.value = true
  formData.id = null
  formData.username = ''
  formData.password = ''
  formData.nickName = ''
  formData.phone = ''
  formData.email = ''
  formData.status = 1
  formData.roleIds = []   // ⭐ 新增：清空角色
  formRef.value?.clearValidate()
}

// 打开编辑弹窗
const openEditDialog = async (row) => {
  dialogVisible.value = true
  const res = await getUserByIdApi(row.id)
  Object.assign(formData, res)
  formData.password = ''
  // ⭐ 新增：roleIds 兜底，防止后端没返回导致 el-select 报错
  if (!formData.roleIds) formData.roleIds = []
  formRef.value?.clearValidate()
}

// 删除
const handleDelete = async (row) => {
  await ElMessageBox.confirm(
    '确定要删除该用户吗？删除后不可恢复！',
    '删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      customStyle: {
        marginTop: '-15vh'
      }
    }
  ).then(async () => {
    await deleteUserApi(row.id)
    ElMessage.success({ message: '删除成功', offset: 20 })
    loadUserList()
  }).catch(() => {
    ElMessage.info({ message: '已取消删除', offset: 20 })
  })
}

// 表单提交
const submitForm = () => {
  formRef.value.validate((valid) => {
    if (!valid) return
    doSubmit()
  })
}

// 真正接口请求
const doSubmit = async () => {
  try {
    let res
    if (formData.id) {
      res = await updateUserApi(formData)
      if (res === 'success') {
        ElMessage.success({ message: '修改成功', offset: 20 })
        dialogVisible.value = false
        loadUserList()
      } else {
        ElMessage.error({ message: res, offset: 20 })
      }
    } else {
      res = await addUserApi(formData)
      if (res === 'success') {
        ElMessage.success({ message: '新增成功', offset: 20 })
        dialogVisible.value = false
        loadUserList()
      } else {
        ElMessage.error({ message: res, offset: 20 })
      }
    }
  } catch (err) {
    ElMessage.error({ message: '操作失败，请重试', offset: 20 })
  }
}

onMounted(() => {
  loadUserList()
  loadRoleList()   // ⭐ 新增：加载角色列表
})
</script>

<style scoped>
.user-container {
  padding: 20px;
}
</style>