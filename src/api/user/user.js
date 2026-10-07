import request from '../../utils/request'


// 登录
export function loginApi(data) {
  return request.post('/sys/user/login', data)
}

// 新增用户
export function addUserApi(data) {
  return request.post('/sys/user/add', data)
}

// 根据id查询用户
export function getUserByIdApi(id) {
  return request.get(`/sys/user/get/${id}`)
}

// 用户列表查询（GET，参数拼在url params）
export function getUserListApi(query) {
  return request.get('/sys/user/list', { params: query })
}

// 修改用户
export function updateUserApi(data) {
  return request.put('/sys/user/update', data)
}

// 删除用户
export function deleteUserApi(id) {
  return request.delete(`/sys/user/delete/${id}`)
}

