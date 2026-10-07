<template>
  <!-- 外层用原生div，不用el-container！！这是核心改动 -->
  <div style="display:flex;height:100vh;">
    <el-aside width="220px" style="background:#fff;border-right:1px solid #eee;">
      <!-- 左上角标题 -->
      <div style="height:60px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;color:#000;border-bottom:1px solid #eee;letter-spacing:2px;">
        对偶花园
      </div>
      <el-menu
        router
        :default-active="$route.path"
        unique-opened
        style="border:none"
      >
        <!-- 循环渲染后端返回菜单树 -->
        <template v-for="item in menuList" :key="item.id">
          <!-- 父菜单(子菜单存在) -->
          <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.path">
            <template #title>
              <el-icon v-if="item.icon"><component :is="iconMap[item.icon]" /></el-icon>
              <span>{{ item.menuName }}</span>
            </template>
            <!-- 子菜单循环 -->
            <el-menu-item
              v-for="child in item.children"
              :key="child.id"
              :index="child.path"
            >
              <el-icon v-if="child.icon"><component :is="iconMap[child.icon]" /></el-icon>
              <span>{{ child.menuName }}</span>
            </el-menu-item>
          </el-sub-menu>
          <!-- 一级普通菜单，无子菜单 -->
          <el-menu-item v-else :index="item.path">
            <el-icon v-if="item.icon"><component :is="iconMap[item.icon]" /></el-icon>
            <span>{{ item.menuName }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-main style="padding:0;flex:1;">
      <router-view />
    </el-main>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
// 导入element图标
import { House, Setting, User, Menu } from '@element-plus/icons-vue'
// 导入菜单接口，和你api目录匹配
import { getMenuTreeApi } from '@/api/menu/menu'
// 图标映射：后端sys_menu表icon字段存字符串如 "House"
const iconMap = {
  House,
  Setting,
  User,
  Menu
}
const menuList = ref([])
// 获取角色菜单树
const getMenuTree = async () => {
  const res = await getMenuTreeApi()
  menuList.value = res
  console.log("菜单数据：", menuList.value)
}
onMounted(() => {
  getMenuTree()
})
</script>
