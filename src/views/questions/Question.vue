<template>
  <div class="question-container">
    <el-card>
      <!-- 查询区域 -->
      <el-form :model="queryForm" inline>
        <el-form-item label="题干">
          <el-input v-model="queryForm.content" placeholder="请输入题干关键字" clearable />
        </el-form-item>
        <el-form-item label="题型">
          <el-select v-model="queryForm.questionType" placeholder="全部" clearable style="width:120px">
            <el-option v-for="t in questionTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级">
          <el-input v-model="queryForm.grade" placeholder="如 七年级" clearable style="width:130px" />
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="queryForm.difficulty" placeholder="全部" clearable style="width:100px">
            <el-option v-for="i in 5" :key="i" :label="`${i} 星`" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.isPublished" placeholder="全部" clearable style="width:100px">
            <el-option label="草稿" :value="0" />
            <el-option label="已发布" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadQuestionList">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div style="margin:15px 0;">
        <el-button type="primary" @click="openAddDialog">新增题目</el-button>
        <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
          批量删除
        </el-button>
      </div>

      <!-- ========== 两列卡片区域（替代原来table） ========== -->
      <div class="two-col-wrap">
        <!-- 左列：前5条 -->
        <div class="col-item">
          <div class="col-title">题目组一</div>
          <div
            v-for="(row,idx) in leftList"
            :key="row.id"
            class="question-card"
            :class="{ 'card-active': selectedIds.includes(row.id) }"
            @click="toggleSelect(row)"
          >
            <div class="card-head">
              <el-tag size="small">{{ formatQuestionType(row.questionType) }}</el-tag>
              <span class="card-grade">{{ row.grade || '-' }}</span>
              <el-rate :model-value="row.difficulty || 0" disabled size="small" />
            </div>
            <div class="card-content">{{ row.content }}</div>
            <div class="card-foot">
              <span>来源：{{ row.source || '-' }}</span>
              <el-switch
                :model-value="row.isPublished"
                :active-value="1"
                :inactive-value="0"
                active-text="发布"
                inactive-text="草稿"
                size="small"
                @change.stop="(val) => handlePublishChange(row, val)"
              />
            </div>
            <div class="card-op">
              <el-button size="small" type="primary" @click.stop="openEditDialog(row)">编辑</el-button>
              <el-button size="small" type="danger" @click.stop="handleDelete(row)">删除</el-button>
            </div>
          </div>
        </div>
        <!-- 右列：5条之后 -->
        <div class="col-item">
          <div class="col-title">题目组二</div>
          <div
            v-for="(row,idx) in rightList"
            :key="row.id"
            class="question-card"
            :class="{ 'card-active': selectedIds.includes(row.id) }"
            @click="toggleSelect(row)"
          >
            <div class="card-head">
              <el-tag size="small">{{ formatQuestionType(row.questionType) }}</el-tag>
              <span class="card-grade">{{ row.grade || '-' }}</span>
              <el-rate :model-value="row.difficulty || 0" disabled size="small" />
            </div>
            <div class="card-content">{{ row.content }}</div>
            <div class="card-foot">
              <span>来源：{{ row.source || '-' }}</span>
              <el-switch
                :model-value="row.isPublished"
                :active-value="1"
                :inactive-value="0"
                active-text="发布"
                inactive-text="草稿"
                size="small"
                @change.stop="(val) => handlePublishChange(row, val)"
              />
            </div>
            <div class="card-op">
              <el-button size="small" type="primary" @click.stop="openEditDialog(row)">编辑</el-button>
              <el-button size="small" type="danger" @click.stop="handleDelete(row)">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <el-pagination
        style="margin-top:16px;text-align:right"
        v-model:current-page="queryForm.pageNum"
        v-model:page-size="queryForm.pageSize"
        :total="total"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadQuestionList"
        @current-change="loadQuestionList"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑题目' : '新增题目'"
      width="820px"
      top="5vh"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
        <el-form-item label="题型" prop="questionType">
          <el-radio-group v-model="formData.questionType" @change="handleTypeChange">
            <el-radio v-for="t in questionTypeOptions" :key="t.value" :value="t.value">
              {{ t.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="年级" prop="grade">
          <el-input v-model="formData.grade" placeholder="如 七年级、高一" />
        </el-form-item>

        <el-form-item label="难度" prop="difficulty">
          <el-rate v-model="formData.difficulty" />
        </el-form-item>

        <el-form-item label="是否有图">
          <el-radio-group v-model="formData.hasImage">
            <el-radio :value="0">无图</el-radio>
            <el-radio :value="1">有图</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="题干" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="4"
            placeholder="支持 Markdown / LaTeX"
          />
        </el-form-item>

        <!-- 选项编辑：单选、多选 -->
        <el-form-item v-if="showOptions" label="选项">
          <div style="width:100%">
            <div v-for="(opt, idx) in formData.options" :key="idx" class="option-row">
              <el-input v-model="opt.optionLabel" placeholder="标签" style="width:70px" />
              <el-input
                v-model="opt.optionContent"
                placeholder="选项内容（支持 LaTeX）"
                style="flex:1;margin:0 8px"
              />
              <!-- 多选：勾选正确 -->
              <el-checkbox
                v-if="formData.questionType === 2"
                :model-value="opt.isCorrect === 1"
                @change="(val) => (opt.isCorrect = val ? 1 : 0)"
              >
                正确
              </el-checkbox>
              <!-- 单选：只能选一个正确 -->
              <el-radio
                v-else
                :model-value="correctIndex"
                :value="idx"
                @change="() => setSingleCorrect(idx)"
              >
                正确
              </el-radio>
              <el-button type="danger" link @click="removeOption(idx)">删除</el-button>
            </div>
            <el-button type="primary" plain size="small" @click="addOption">添加选项</el-button>
          </div>
        </el-form-item>

        <el-form-item label="答案" prop="answer">
          <el-input v-model="formData.answer" type="textarea" :rows="2" placeholder="标准答案" />
        </el-form-item>

        <el-form-item label="解析">
          <el-input v-model="formData.analysis" type="textarea" :rows="3" placeholder="答案解析步骤" />
        </el-form-item>

        <el-form-item label="来源">
          <el-input v-model="formData.source" placeholder="题目来源" />
        </el-form-item>

        <el-form-item label="知识点">
          <el-tree-select
            v-model="formData.kpIds"
            :data="kpTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            multiple
            check-strictly
            show-checkbox
            :render-after-expand="false"
            placeholder="请选择知识点"
            style="width:100%"
          />
        </el-form-item>

        <el-form-item label="发布状态">
          <el-radio-group v-model="formData.isPublished">
            <el-radio :value="0">草稿</el-radio>
            <el-radio :value="1">已发布</el-radio>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getQuestionListApi,
  addQuestionApi,
  getQuestionByIdApi,
  updateQuestionApi,
  deleteQuestionApi,
  deleteBatchQuestionsApi,
  updatePublishStatusApi
} from '@/api/questions/question'
import { getKnowledgePointTreeApi } from '@/api/questions/knowledgePoint'

const questionTypeOptions = [
  { value: 1, label: '单选' },
  { value: 2, label: '多选' },
  { value: 3, label: '填空' },
  { value: 4, label: '解答' },
  { value: 5, label: '判断' }
]

const queryForm = reactive({
  content: '',
  questionType: null,
  grade: '',
  difficulty: null,
  isPublished: null,
  pageNum: 1,
  pageSize: 10
})

const tableData = ref([])
const total = ref(0)
const selectedIds = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)

