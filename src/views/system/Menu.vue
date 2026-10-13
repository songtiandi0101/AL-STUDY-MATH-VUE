<template>
  <div class="menu-container">
    <el-card>
      <!-- 查询区域 -->
      <el-form :model="queryForm" inline>
        <el-form-item label="菜单名称">
          <el-input v-model="queryForm.menuName" placeholder="请输入菜单名称"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadMenuList">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div style="margin:15px 0;">
        <el-button type="primary" @click="openAddDialog">新增菜单</el-button>
      </div>

      <!-- 树形表格：使用 min-width 让列自动铺满 -->
      <el-table
        :data="tableData"
        border
        stripe
        row-key="id"
        default-expand-all
        :tree-props="{ children: 'children' }"
        style="width: 100%"
      >
        <el-table-column prop="menuName" label="菜单名称" min-width="200"></el-table-column>

        <el-table-column label="图标" width="80" align="center">
          <template #default="scope">
            <el-icon v-if="scope.row.icon">
              <component :is="iconMap[scope.row.icon]" />
            </el-icon>
          </template>
        </el-table-column>

        <el-table-column prop="path" label="路由路径" min-width="180"></el-table-column>

        <el-table-column prop="sort" label="排序" width="80" align="center"></el-table-column>

        <el-table-column label="类型" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.type === 1" type="warning">目录</el-tag>
            <el-tag v-else-if="scope.row.type === 2" type="success">菜单</el-tag>
            <el-tag v-else type="info">按钮</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="可见" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.visible === 1 ? 'success' : 'danger'">
              {{ scope.row.visible === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="260" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="success" @click="openAddChildDialog(scope.row)">新增子菜单</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="formData.id ? '编辑菜单' : '新增菜单'" width="600px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">

        <!-- 父菜单选择 -->
        <el-form-item label="上级菜单" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="parentMenuOptions"
            :props="{ label: 'menuName', value: 'id', children: 'children' }"
            check-strictly
            placeholder="请选择上级菜单（不选则为顶级菜单）"
            style="width:100%"
            clearable
          />
        </el-form-item>

        <el-form-item label="菜单类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio :value="1">目录</el-radio>
            <el-radio :value="2">菜单</el-radio>
            <el-radio :value="3">按钮</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="formData.menuName" placeholder="请输入菜单名称"></el-input>
        </el-form-item>

        <el-form-item v-if="formData.type !== 3" label="路由路径" prop="path">
          <el-input v-model="formData.path" placeholder="例如：/system/user"></el-input>
        </el-form-item>

        <el-form-item v-if="formData.type !== 3" label="图标" prop="icon">
          <el-input v-model="formData.icon" placeholder="请输入 Element Plus 图标名，如 User、Setting"></el-input>
        </el-form-item>

        <el-form-item label="显示排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="999"></el-input-number>
        </el-form-item>

        <el-form-item label="是否可见" prop="visible">
          <el-radio-group v-model="formData.visible">
            <el-radio :value="1">显示</el-radio>
            <el-radio :value="0">隐藏</el-radio>
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
import {
  getMenuTreeApi,
  addMenuApi,
  getMenuByIdApi,
  updateMenuApi,
  deleteMenuApi
} from '@/api/menu/menu'
import { House, Setting, User, Menu, UserFilled, Document } from '@element-plus/icons-vue'

// 图标映射
const iconMap = {
  House,
  Setting,
  User,
  Menu,
  UserFilled,
  Document
}

// 查询表单
const queryForm = reactive({
  menuName: ''
})

const tableData = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)
const parentMenuOptions = ref([])

// 表单数据
const formData = reactive({
  id: null,
  parentId: 0,
  menuName: '',
  path: '',
  icon: '',
  sort: 0,
  visible: 1,
  type: 1
})

// 校验规则
const formRules = reactive({
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
  path: [
    {
      validator: (rule, value, callback) => {
        if (formData.type !== 3 && !value) {
          callback(new Error('请输入路由路径'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  sort: [{ required: true, message: '请输入排序号', trigger: 'blur' }]
})

// 平铺列表转树
const buildTree = (list, parentId) => {
  return list
    .filter(item => item.parentId === parentId)
    .map(item => {
      const children = buildTree(list, item.id)
      return children.length > 0 ? { ...item, children } : { ...item }
    })
}

// 加载菜单树
const loadMenuList = async () => {
  const res = await getMenuTreeApi()
  const list = Array.isArray(res) ? res : (res.data || [])
  tableData.value = buildTree(list, 0)
  parentMenuOptions.value = [
    { id: 0, menuName: '顶级菜单', children: buildTree(list, 0) }
  ]
}

// 重置查询
const resetQuery = () => {
  queryForm.menuName = ''
  loadMenuList()
}

// 打开新增弹窗
const openAddDialog = () => {
  dialogVisible.value = true
  Object.assign(formData, {
    id: null,
    parentId: 0,
    menuName: '',
    path: '',
    icon: '',
    sort: 0,
    visible: 1,
    type: 1
  })
  formRef.value?.clearValidate()
}

// 打开新增子菜单弹窗
const openAddChildDialog = (row) => {
  dialogVisible.value = true
  Object.assign(formData, {
    id: null,
    parentId: row.id,
    menuName: '',
    path: '',
    icon: '',
    sort: 0,
    visible: 1,
    type: 2
  })
  formRef.value?.clearValidate()
}

// 打开编辑弹窗
const openEditDialog = async (row) => {
  dialogVisible.value = true
  const res = await getMenuByIdApi(row.id)
  Object.assign(formData, res)
  formRef.value?.clearValidate()
}

// 删除
const handleDelete = async (row) => {
  await ElMessageBox.confirm(
    `确定要删除菜单「${row.menuName}」吗？删除后不可恢复！`,
    '删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      customStyle: { marginTop: '-15vh' }
    }
  ).then(async () => {
    await deleteMenuApi(row.id)
    ElMessage.success({ message: '删除成功', offset: 20 })
    loadMenuList()
  }).catch(() => {
    ElMessage.info({ message: '已取消删除', offset: 20 })
  })
}

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid) => {
    if (!valid) return
    doSubmit()
  })
}

const doSubmit = async () => {
  try {
    let res
    if (formData.id) {
      res = await updateMenuApi(formData)
      if (res === 'success') {
        ElMessage.success({ message: '修改成功', offset: 20 })
        dialogVisible.value = false
        loadMenuList()
      } else {
        ElMessage.error({ message: res, offset: 20 })
      }
    } else {
      res = await addMenuApi(formData)
      if (res === 'success') {
        ElMessage.success({ message: '新增成功', offset: 20 })
        dialogVisible.value = false
        loadMenuList()
      } else {
        ElMessage.error({ message: res, offset: 20 })
      }
    }
  } catch (err) {
    ElMessage.error({ message: '操作失败，请重试', offset: 20 })
  }
}

onMounted(() => {
  loadMenuList()
})
</script>

<style scoped>
.menu-container {
  padding: 20px;
}
</style>