const Taro = {
  getStorageSync: jest.fn(() => ''),
  setStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  switchTab: jest.fn(),
  reLaunch: jest.fn(),
  redirectTo: jest.fn(),
  chooseMedia: jest.fn(),
  uploadFile: jest.fn(),
  authorize: jest.fn(),
  canvasToTempFilePath: jest.fn(),
  saveImageToPhotosAlbum: jest.fn(),
}
export default Taro
export const getStorageSync = Taro.getStorageSync
export const setStorageSync = Taro.setStorageSync
export const removeStorageSync = Taro.removeStorageSync
export const showToast = Taro.showToast
export const showModal = Taro.showModal
export const navigateTo = Taro.navigateTo
export const switchTab = Taro.switchTab
export const reLaunch = Taro.reLaunch
export const redirectTo = Taro.redirectTo
export const chooseMedia = Taro.chooseMedia
export const uploadFile = Taro.uploadFile
export const authorize = Taro.authorize
