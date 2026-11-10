<template>
  <div class="knowledge-point-container">
    <el-card>
      <!-- 查询区域 -->
      <el-form :model="queryForm" inline>
        <el-form-item label="知识点名称">
          <el-input
            v-model="queryForm.name"
            placeholder="请输入知识点名称"
            clearable
            @keyup.enter="loadTree"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadTree">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div style="margin:15px 0;">
        <el-button type="primary" @click="openAddDialog(null)">新增顶级知识点</el-button>
        <el-button @click="toggleExpandAll">
          {{ expandAll ? '全部收起' : '全部展开' }}
        </el-button>
      </div>

      <!-- 树形表格 -->
      <el-table
        v-if="tableVisible"
        ref="tableRef"
        :data="tableData"
        border
        stripe
        row-key="id"
        :tree-props="{ children: 'children' }"
        :default-expand-all="expandAll"
      >
        <el-table-column prop="name" label="知识点名称" min-width="220" />
        <el-table-column prop="level" label="层级" width="80" align="center" />
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="scope">
            <el-button size="small" type="success" @click="openAddDialog(scope.row)">
              新增子级
            </el-button>
            <el-button size="small" type="primary" @click="openEditDialog(scope.row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 无数据 -->
      <el-empty v-if="!tableData.length" description="暂无知识点数据" />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑知识点' : '新增知识点'"
      width="520px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="上级知识点">
          <el-tree-select
            v-model="formData.parentId"
            :data="parentTreeData"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            check-strictly
            :render-after-expand="false"
            placeholder="不选则作为顶级知识点"
            clearable
            style="width:100%"
          />
        </el-form-item>

        <el-form-item label="知识点名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入知识点名称" />
        </el-form-item>

        <el-form-item label="层级" prop="level">
          <el-input-number v-model="formData.level" :min="1" :max="10" />
          <span style="margin-left:10px;color:#909399;font-size:12px">
            （1 为顶级，2 为二级，依次类推）
          </span>
        </el-form-item>

        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" :max="9999" />
          <span style="margin-left:10px;color:#909399;font-size:12px">
            （数字越小越靠前）
          </span>
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
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getKnowledgePointTreeApi,
  getKnowledgePointByIdApi,
  addKnowledgePointApi,
  updateKnowledgePointApi,
  deleteKnowledgePointApi
} from '@/api/questions/knowledgePoint'

// ==================== 查询/表格 ====================

const queryForm = reactive({
  name: ''
})

const rawTree = ref([])      // 原始完整树
const tableData = ref([])    // 实际渲染的树（按 name 过滤后）
const expandAll = ref(true)
const tableVisible = ref(true)
const tableRef = ref(null)

// 用于级联选择/上级选择的树数据（加一个「顶级节点」选项）
const parentTreeData = computed(() => {
  // 编辑时，不能把自己/自己的子孙作为父节点
  const filterTree = (nodes) => {
    return nodes
      .filter((n) => n.id !== formData.id)
      .map((n) => ({
        ...n,
        children: n.children && n.children.length ? filterTree(n.children) : []
      }))
  }
  return filterTree(rawTree.value)
})

const formatTime = (time) => {
  if (!time) return ''
  return String(time).replace('T', ' ').slice(0, 19)
}

// ==================== 数据加载 ====================

const loadTree = async () => {
  try {
    const res = await getKnowledgePointTreeApi()
    rawTree.value = res || []
    applyFilter()
  } catch (err) {
    ElMessage.error({ message: '加载知识点失败', offset: 20 })
    console.error(err)
  }
}

// 按名称过滤：保留匹配节点及其祖先/子孙
const applyFilter = () => {
  const keyword = (queryForm.name || '').trim()
  if (!keyword) {
    tableData.value = rawTree.value
  } else {
    tableData.value = filterTree(rawTree.value, keyword)
  }
  // 每次数据变化后强制刷新表格展开状态
  nextTick(() => {
    if (expandAll.value) {
      tableData.value.forEach((row) => tableRef.value?.toggleRowExpansion(row, true))
    }
  })
}

const filterTree = (nodes, keyword) => {
  const result = []
  nodes.forEach((node) => {
    const matched = node.name && node.name.includes(keyword)
    const filteredChildren = node.children ? filterTree(node.children, keyword) : []
    if (matched || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren
      })
    }
  })
  return result
}

