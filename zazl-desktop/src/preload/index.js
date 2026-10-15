import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getCustomers: () => ipcRenderer.invoke('db:getCustomers'),
  getPayments: () => ipcRenderer.invoke('db:getPayments'),
  getRefunds: () => ipcRenderer.invoke('db:getRefunds'),
  forceSync: () => ipcRenderer.invoke('sync:force'),
  addCustomer: (customer) => ipcRenderer.invoke('db:addCustomer', customer),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