const kpTree = ref([])

const formData = reactive({
  id: null,
  questionType: 1,
  grade: '',
  difficulty: 3,
  hasImage: 0,
  imagePath: '',
  content: '',
  answer: '',
  analysis: '',
  source: '',
  isPublished: 0,
  options: [],
  kpIds: []
})

const formRules = reactive({
  questionType: [{ required: true, message: '请选择题型', trigger: 'change' }],
  grade: [{ required: true, message: '请输入年级', trigger: 'blur' }],
  content: [{ required: true, message: '请输入题干', trigger: 'blur' }],
  answer: [{ required: true, message: '请输入标准答案', trigger: 'blur' }]
})

// 左右两列拆分：左 0~4（5条），右5~9
const leftList = computed(() => tableData.value.slice(0,5))
const rightList = computed(() => tableData.value.slice(5,10))

// 单选/多选才需要编辑选项
const showOptions = computed(() => formData.questionType === 1 || formData.questionType === 2)

// 单选时，正确选项的下标
const correctIndex = computed(() => formData.options.findIndex((o) => o.isCorrect === 1))

const formatQuestionType = (type) => {
  const t = questionTypeOptions.find((i) => i.value === type)
  return t ? t.label : '-'
}

const loadQuestionList = async () => {
  const res = await getQuestionListApi(queryForm)
  tableData.value = res.records || []
  total.value = res.total || 0
}

