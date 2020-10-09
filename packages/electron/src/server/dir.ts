import { spawnSync } from 'child_process'
import path from 'path'

import { app } from 'electron'
import fs from 'fs-extra'

export const userDataDir =
  process.env.DATA_DIR ||
  path.resolve(app.getPath('userData'), 'make-html', 'user')
export const mediaDir = path.join(userDataDir, 'media')
export const dataDir = path.join(userDataDir, 'data')

if (!fs.existsSync(userDataDir)) {
  fs.mkdirpSync(mediaDir)
  fs.mkdirpSync(dataDir)

  spawnSync('git', ['init'], {
    stdio: 'inherit',
    cwd: userDataDir
  })
}
