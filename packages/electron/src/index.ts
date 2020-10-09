import { fork } from 'child_process'
import path from 'path'

import death from 'death'
import { BrowserWindow, app } from 'electron'
import contextMenu from 'electron-context-menu'

import { ROOT } from './shared'

contextMenu()

let url: string | null = null

const srv = fork(path.resolve(__dirname, 'server/index.js'), {
  stdio: 'inherit'
})

srv.on('message', (msg: { type: string; url: string }) => {
  if (msg.type === 'started') {
    url = msg.url
  }
})

death(() => {
  srv.kill()
})

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 768
  })
  win.maximize()

  if (url) {
    win.loadURL(url)
  } else {
    win.loadFile(path.resolve(ROOT, 'public/loading.html'))

    // eslint-disable-next-line no-unmodified-loop-condition
    while (!url) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    win.loadURL(url)
  }
})

app.on('will-quit', () => {
  srv.kill()
})
