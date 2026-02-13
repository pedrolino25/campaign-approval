/* eslint-disable no-console */
import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { generateOpenAPISpec } from '../src/lib/openapi/openapi.spec'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

async function main(): Promise<void> {
  try {
    const spec = generateOpenAPISpec()
    const outputPath = join(rootDir, 'openapi', 'worklient.v1.json')
    
    // Ensure directory exists
    await mkdir(join(rootDir, 'openapi'), { recursive: true })
    
    await writeFile(outputPath, JSON.stringify(spec, null, 2), 'utf-8')
    
    console.log(`✅ OpenAPI spec generated: ${outputPath}`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to generate OpenAPI spec:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})
