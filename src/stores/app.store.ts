import { defineStore } from 'pinia'
import { ref } from 'vue'

export type DeviceMode = 'mobile' | 'tablet' | 'desktop'
export type ThemeMode = 'light' | 'dark'

export const useAppStore = defineStore('app', () => {
  const deviceMode = ref<DeviceMode>('mobile')
  const themeMode = ref<ThemeMode>('light')

  const deviceWidths: Record<DeviceMode, number> = {
    mobile: 375,
    tablet: 768,
    desktop: 1280,
  }

  function setDeviceMode(mode: DeviceMode) {
    deviceMode.value = mode
  }

  function toggleTheme() {
    themeMode.value = themeMode.value === 'light' ? 'dark' : 'light'
    document.documentElement.classList.toggle('dark', themeMode.value === 'dark')
  }

  return {
    deviceMode,
    themeMode,
    deviceWidths,
    setDeviceMode,
    toggleTheme,
  }
})
