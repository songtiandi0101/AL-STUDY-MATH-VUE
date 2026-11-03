import request from '../../utils/request'

// ==================== 题目管理 ====================

// 新增题目（包含选项和知识点关联）
export function addQuestionApi(data) {
  return request.post('/questions/question/add', data)
}

// 根据ID查询题目详情（含选项、知识点）
export function getQuestionByIdApi(id) {
  return request.get(`/questions/question/get/${id}`)
}

// 更新题目（覆盖更新选项和知识点关联）
export function updateQuestionApi(data) {
  return request.put('/questions/question/update', data)
}

// 物理删除单个题目
export function deleteQuestionApi(id) {
  return request.delete(`/questions/question/delete/${id}`)
}

// 批量物理删除题目
// 注意：后端用 @RequestBody 接收 List<Long>，DELETE 带 body 需用 { data } 传参
export function deleteBatchQuestionsApi(ids) {
  return request.delete('/questions/question/deleteBatch', { data: ids })
}

// 分页查询题目列表（GET，参数拼在 url params）
export function getQuestionListApi(query) {
  return request.get('/questions/question/list', { params: query })
}

// 修改题目发布状态（上架/下架）
export function updatePublishStatusApi(id, isPublished) {
  return request.put(`/questions/question/publish/${id}`, null, {
    params: { isPublished }
  })
}