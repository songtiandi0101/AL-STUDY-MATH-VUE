import request from '../../utils/request'

// 新增角色
export function addRoleApi(data) {
  return request.post('/sys/role/add', data)
}

// 根据id查询角色
export function getRoleByIdApi(id) {
  return request.get(`/sys/role/get/${id}`)
}

// 角色分页列表查询（角色管理页面用）
export function getRoleListApi(query) {
  return request.get('/sys/role/list', { params: query })
}

// ⭐ 新增：查询所有角色（下拉框用，不分页）
export function getAllRoleApi() {
  return request.get('/sys/role/all')
}

// 修改角色
export function updateRoleApi(data) {
  return request.put('/sys/role/update', data)
}

// 删除角色
export function deleteRoleApi(id) {
  return request.delete(`/sys/role/delete/${id}`)
}