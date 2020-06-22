import path from 'path'

export const contentPath = (...ps: string[]) =>
  path.join(__dirname, '../content', ...ps)
