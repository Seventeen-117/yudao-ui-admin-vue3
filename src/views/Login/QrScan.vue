<template>
  <div class="qr-scan-container">
    <div class="qr-scan-header">
      <img src="@/assets/imgs/logo.png" alt="Logo" class="qr-scan-logo" />
      <h1 class="qr-scan-title">江阳科技管理系统</h1>
    </div>
    
    <div class="qr-scan-content">
      <div class="qr-scan-icon">
        <el-icon v-if="scanSuccess" class="success-icon"><Check /></el-icon>
        <el-icon v-else class="loading-icon is-loading"><Loading /></el-icon>
      </div>
      
      <div class="qr-scan-message">
        {{ scanSuccess ? '扫码成功' : '正在处理...' }}
      </div>
      
      <div class="qr-scan-detail">
        {{ scanSuccess ? '请在电脑端完成登录操作' : '请稍候...' }}
      </div>
    </div>
    
    <div class="qr-scan-footer">
      <p>江阳科技提供技术支持</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, Loading } from '@element-plus/icons-vue'
import { scanQrCode } from '@/api/login'

defineOptions({ name: 'QrScan' })

const route = useRoute()
const scanSuccess = ref(false)

// 处理扫码逻辑
const handleScan = async () => {
  const qrCodeId = route.query.id as string
  const tenantName = route.query.tenantName as string
  
  if (!qrCodeId || !tenantName) {
    ElMessage.error('无效的二维码')
    return
  }
  
  try {
    console.log('处理扫码请求:', { qrCodeId, tenantName })
    await scanQrCode(qrCodeId)
    scanSuccess.value = true
    console.log('扫码成功')
  } catch (error) {
    console.error('扫码失败:', error)
    ElMessage.error('扫码失败，请重试')
  }
}

// 组件挂载时自动处理扫码
onMounted(() => {
  handleScan()
})
</script>

<style scoped>
.qr-scan-container {
  display: flex;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #f5f7fa;
  flex-direction: column;
}

.qr-scan-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgb(0 0 0 / 5%);
}

.qr-scan-logo {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.qr-scan-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.qr-scan-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.qr-scan-icon {
  margin-bottom: 20px;
  font-size: 60px;
}

.success-icon {
  color: #67c23a;
}

.loading-icon {
  color: #409eff;
}

.qr-scan-message {
  margin-bottom: 10px;
  font-size: 24px;
  font-weight: 500;
  color: #303133;
}

.qr-scan-detail {
  margin-bottom: 30px;
  font-size: 16px;
  color: #606266;
}

.qr-scan-footer {
  padding: 20px;
  font-size: 14px;
  color: #909399;
  text-align: center;
}
</style> 