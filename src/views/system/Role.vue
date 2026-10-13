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
        <el-table-column label="操作" width="300">
          <template #default="scope">
            <el-button size="small" type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="warning" @click="openAssignDialog(scope.row)">分配权限</el-button>
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
          <el-input v-model="formData.roleName" placeholder="请输入角色名称"></el-input>
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="formData.roleCode" placeholder="请输入角色编码"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- ⭐ 分配权限弹窗 -->
    <el-dialog v-model="assignDialogVisible" title="分配菜单权限" width="500px">
      <el-tree
        ref="menuTreeRef"
        :data="menuTreeData"
        show-checkbox
        node-key="id"
        :props="{ label: 'menuName', children: 'children' }"
        default-expand-all
        style="max-height:400px;overflow-y:auto;"
      />
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 角色接口
import {
  getRoleListApi,
  addRoleApi,
  getRoleByIdApi,
  updateRoleApi,
  deleteRoleApi,
  getRoleMenuIdsApi,
  assignRoleMenusApi
} from '@/api/role/role'
// 菜单树接口
import { getMenuTreeApi } from '@/api/menu/menu'

// 查询条件
const queryForm = reactive({
  roleName: '',
  roleCode: '',
  pageNum: 1,
  pageSize: 10
})
const tableData = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const formRef = ref(null)

// ⭐ 分配权限弹窗相关
const assignDialogVisible = ref(false)
const menuTreeRef = ref(null)
const menuTreeData = ref([])
const currentAssignRoleId = ref(null)

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

// 平铺列表转树（兼容后端返回平铺/树形两种格式）
const buildTree = (list, parentId) => {
  return list
    .filter(item => item.parentId === parentId)
    .map(item => {
      const children = buildTree(list, item.id)
      return children.length > 0 ? { ...item, children } : { ...item }
    })
}

// 加载角色分页列表
const loadRoleList = async () => {
  const res = await getRoleListApi(queryForm)
  tableData.value = res.records
  total.value = res.total
}

// ⭐ 加载菜单树（供分配权限弹窗用）
const loadMenuTree = async () => {
  const res = await getMenuTreeApi()
  const list = Array.isArray(res) ? res : (res.data || [])
  menuTreeData.value = buildTree(list, 0)
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

// ⭐ 打开分配权限弹窗
const openAssignDialog = async (row) => {
  currentAssignRoleId.value = row.id
  assignDialogVisible.value = true

  // 1. 查询角色已分配的菜单ID
  const menuIds = await getRoleMenuIdsApi(row.id)

  // 2. 等待 DOM 渲染后，回显勾选状态
  await nextTick()
  // ⚠️ 第二个参数 false：只勾选给定的 key，父节点自动根据子节点状态变全选/半选
  menuTreeRef.value.setCheckedKeys(menuIds || [], false)
}

// ⭐ 提交分配
const submitAssign = async () => {
  // 全选节点 + 半选节点（半选的父目录也要提交，否则子菜单挂不上去）
  const checkedKeys = menuTreeRef.value.getCheckedKeys()
  const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys()
  const menuIds = [...checkedKeys, ...halfCheckedKeys]

  const res = await assignRoleMenusApi({
    roleId: currentAssignRoleId.value,
    menuIds
  })

  if (res === 'success') {
    ElMessage.success({ message: '分配成功', offset: 20 })
    assignDialogVisible.value = false
  } else {
    ElMessage.error({ message: res, offset: 20 })
  }
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
      customStyle: { marginTop: '-15vh' }
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
      res = await updateRoleApi(formData)
      if (res === 'success') {
        ElMessage.success({ message: '修改成功', offset: 20 })
        dialogVisible.value = false
        loadRoleList()
      } else {
        ElMessage.error({ message: res, offset: 20 })
      }
    } else {
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
  loadMenuTree()   // ⭐ 加载菜单树
})
</script>

<style scoped>
.role-container {
  padding: 20px;
}
</style>