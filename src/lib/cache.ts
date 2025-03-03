import { promises as fs } from 'fs'
import path from 'path'

const CACHE_DIR = path.join(process.cwd(), '.cache')
const CACHE_FILE = path.join(CACHE_DIR, 'instagram-cache.json')

// Ensure cache directory exists
async function ensureCacheDirectory() {
  try {
    await fs.access(CACHE_DIR)
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  }
}

// Read from cache file
export async function readCache() {
  try {
    await ensureCacheDirectory()
    const data = await fs.readFile(CACHE_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

// Write to cache file
export async function writeCache(cache: Record<string, { data: any; timestamp: number }>) {
  try {
    await ensureCacheDirectory()
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2))
    console.log('Cache written successfully:', CACHE_FILE)
  } catch (error) {
    console.error('Failed to write cache:', error)
  }
} 