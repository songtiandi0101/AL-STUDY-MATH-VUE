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

// 查询所有角色（下拉框用，不分页）
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

// ==================== ⭐ 新增：角色-菜单权限相关 ====================

// 查询某个角色已分配的菜单ID列表（编辑权限时回显勾选状态）
export function getRoleMenuIdsApi(roleId) {
  return request.get(`/sys/role/menuIds/${roleId}`)
}

// 给角色分配菜单权限（全量覆盖：先删旧，再插新）
export function assignRoleMenusApi(data) {
  return request.post('/sys/role/assignMenus', data)
}