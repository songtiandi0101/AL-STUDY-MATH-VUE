<template>
  <div class="question-import-container">
    <el-card>
      <!-- 卡片头部 -->
      <template #header>
        <div class="card-header">
          <span>智能习题导入</span>
        </div>
      </template>

      <!-- 核心上传区域 -->
      <div class="upload-wrapper">
        <el-upload
          action="#"
          :show-file-list="false"
          :before-upload="beforeUpload"
          :http-request="handleUpload"
        >
          <!-- 只有一个大按钮 -->
          <el-button type="primary" size="large" :icon="Upload" class="import-btn">
            导入图片
          </el-button>
        </el-upload>
        <div class="tips">支持 jpg、png 格式，大小不超过 10MB，上传后将自动调用 AI 识别题目</div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { Upload } from '@element-plus/icons-vue'
// 如果你有对应的 API 接口，请在这里引入
// import { uploadQuestionImageApi } from '@/api/question/question'

// 上传前校验
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }
  return true
}

// 自定义上传逻辑
const handleUpload = async ({ file }) => {
  const formData = new FormData()
  formData.append('file', file)
  const loading = ElMessage({ message: '正在上传并识别，请稍候...', type: 'info', duration: 0 })
  try {
    // 请求fastapi接口
    const res = await axios.post('http://127.0.0.1:8000/upload_image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    loading.close()
    if (res.data.code === 200) {
      ElMessage.success('图片解析完成！')
      // ✅ res.data.data.question 就是识别出来的题干
      console.log('识别题干：', res.data.data.question)
      // 这里你可以弹窗展示题干，或者回填到表单输入框
      // example: questionText.value = res.data.data.question
    }
  } catch (error) {
    loading.close()
    ElMessage.error('导入失败，请重试')
    console.error(error)
  }
}
</script>

<style scoped>
.question-import-container {
  padding: 20px;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}

.upload-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
}

.import-btn {
  padding: 24px 50px;
  font-size: 18px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.import-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
  transition: all 0.3s ease;
}

.tips {
  margin-top: 20px;
  color: #909399;
  font-size: 14px;
}
</style>