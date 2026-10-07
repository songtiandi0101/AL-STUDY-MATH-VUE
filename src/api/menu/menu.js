import request from '../../utils/request'

// 获取菜单树（根据角色id，Layout侧边栏动态菜单用）
// 原来
// export function getMenuTreeApi(roleId) {
//   return request({
//     url: '/sys/menu/getMenuTree',
//     method: 'get',
//     params: { roleId }
//   })
// }

// 修改后
export function getMenuTreeApi() {
  return request({
    url: '/sys/menu/getMenuTree',
    method: 'get'
  })
}

// 新增菜单
export function addMenuApi(data) {
  return request.post('/sys/menu/add', data)
}

// 根据id查询菜单
export function getMenuByIdApi(id) {
  return request.get(`/sys/menu/get/${id}`)
}

// 菜单列表查询
export function getMenuListApi(query) {
  return request.get('/sys/menu/list', { params: query })
}

// 修改菜单
export function updateMenuApi(data) {
  return request.put('/sys/menu/update', data)
}

// 删除菜单
export function deleteMenuApi(id) {
  return request.delete(`/sys/menu/delete/${id}`)
}
