import axios from 'axios'

const service = axios.create({
  baseURL: 'http://127.0.0.1:8080', // 后端根地址
  timeout: 10000
})

// 请求拦截：自动带上token
service.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

// 响应拦截：统一处理返回
service.interceptors.response.use(
  res => res.data,
  err => {
    console.log('请求错误', err)
    return Promise.reject(err)
  }
)

export default service
