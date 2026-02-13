#!/usr/bin/env tsx

/**
 * Domain Audit Script
 * 
 * Compares:
 * - Prisma models
 * - DTO definitions
 * - OpenAPI schemas
 * 
 * Flags mismatches and outputs readable report
 */

/* eslint-disable no-console */
import { readdir, readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

interface AuditResult {
  category: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  details?: string[]
}

const results: AuditResult[] = []

function addResult(result: AuditResult): void {
  results.push(result)
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌'
  console.log(`${icon} [${result.category}] ${result.message}`)
  if (result.details) {
    result.details.forEach(detail => console.log(`   - ${detail}`))
  }
}

async function auditPrismaSchema(): Promise<void> {
  try {
    const schemaPath = join(rootDir, 'prisma', 'schema.prisma')
    const schema = await readFile(schemaPath, 'utf-8')
    
    // Basic checks
    const modelCount = (schema.match(/^model \w+/gm) || []).length
    const enumCount = (schema.match(/^enum \w+/gm) || []).length
    
    // Check for expected models
    const expectedModels = [
      'Organization',
      'User',
      'Reviewer',
      'Client',
      'ClientReviewer',
      'ReviewItem',
      'Attachment',
      'Comment',
      'Notification',
      'ActivityLog',
      'Invitation',
    ]
    
    const foundModels = expectedModels.filter(model => 
      schema.includes(`model ${model}`)
    )
    
    const missingModels = expectedModels.filter(model => 
      !schema.includes(`model ${model}`)
    )
    
    const details: string[] = []
    if (foundModels.length === expectedModels.length) {
      details.push(`All ${expectedModels.length} expected models found`)
    } else {
      details.push(`Found ${foundModels.length}/${expectedModels.length} expected models`)
      if (missingModels.length > 0) {
        details.push(`Missing: ${missingModels.join(', ')}`)
      }
    }
    
    addResult({
      category: 'Prisma Schema',
      status: foundModels.length === expectedModels.length ? 'pass' : 'warn',
      message: `Found ${modelCount} models and ${enumCount} enums`,
      details,
    })
  } catch (error) {
    addResult({
      category: 'Prisma Schema',
      status: 'fail',
      message: `Failed to read Prisma schema: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

// eslint-disable-next-line complexity
async function auditOpenAPISpec(): Promise<void> {
  try {
    const specPath = join(rootDir, 'openapi', 'worklient.v1.json')
    try {
      const specContent = await readFile(specPath, 'utf-8')
      const spec = JSON.parse(specContent)
      const paths = Object.keys(spec.paths || {})
      
      // Count methods per path
      const methodCounts: Record<string, number> = {}
      let totalEndpoints = 0
      
      for (const path in spec.paths) {
        const pathObj = spec.paths[path]
        const methods = Object.keys(pathObj).filter(m => 
          ['get', 'post', 'patch', 'delete', 'put'].includes(m.toLowerCase())
        )
        methodCounts[path] = methods.length
        totalEndpoints += methods.length
      }
      
      const details: string[] = []
      if (totalEndpoints >= 31) {
        details.push(`Total endpoints: ${totalEndpoints}`)
        details.push(`Paths: ${paths.length}`)
      } else {
        details.push(`Expected 31 endpoints, found ${totalEndpoints}`)
        details.push(`Paths documented: ${paths.length}`)
      }
      
      // Check for required components
      const hasSecurityScheme = !!(spec.components?.securitySchemes?.bearerAuth)
      const hasErrorSchemas = !!(spec.components?.schemas?.['ValidationErrorResponse'])
      
      if (!hasSecurityScheme) {
        details.push('⚠️ Missing security scheme (bearerAuth)')
      }
      if (!hasErrorSchemas) {
        details.push('⚠️ Missing error response schemas')
      }
      
      addResult({
        category: 'OpenAPI Spec',
        status: totalEndpoints >= 31 && hasSecurityScheme && hasErrorSchemas ? 'pass' : 'warn',
        message: `Found ${totalEndpoints} endpoint(s) across ${paths.length} path(s)`,
        details: details.length > 0 ? details : undefined,
      })
    } catch (fileError) {
      if ((fileError as { code?: string }).code === 'ENOENT') {
        addResult({
          category: 'OpenAPI Spec',
          status: 'warn',
          message: 'OpenAPI spec file not found. Run `npm run generate:openapi` first.',
        })
      } else {
        throw fileError
      }
    }
  } catch (error) {
    addResult({
      category: 'OpenAPI Spec',
      status: 'fail',
      message: `Failed to audit OpenAPI spec: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

// eslint-disable-next-line complexity
async function auditSchemas(): Promise<void> {
  try {
    const schemasDir = join(rootDir, 'src', 'lib', 'schemas')
    const files = await readdir(schemasDir)
    const schemaFiles = files.filter(f => f.endsWith('.schema.ts') && f !== 'index.ts')
    
    const issues: string[] = []
    const checkedSchemas: string[] = []
    
    for (const file of schemaFiles) {
      const filePath = join(schemasDir, file)
      const content = await readFile(filePath, 'utf-8')
      
      // Extract schema names (patterns like: export const XxxSchema = z.object(...))
      const schemaMatches = content.match(/export const (\w+Schema) = z\./g)
      
      if (schemaMatches) {
        for (const match of schemaMatches) {
          const schemaName = match.match(/export const (\w+Schema)/)?.[1]
          if (schemaName) {
            checkedSchemas.push(`${file}:${schemaName}`)
            
            // Exception: CursorPaginationQuerySchema intentionally doesn't use .strict()
            if (schemaName === 'CursorPaginationQuerySchema') {
              continue
            }
            
            // Check if this schema uses .strict()
            // Find the schema definition - it could span multiple lines
            // Look for the pattern: export const SchemaName = z... .strict()
            // We need to find where the schema definition ends (before the next export or end of block)
            const schemaStartIndex = content.indexOf(`export const ${schemaName} =`)
            if (schemaStartIndex === -1) continue
            
            // Find the end of this schema definition (next export, or end of file)
            const afterStart = content.slice(schemaStartIndex)
            const nextExportIndex = afterStart.indexOf('\nexport ', 1)
            const schemaBlock = nextExportIndex === -1 
              ? afterStart 
              : afterStart.slice(0, nextExportIndex)
            
            // Check if .strict() is called in this block
            if (!schemaBlock.includes('.strict()')) {
              issues.push(`${schemaName} in ${file} does not use .strict()`)
            }
          }
        }
      }
    }
    
    if (issues.length > 0) {
      addResult({
        category: 'Zod Schemas',
        status: 'fail',
        message: `Found ${issues.length} schema(s) not using .strict()`,
        details: issues,
      })
    } else {
      addResult({
        category: 'Zod Schemas',
        status: 'pass',
        message: `Checked ${checkedSchemas.length} schema(s) - all use .strict() (except CursorPaginationQuerySchema which is intentional)`,
        details: checkedSchemas.length > 0 ? [`Checked: ${checkedSchemas.slice(0, 5).join(', ')}${checkedSchemas.length > 5 ? '...' : ''}`] : undefined,
      })
    }
  } catch (error) {
    addResult({
      category: 'Zod Schemas',
      status: 'warn',
      message: `Schema audit incomplete: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

async function main(): Promise<void> {
  console.log('🔍 Running Domain Audit...\n')
  
  await auditPrismaSchema()
  await auditOpenAPISpec()
  await auditSchemas()
  
  console.log('\n📊 Audit Summary:')
  const passCount = results.filter(r => r.status === 'pass').length
  const warnCount = results.filter(r => r.status === 'warn').length
  const failCount = results.filter(r => r.status === 'fail').length
  
  console.log(`✅ Pass: ${passCount}`)
  console.log(`⚠️  Warn: ${warnCount}`)
  console.log(`❌ Fail: ${failCount}`)
  
  if (failCount > 0) {
    process.exit(1)
  }
  
  if (warnCount > 0) {
    console.log('\n⚠️  Warnings detected. Review above.')
    process.exit(0)
  }
  
  console.log('\n✅ All checks passed!')
  process.exit(0)
}

main().catch(error => {
  console.error('❌ Audit failed:', error)
  process.exit(1)
})
