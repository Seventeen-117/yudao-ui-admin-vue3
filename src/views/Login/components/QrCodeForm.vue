<template>
  <el-row v-show="getShow" class="login-form" style="margin-right: -10px; margin-left: -10px">
    <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
      <LoginFormTitle style="width: 100%" />
    </el-col>
    <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
      <el-card class="mb-10px text-center" shadow="hover">
        <div v-if="qrCodeUrl" class="qr-code-container">
          <!-- 如果是base64图片，直接显示图片 -->
          <img v-if="isBase64Image" :src="qrCodeUrl" class="qr-code-image" alt="QR Code" />
          <!-- 如果是普通URL，使用Qrcode组件 -->
          <Qrcode v-else :value="qrCodeUrl" :logo="logoImg" :options="qrCodeOptions" />
          <div class="mt-2 text-gray-500">{{ getStatusText(qrCodeStatus) }}</div>
          <div class="refresh-btn" v-if="qrCodeStatus === 'EXPIRED'" @click="generateQrCode">
            <i class="el-icon-refresh"></i>
            <span>{{ t('login.qrcode.refresh') }}</span>
          </div>
        </div>
        <div v-else class="loading-container">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span class="ml-2">{{ t('login.qrcode.generating') }}</span>
        </div>
      </el-card>
    </el-col>
    <el-divider class="enter-x">{{ t('login.qrcodeText') }}</el-divider>
    <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
      <div class="mt-15px w-[100%]">
        <XButton :title="t('login.backLogin')" class="w-[100%]" @click="handleBackLogin()" />
      </div>
    </el-col>
  </el-row>

  <!-- 二维码扫描后的登录对话框 -->
  <el-dialog
    v-model="loginDialogVisible"
    :title="t('login.qrcode.scanLogin')"
    width="400px"
    :close-on-click-modal="false"
    :show-close="false"
  >
    <div class="login-dialog-content">
      <p class="login-dialog-tenant">{{ t('login.tenantname') }}: {{ getTenantName() }}</p>
      
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="80px">
        <el-form-item :label="t('login.username')" prop="username">
          <el-input v-model="loginForm.username" :placeholder="t('login.usernamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('login.password')" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            :placeholder="t('login.passwordPlaceholder')"
            show-password
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancelLogin" plain>{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="confirmLogin" :loading="loginLoading">
          {{ t('login.login') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import logoImg from '@/assets/imgs/logo.png'
import LoginFormTitle from './LoginFormTitle.vue'
import { LoginStateEnum, useLoginState } from './useLogin'
import { useUserStore } from '@/store/modules/user'
import { useRouter } from 'vue-router'
import { createQrCode, getQrCodeStatus, verifyQrCode, scanQrCode } from '@/api/login'
import { getTenantName, setTenantId } from '@/utils/auth'

defineOptions({ name: 'QrCodeForm' })

const { t } = useI18n()
const { handleBackLogin, getLoginState } = useLoginState()
const getShow = computed(() => unref(getLoginState) === LoginStateEnum.QR_CODE)

const userStore = useUserStore()
const router = useRouter()

const qrCodeUrl = ref('')
const qrCodeId = ref('')
const qrCodeStatus = ref('')
const statusCheckInterval = ref<number | null>(null)

// 登录对话框相关
const loginDialogVisible = ref(false)
const loginLoading = ref(false)
const loginFormRef = ref<FormInstance>()
const loginForm = ref({
  username: '',
  password: ''
})

// 登录表单验证规则
const loginRules = ref<FormRules>({
  username: [
    { required: true, message: t('login.usernamePlaceholder'), trigger: 'blur' }
  ],
  password: [
    { required: true, message: t('login.passwordPlaceholder'), trigger: 'blur' }
  ]
})

// 判断是否为base64图片
const isBase64Image = computed(() => {
  return qrCodeUrl.value.startsWith('data:image/')
})

// 二维码配置
const qrCodeOptions = {
  width: 200,
  margin: 5,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  if (!status) return ''
  
  const statusMap: Record<string, string> = {
    UNUSED: t('login.qrcode.waitScan'),
    SCANNED: t('login.qrcode.scanned'),
    CONFIRMED: t('login.qrcode.confirmed'),
    EXPIRED: t('login.qrcode.expired'),
    CANCELED: t('login.qrcode.canceled')
  }
  
  return statusMap[status] || status
}

// 生成二维码
const generateQrCode = async () => {
  try {
    qrCodeUrl.value = ''
    qrCodeId.value = ''
    qrCodeStatus.value = ''
    stopStatusCheck()
    
    // 使用固定的租户名称 - 江阳科技
    const tenantName = getTenantName()
    console.log('Generating QR code for tenant:', tenantName)
    
    // 调用API获取二维码
    const result = await createQrCode(tenantName)
    console.log('QR Code API response:', result)
    
    // 处理返回结果
    if (result) {
      // API返回字段为id和qrCodeBase64，使用后端返回的二维码数据
      qrCodeId.value = result.id
      
      if (result.qrCodeBase64) {
        // 如果后端返回了Base64图片，直接使用
        qrCodeUrl.value = result.qrCodeBase64
      } else {
        // 如果后端没有返回Base64图片，则创建URL（后备方案）
        const baseUrl = window.location.origin + '/qr-login'
        const qrUrl = new URL(baseUrl)
        qrUrl.searchParams.append('id', qrCodeId.value)
        qrUrl.searchParams.append('tenantName', tenantName)
        qrCodeUrl.value = qrUrl.toString()
      }
      
      console.log('Formatted QR code URL:', qrCodeUrl.value)
      
      if (qrCodeUrl.value && qrCodeId.value) {
        qrCodeStatus.value = 'UNUSED'
        startStatusCheck()
        console.log('QR code generated successfully:', { id: qrCodeId.value, url: qrCodeUrl.value })
      } else {
        console.error('Invalid QR code data received:', result)
        ElMessage.error(t('login.qrcode.generateError'))
      }
    } else {
      console.error('No response received from QR code API')
      ElMessage.error(t('login.qrcode.generateError'))
    }
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    ElMessage.error(t('login.qrcode.generateError'))
  }
}

// 检查二维码状态
const checkQrCodeStatus = async () => {
  if (!qrCodeId.value) return
  
  try {
    // 使用固定的租户名称 - 江阳科技
    const tenantName = getTenantName()
    const result = await getQrCodeStatus(qrCodeId.value, tenantName)
    console.log('QR code status response:', result)
    
    if (result && result.status) {
      const prevStatus = qrCodeStatus.value
      qrCodeStatus.value = result.status
      
      if (result.status === 'SCANNED' && prevStatus !== 'SCANNED') {
        // 当状态首次变为SCANNED时，说明二维码已被扫描
        // 在移动端已经调用了scan-qr-code接口，所以这里不需要再次调用
        
        // 二维码已扫描，显示登录对话框
        showLoginDialog()
        // 显示消息提示
        ElMessage.success(t('login.qrcode.scanSuccess'))
      } else if (result.status === 'CONFIRMED') {
        // 二维码已确认，停止检查并进行登录验证
        stopStatusCheck()
        await handleVerifyQrCode()
      } else if (result.status === 'EXPIRED') {
        // 二维码过期，停止检查状态
        stopStatusCheck()
        ElMessage.warning(t('login.qrcode.expired'))
      } else if (result.status === 'CANCELED') {
        // 二维码被取消
        stopStatusCheck()
        ElMessage.warning(t('login.qrcode.canceled'))
        // 隐藏登录对话框
        loginDialogVisible.value = false
      }
    }
  } catch (error) {
    console.error('Failed to check QR code status:', error)
  }
}

// 通知后端二维码已扫描
const notifyScanQrCode = async (qrCodeId: string) => {
  try {
    console.log('Notifying scan QR code:', qrCodeId)
    await scanQrCode(qrCodeId)
    console.log('QR code scan notification sent successfully')
  } catch (error) {
    console.error('Failed to notify QR code scan:', error)
  }
}

// 显示登录对话框
const showLoginDialog = () => {
  loginForm.value.username = ''
  loginForm.value.password = ''
  loginDialogVisible.value = true
}

// 取消登录
const cancelLogin = () => {
  loginDialogVisible.value = false
  // 取消登录可以考虑添加一个取消接口调用，通知后端用户取消了登录
  // 现在我们简单地设置状态为CANCELED
  qrCodeStatus.value = 'CANCELED'
}

// 确认登录
const confirmLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loginLoading.value = true
        
        // 调用验证二维码登录接口
        const result = await verifyQrCode({
          qrCodeId: qrCodeId.value,
          username: loginForm.value.username,
          password: loginForm.value.password
        })
        
        loginLoading.value = false
        loginDialogVisible.value = false
        
        if (result && result.token) {
          // 登录成功，保存token并跳转
          localStorage.setItem('token', result.token)
          await userStore.setUserInfoAction()
          router.push('/')
        } else {
          console.error('Invalid verification response:', result)
          ElMessage.error(t('login.qrcode.verifyError'))
        }
      } catch (error) {
        loginLoading.value = false
        console.error('Failed to verify QR code:', error)
        ElMessage.error(t('login.qrcode.verifyError'))
      }
    }
  })
}

