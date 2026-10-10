import { createRouter, createWebHistory } from 'vue-router'

// 1. 引入 Layout 作为主框架（侧边栏+头部都在这）
import Layout from '../views/Layout.vue'
// 2. 页面组件
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Login from '../views/Login.vue'

const routes = [
  {
    path: '/',
    component: Layout,          // 根路径加载 Layout（侧边栏容器）
    redirect: '/home',          // 访问 / 自动跳到 /home
    children: [
      {
        path: 'home',           // 子路由不要加 /
        name: 'Home',
        component: Home
      },
      // 系统管理子菜单对应的页面
      {
        path: 'system/user',
        name: 'User',
        component: () => import('../views/system/User.vue')
      },
      {
        path: 'system/role',
        name: 'Role',
        component: () => import('../views/system/Role.vue')
      },
      {
        path: 'system/menu',
        name: 'Menu',
        component: () => import('../views/system/Menu.vue')
      }
    ]
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：未登录自动跳登录页
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path === '/login') {
    next()
  } else {
    if (token) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router