const resetQuery = () => {
  queryForm.name = ''
  loadTree()
}

const toggleExpandAll = () => {
  expandAll.value = !expandAll.value
  // 通过销毁重建表格实现全部展开/收起
  tableVisible.value = false
  nextTick(() => {
    tableVisible.value = true
    nextTick(() => {
      if (expandAll.value && tableRef.value) {
        tableData.value.forEach((row) => tableRef.value.toggleRowExpansion(row, true))
      }
    })
  })
}

// ==================== 弹窗/表单 ====================

const dialogVisible = ref(false)
const formRef = ref(null)

const formData = reactive({
  id: null,
  parentId: 0,
  name: '',
  level: 1,
  sortOrder: 1
})

const formRules = reactive({
  name: [{ required: true, message: '请输入知识点名称', trigger: 'blur' }],
  level: [{ required: true, message: '请输入层级', trigger: 'blur' }],
  sortOrder: [{ required: true, message: '请输入排序号', trigger: 'blur' }]
})

const resetForm = () => {
  formData.id = null
  formData.parentId = 0
  formData.name = ''
  formData.level = 1
  formData.sortOrder = 1
}

/**
 * 打开新增弹窗
 * @param {Object|null} parentRow 传入父节点则为「新增子级」，传 null 则为「新增顶级」
 */
const openAddDialog = (parentRow) => {
  resetForm()
  if (parentRow) {
    formData.parentId = parentRow.id
    formData.level = (parentRow.level || 1) + 1
  } else {
    formData.parentId = 0
    formData.level = 1
  }
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

const openEditDialog = async (row) => {
  resetForm()
  dialogVisible.value = true
  try {
    const res = await getKnowledgePointByIdApi(row.id)
    if (res) {
      formData.id = res.id
      formData.parentId = res.parentId ?? 0
      formData.name = res.name
      formData.level = res.level
      formData.sortOrder = res.sortOrder
    }
  } catch (err) {
    ElMessage.error({ message: '加载详情失败', offset: 20 })
  }
  formRef.value?.clearValidate()
}

const submitForm = () => {
  formRef.value.validate((valid) => {
    if (!valid) return
    doSubmit()
  })
}

const doSubmit = async () => {
  try {
    // 处理 parentId：顶级传 0
    const payload = {
      id: formData.id,
      parentId: formData.parentId === null || formData.parentId === undefined ? 0 : formData.parentId,
      name: formData.name,
      level: formData.level,
      sortOrder: formData.sortOrder
    }

    let res
    if (formData.id) {
      res = await updateKnowledgePointApi(payload)
      if (res === 'success') {
        ElMessage.success({ message: '修改成功', offset: 20 })
        dialogVisible.value = false
        loadTree()
      } else {
        ElMessage.error({ message: res, offset: 20 })
      }
    } else {
      res = await addKnowledgePointApi(payload)
      if (res === 'success') {
        ElMessage.success({ message: '新增成功', offset: 20 })
        dialogVisible.value = false
        loadTree()
      } else {
        ElMessage.error({ message: res, offset: 20 })
      }
    }
  } catch (err) {
    ElMessage.error({ message: '操作失败，请重试', offset: 20 })
  }
}

// ==================== 删除 ====================

const handleDelete = async (row) => {
  // 有子节点时后端也会校验，但前端提前提示更友好
  if (row.children && row.children.length > 0) {
    ElMessage.warning({ message: '该知识点下存在子节点，请先删除子节点', offset: 20 })
    return
  }

  await ElMessageBox.confirm(
    `确定要删除知识点「${row.name}」吗？删除后不可恢复！`,
    '删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      customStyle: { marginTop: '-15vh' }
    }
  )
    .then(async () => {
      const res = await deleteKnowledgePointApi(row.id)
      if (res === 'success') {
        ElMessage.success({ message: '删除成功', offset: 20 })
        loadTree()
      } else {
        // 后端抛出的业务异常（如「已有题目关联该知识点」）会原样返回
        ElMessage.error({ message: res, offset: 20 })
      }
    })
    .catch(() => {
      ElMessage.info({ message: '已取消删除', offset: 20 })
    })
}

onMounted(() => {
  loadTree()
})
</script>

<style scoped>
.knowledge-point-container {
  padding: 20px;
}
</style>