const loadKpTree = async () => {
  try {
    const res = await getKnowledgePointTreeApi()
    kpTree.value = res || []
  } catch (err) {
    console.error('加载知识点树失败', err)
  }
}

const resetQuery = () => {
  queryForm.content = ''
  queryForm.questionType = null
  queryForm.grade = ''
  queryForm.difficulty = null
  queryForm.isPublished = null
  queryForm.pageNum = 1
  loadQuestionList()
}

// 卡片点击选中，替代原来selection-change
const toggleSelect = (row) => {
  const idx = selectedIds.value.indexOf(row.id)
  if(idx > -1){
    selectedIds.value.splice(idx,1)
  }else{
    selectedIds.value.push(row.id)
  }
}

// ==================== 选项操作 ====================

const createDefaultOption = (label) => ({
  optionLabel: label,
  optionContent: '',
  isCorrect: 0,
  sortOrder: 0
})

const initDefaultOptions = () => {
  formData.options = ['A', 'B', 'C', 'D'].map((l, i) => ({
    optionLabel: l,
    optionContent: '',
    isCorrect: 0,
    sortOrder: i + 1
  }))
}

const addOption = () => {
  const nextLabel = String.fromCharCode(65 + formData.options.length)
  formData.options.push({
    optionLabel: nextLabel,
    optionContent: '',
    isCorrect: 0,
    sortOrder: formData.options.length + 1
  })
}

const removeOption = (idx) => {
  formData.options.splice(idx, 1)
  formData.options.forEach((o, i) => {
    o.sortOrder = i + 1
  })
}

// 单选：只允许一个正确
const setSingleCorrect = (idx) => {
  formData.options.forEach((o, i) => {
    o.isCorrect = i === idx ? 1 : 0
  })
}

// 题型切换时，选择题自动补默认选项
const handleTypeChange = () => {
  if (showOptions.value && formData.options.length === 0) {
    initDefaultOptions()
  }
  if (!showOptions.value) {
    formData.options = []
  }
}

// ==================== 弹窗操作 ====================

const resetForm = () => {
  formData.id = null
  formData.questionType = 1
  formData.grade = ''
  formData.difficulty = 3
  formData.hasImage = 0
  formData.imagePath = ''
  formData.content = ''
  formData.answer = ''
  formData.analysis = ''
  formData.source = ''
  formData.isPublished = 0
  formData.options = []
  formData.kpIds = []
}

