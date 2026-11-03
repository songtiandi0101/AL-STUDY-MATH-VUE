// src/api/math/questionKpRelation.js
import request from '../../utils/request'

/**
 * 批量绑定题目与知识点关联
 * @param {Long} questionId 题目id
 * @param {Array<Long>} kpIds 知识点id数组
 */
export function batchBindKpRelationApi(questionId, kpIds) {
  return request.post(`/math/questionKpRelation/bind/${questionId}`, kpIds)
}

/**
 * 根据题目ID解除该题目的所有知识点关联
 * @param {Long} questionId 题目id
 */
export function unbindByQuestionApi(questionId) {
  return request.delete(`/math/questionKpRelation/unbindByQuestion/${questionId}`)
}

/**
 * 根据知识点ID解除该知识点与所有题目的关联
 * @param {Long} kpId 知识点id
 */
export function unbindByKpApi(kpId) {
  return request.delete(`/math/questionKpRelation/unbindByKp/${kpId}`)
}

/**
 * 根据题目ID查询关联的知识点ID列表
 * @param {Long} questionId 题目id
 */
export function getKpIdsByQuestionIdApi(questionId) {
  return request.get(`/math/questionKpRelation/kpIds/${questionId}`)
}

/**
 * 根据知识点ID查询关联的题目数量
 * @param {Long} kpId 知识点id
 */
export function countQuestionsByKpIdApi(kpId) {
  return request.get(`/math/questionKpRelation/count/${kpId}`)
}
