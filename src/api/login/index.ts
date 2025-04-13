import request from '@/config/axios'
import { getRefreshToken } from '@/utils/auth'
import type { RegisterVO, UserLoginVO } from './types'

export interface SmsCodeVO {
  mobile: string
  scene: number
}

export interface SmsLoginVO {
  mobile: string
  code: string
}

// 登录
export const login = (data: UserLoginVO) => {
  return request.post({ url: '/system/auth/login', data })
}

// 注册
export const register = (data: RegisterVO) => {
  return request.post({ url: '/system/auth/register', data })
}

// 使用租户名，获得租户编号
export const getTenantIdByName = (name: string) => {
  return request.get({ url: '/system/tenant/get-id-by-name?name=' + name })
}

// 使用租户域名，获得租户信息
export const getTenantByWebsite = (website: string) => {
  return request.get({ url: '/system/tenant/get-by-website?website=' + website })
}

// 登出
export const loginOut = () => {
  return request.post({ url: '/system/auth/logout' })
}

// 获取用户权限信息
export const getInfo = () => {
  return request.get({ url: '/system/auth/get-permission-info' })
}

//获取登录验证码
export const sendSmsCode = (data: SmsCodeVO) => {
  return request.post({ url: '/system/auth/send-sms-code', data })
}

// 短信验证码登录
export const smsLogin = (data: SmsLoginVO) => {
  return request.post({ url: '/system/auth/sms-login', data })
}

// 社交快捷登录，使用 code 授权码
export function socialLogin(type: string, code: string, state: string) {
  return request.post({
    url: '/system/auth/social-login',
    data: {
      type,
      code,
      state
    }
  })
}

// 社交授权的跳转
export const socialAuthRedirect = (type: number, redirectUri: string) => {
  return request.get({
    url: '/system/auth/social-auth-redirect?type=' + type + '&redirectUri=' + redirectUri
  })
}
// 获取验证图片以及 token
export const getCode = (data: any) => {
  debugger
  return request.postOriginal({ url: 'system/captcha/get', data })
}

// 滑动或者点选验证
export const reqCheck = (data: any) => {
  return request.postOriginal({ url: 'system/captcha/check', data })
}

// 通过短信重置密码
export const smsResetPassword = (data: any) => {
  return request.post({ url: '/system/auth/reset-password', data })
}

// 创建登录二维码
export interface QrCodeVO {
  id: string
  url?: string
  qrCodeBase64?: string
}

// 获取二维码状态
export interface QrCodeStatusVO {
  status: string
}

// 二维码登录验证响应
export interface QrCodeLoginVO {
  token: string
  refreshToken: string
}

// 创建登录二维码
export const createQrCode = (tenantName: string) => {
  console.log('Creating QR code with tenant:', tenantName)
  return request.post<QrCodeVO>({ 
    url: `/system/auth/create-qr-code?tenantName=${encodeURIComponent(tenantName)}` 
  })
}

// 获取二维码状态
export const getQrCodeStatus = (qrCodeId: string, tenantName: string) => {
  console.log('Checking QR code status with tenant:', tenantName)
  return request.get<QrCodeStatusVO>({ 
    url: `/system/auth/get-qr-code-status?qrCodeId=${qrCodeId}&tenantName=${encodeURIComponent(tenantName)}` 
  })
}

// 验证二维码登录
export const verifyQrCode = (data: { qrCodeId: string, username?: string, password?: string }) => {
  return request.post<QrCodeLoginVO>({ 
    url: '/system/auth/verify-qr-code', 
    data 
  })
}

// 扫描二维码
export const scanQrCode = (qrCodeId: string) => {
  return request.post<boolean>({ 
    url: `/system/auth/scan-qr-code?qrCodeId=${qrCodeId}` 
  })
}
