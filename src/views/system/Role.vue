<template>
  <div class="role-container">
    <el-card>
      <!-- 查询区域 -->
      <el-form :model="queryForm" inline>
        <el-form-item label="角色名称">
          <el-input v-model="queryForm.roleName" placeholder="请输入角色名称"></el-input>
        </el-form-item>
        <el-form-item label="角色编码">
          <el-input v-model="queryForm.roleCode" placeholder="请输入角色编码"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRoleList">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin:15px 0;">
        <el-button type="primary" @click="openAddDialog">新增角色</el-button>
      </div>
      <!-- 表格 -->
      <el-table :data="tableData" border stripe>
        <el-table-column prop="roleName" label="角色名称"></el-table-column>
        <el-table-column prop="roleCode" label="角色编码"></el-table-column>
        <el-table-column label="删除标记">
          <template #default="scope">
            <el-tag :type="scope.row.delFlag === 0 ? 'success' : 'danger'">
              {{ scope.row.delFlag === 0 ? '正常' : '已删除' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间"></el-table-column>
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
        @size-change="loadRoleList"
        @current-change="loadRoleList"
      />
    </el-card>
    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" title="角色信息">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="formData.roleName"></el-input>
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="formData.roleCode"></el-input>
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
// 导入role接口（和user.js写法统一）
import { getRoleListApi, addRoleApi, getRoleByIdApi, updateRoleApi, deleteRoleApi } from '@/api/role/role'

// 查询条件：角色名称、角色编码、分页
const queryForm = reactive({
  roleName: '',
  roleCode: '',
  pageNum: 1,
  pageSize: 10
})
const tableData = ref([])
const total = ref(0) // 总条数
const dialogVisible = ref(false)
const formRef = ref(null)
const formData = reactive({
  id: null,
  roleName: '',
  roleCode: '',
  delFlag: 0
})
const formRules = reactive({
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' }
  ]
})

// 加载角色分页列表
const loadRoleList = async () => {
  const res = await getRoleListApi(queryForm)
  // ======重点：如果你的axios自动剥了一层data，就用下面这行======
  // const pageResult = res.data
  // tableData.value = pageResult.records
  // total.value = pageResult.total

  // ======后端直接返回PageResult对象（无外层包装）用这行======
  tableData.value = res.records
  total.value = res.total
}

// 重置查询条件
const resetQuery = () => {
  queryForm.roleName = ''
  queryForm.roleCode = ''
  queryForm.pageNum = 1
  loadRoleList()
}

// 打开新增弹窗
const openAddDialog = () => {
  dialogVisible.value = true
  formData.id = null
  formData.roleName = ''
  formData.roleCode = ''
  formData.delFlag = 0
  formRef.value?.clearValidate()
}

// 打开编辑弹窗
const openEditDialog = async (row) => {
  dialogVisible.value = true
  const res = await getRoleByIdApi(row.id)
  Object.assign(formData, res)
  formRef.value?.clearValidate()
}

// 删除角色
const handleDelete = async (row) => {
  await ElMessageBox.confirm(
    '确定要删除该角色吗？删除后不可恢复！',
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
    await deleteRoleApi(row.id)
    ElMessage.success({ message: '删除成功', offset: 20 })
    loadRoleList()
  }).catch(() => {
    ElMessage.info({ message: '已取消删除', offset: 20 })
  })
}

// 表单校验
const submitForm = () => {
  formRef.value.validate((valid) => {
    if (!valid) return
    doSubmit()
  })
}

// 提交接口
const doSubmit = async () => {
  try {
    let res
    if (formData.id) {
      // 编辑
      res = await updateRoleApi(formData)
      if (res === 'success') {
        ElMessage.success({ message: '修改成功', offset: 20 })
        dialogVisible.value = false
        loadRoleList()
      } else {
        ElMessage.error({ message: res, offset: 20 })
      }
    } else {
      // 新增
      res = await addRoleApi(formData)
      if (res === 'success') {
        ElMessage.success({ message: '新增成功', offset: 20 })
        dialogVisible.value = false
        loadRoleList()
      } else {
        ElMessage.error({ message: res, offset: 20 })
      }
    }
  } catch (err) {
    ElMessage.error({ message: '操作失败，请重试', offset: 20 })
  }
}

onMounted(() => {
  loadRoleList()
})
</script>

<style scoped>
.role-container {
  padding: 20px;
}
</style>
