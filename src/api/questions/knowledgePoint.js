// src/api/math/knowledgePoint.js
import request from '../../utils/request'

// 新增知识点
export function addKnowledgePointApi(data) {
  return request.post('/questions/knowledgePoint/add', data)
}

// 根据id查询单个知识点
export function getKnowledgePointByIdApi(id) {
  return request.get(`/questions/knowledgePoint/get/${id}`)
}

// 修改知识点
export function updateKnowledgePointApi(data) {
  return request.put('/questions/knowledgePoint/update', data)
}

// 删除知识点
export function deleteKnowledgePointApi(id) {
  return request.delete(`/questions/knowledgePoint/delete/${id}`)
}

// 获取知识点树（完整树形，就是你之前用到的 getKnowledgePointTreeApi）
export function getKnowledgePointTreeApi() {
  return request.get('/questions/knowledgePoint/tree')
}

// 根据父id获取直接子节点（懒加载）
export function getKnowledgePointChildrenApi(parentId) {
  return request.get(`/questions/knowledgePoint/children/${parentId}`)
}

// 根据题目id获取关联知识点
export function getKpByQuestionIdApi(questionId) {
  return request.get(`/questions/knowledgePoint/byQuestion/${questionId}`)
}

// 题目批量绑定知识点
export function bindQuestionKpApi(questionId, kpIds) {
  return request.post(`/questions/knowledgePoint/bind/${questionId}`, kpIds)
}

// 题目解绑所有知识点
export function unbindQuestionKpApi(questionId) {
  return request.delete(`/questions/knowledgePoint/unbind/${questionId}`)
}
