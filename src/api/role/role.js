import request from '../../utils/request'

// 新增角色
export function addRoleApi(data) {
  return request.post('/sys/role/add', data)
}
// 根据id查询角色
export function getRoleByIdApi(id) {
  return request.get(`/sys/role/get/${id}`)
}
// 角色列表查询（GET，参数拼在url params）
export function getRoleListApi(query) {
  return request.get('/sys/role/list', { params: query })
}
// 修改角色
export function updateRoleApi(data) {
  return request.put('/sys/role/update', data)
}
// 删除角色
export function deleteRoleApi(id) {
  return request.delete(`/sys/role/delete/${id}`)
}