// 验证二维码登录
const handleVerifyQrCode = async () => {
  try {
    const result = await verifyQrCode({ qrCodeId: qrCodeId.value })
    console.log('QR code verification response:', result)
    
    if (result && result.token) {
      // 登录成功，保存token并跳转
      localStorage.setItem('token', result.token)
      await userStore.setUserInfoAction()
      router.push('/')
    } else {
      console.error('Invalid verification response:', result)
      ElMessage.error(t('login.qrcode.verifyError'))
    }
  } catch (error) {
    console.error('Failed to verify QR code:', error)
    ElMessage.error(t('login.qrcode.verifyError'))
  }
}

// 开始定时检查二维码状态
const startStatusCheck = () => {
  stopStatusCheck()
  statusCheckInterval.value = window.setInterval(checkQrCodeStatus, 2000)
}

// 停止定时检查
const stopStatusCheck = () => {
  if (statusCheckInterval.value) {
    clearInterval(statusCheckInterval.value)
    statusCheckInterval.value = null
  }
}

// 当组件被挂载或登录状态变为二维码登录时，生成二维码
onMounted(() => {
  // 设置租户ID
  const tenantName = getTenantName()
  // 获取租户ID并设置
  import.meta.env.VITE_APP_TENANT_ENABLE === 'true' && setTenantId('1') // 假设江阳科技的租户ID为1
  
  if (getShow.value) {
    generateQrCode()
  }
})

// 监听登录状态变化
watch(() => getLoginState.value, (newVal) => {
  if (newVal === LoginStateEnum.QR_CODE) {
    generateQrCode()
  } else {
    stopStatusCheck()
  }
})

onUnmounted(() => {
  stopStatusCheck()
})
</script>

<style scoped>
.qr-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  border-radius: 4px;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.refresh-btn {
  display: flex;
  margin-top: 10px;
  color: #409eff;
  cursor: pointer;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  opacity: 0.8;
}

.refresh-btn i {
  margin-right: 5px;
}

.login-dialog-content {
  padding: 0 20px;
}

.login-dialog-tenant {
  margin-bottom: 20px;
  font-weight: bold;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
}
</style>