const openAddDialog = () => {
  resetForm()
  initDefaultOptions()
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

const openEditDialog = async (row) => {
  resetForm()
  dialogVisible.value = true
  const res = await getQuestionByIdApi(row.id)
  Object.assign(formData, res)
  if (!formData.options) formData.options = []
  // ========= 重点修改：回显知识点 =========
  if (formData.knowledgePoints && Array.isArray(formData.knowledgePoints)) {
    formData.kpIds = formData.knowledgePoints.map(item => Number(item.id))
  } else if (!formData.kpIds) {
    formData.kpIds = []
  }
  formData.options.forEach((o) => {
    o.isCorrect = o.isCorrect ? 1 : 0
  })
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
    // 构造提交数据
    const payload = { ...formData }
    // ========= 重点修改：保证传给后端的 kpIds 是数字Long数组 =========
    payload.kpIds = formData.kpIds.map(Number)

    // 非选择题不提交选项
    if (!showOptions.value) {
      payload.options = []
    } else {
      payload.options = formData.options.map((o, i) => ({
        optionLabel: o.optionLabel,
        optionContent: o.optionContent,
        isCorrect: o.isCorrect,
        sortOrder: i + 1
      }))
    }

    let res
    if (formData.id) {
      res = await updateQuestionApi(payload)
      if (res === 'success') {
        ElMessage.success({ message: '修改成功', offset: 20 })
        dialogVisible.value = false
        loadQuestionList()
      } else {
        ElMessage.error({ message: res, offset: 20 })
      }
    } else {
      res = await addQuestionApi(payload)
      if (res === 'success') {
        ElMessage.success({ message: '新增成功', offset: 20 })
        dialogVisible.value = false
        loadQuestionList()
      } else {
        ElMessage.error({ message: res, offset: 20 })
      }
    }
  } catch (err) {
    ElMessage.error({ message: '操作失败，请重试', offset: 20 })
  }
}

// ==================== 删除 / 发布状态 ====================

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除该题目吗？删除后不可恢复！', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
    customStyle: { marginTop: '-15vh' }
  })
    .then(async () => {
      await deleteQuestionApi(row.id)
      ElMessage.success({ message: '删除成功', offset: 20 })
      loadQuestionList()
    })
    .catch(() => {
      ElMessage.info({ message: '已取消删除', offset: 20 })
    })
}

const handleBatchDelete = async () => {
  await ElMessageBox.confirm(
    `确定要删除选中的 ${selectedIds.value.length} 道题目吗？`,
    '批量删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      customStyle: { marginTop: '-15vh' }
    }
  )
    .then(async () => {
      const res = await deleteBatchQuestionsApi(selectedIds.value)
      if (res === 'success') {
        ElMessage.success({ message: '批量删除成功', offset: 20 })
        loadQuestionList()
      } else {
        ElMessage.error({ message: res, offset: 20 })
      }
    })
    .catch(() => {
      ElMessage.info({ message: '已取消删除', offset: 20 })
    })
}

const handlePublishChange = async (row, val) => {
  try {
    const res = await updatePublishStatusApi(row.id, val)
    if (res === 'success') {
      row.isPublished = val
      ElMessage.success({ message: val === 1 ? '已发布' : '已下架为草稿', offset: 20 })
    } else {
      ElMessage.error({ message: res, offset: 20 })
      loadQuestionList()
    }
  } catch (err) {
    ElMessage.error({ message: '状态修改失败', offset: 20 })
    loadQuestionList()
  }
}

onMounted(() => {
  loadQuestionList()
  loadKpTree()
})
</script>

<style scoped>
.question-container {
  padding: 20px;
}
.option-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.two-col-wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.col-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  max-height: 600px;
  overflow-y: auto;
}
.col-title {
  font-weight: bold;
  font-size:15px;
  margin-bottom:12px;
  padding-bottom:8px;
  border-bottom:1px solid #eee;
}
.question-card {
  border:1px solid #dcdfe6;
  border-radius:6px;
  padding:10px;
  margin-bottom:10px;
  cursor: pointer;
  transition: 0.2s;
}
.question-card:hover {
  border-color:#409eff;
  box-shadow: 0 2px 8px rgba(64,158,255,0.1);
}
.card-active {
  background-color: #f0f7ff;
  border-color:#409eff;
}
.card-head {
  display:flex;
  gap:8px;
  align-items:center;
  margin-bottom:6px;
}
.card-grade {
  font-size:13px;
  color:#666;
}
.card-content {
  font-size:14px;
  color:#333;
  line-height:1.5;
  margin-bottom:8px;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
}
.card-foot {
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-size:12px;
  color:#888;
  margin-bottom:8px;
}
.card-op {
  display:flex;
  gap:6px;
}
</style>
