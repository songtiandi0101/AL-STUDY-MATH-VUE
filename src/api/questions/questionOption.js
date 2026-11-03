// src/api/math/questionOption.js
import request from '../../utils/request'

/**
 * 新增单个选项
 * @param {Object} option 选项实体
 */
export function addQuestionOptionApi(option) {
  return request.post('/math/questionOption/add', option)
}

/**
 * 批量新增选项
 * @param {Array} options 选项数组
 */
export function addBatchQuestionOptionApi(options) {
  return request.post('/math/questionOption/addBatch', options)
}

/**
 * 根据题目ID查询该题所有选项
 * @param {Long} questionId 题目id
 */
export function getOptionListByQuestionIdApi(questionId) {
  return request.get(`/math/questionOption/list/${questionId}`)
}

/**
 * 更新单个选项
 * @param {Object} option 选项实体
 */
export function updateQuestionOptionApi(option) {
  return request.put('/math/questionOption/update', option)
}

/**
 * 根据题目ID删除该题全部选项
 * @param {Long} questionId 题目id
 */
export function deleteOptionByQuestionIdApi(questionId) {
  return request.delete(`/math/questionOption/deleteByQuestion/${questionId}`)
}

/**
 * 根据选项ID删除单个选项
 * @param {Long} id 选项id
 */
export function deleteQuestionOptionApi(id) {
  return request.delete(`/math/questionOption/delete/${id}`)
}
