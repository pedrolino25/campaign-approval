import archiver from "archiver"
import { build } from "esbuild"
import { createWriteStream, existsSync, statSync } from "fs"
import { mkdir, readFile, writeFile, readdir } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const entryPoints = {
  "api/organization": "src/handlers/organization.ts",
  "api/project": "src/handlers/project.ts",
  "api/review": "src/handlers/review.ts",
  "api/attachment": "src/handlers/attachment.ts",
  "api/comment": "src/handlers/comment.ts",
  "api/notification": "src/handlers/notification.ts",
  "api/documentation": "src/handlers/documentation.ts",
  "api/auth": "src/handlers/auth.ts",
  "api/workers/email.worker": "src/workers/email.worker.ts",
  "api/workers/review-reminder.worker": "src/workers/review-reminder.worker.ts",
}

async function copyDirectoryToArchive(
  archive,
  sourceDir,
  targetBasePath,
  basePath = ""
) {
  const entries = await readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(sourceDir, entry.name)
    const archivePath = join(targetBasePath, basePath, entry.name)

    if (entry.isDirectory()) {
      await copyDirectoryToArchive(
        archive,
        fullPath,
        targetBasePath,
        join(basePath, entry.name)
      )
    } else {
      archive.file(fullPath, { name: archivePath })
    }
  }
}

async function buildLambda() {
  const distDir = join(__dirname, "dist")
  await mkdir(distDir, { recursive: true })

  // Build all entry points
  await Promise.all(
    Object.entries(entryPoints).map(async ([outfile, entryPoint]) => {
      // Ensure the output directory exists (for nested paths like api/handlers/auth)
      const outfilePath = join(distDir, `${outfile}.js`)
      const outfileDir = dirname(outfilePath)
      await mkdir(outfileDir, { recursive: true })

      await build({
        entryPoints: [join(__dirname, entryPoint)],
        bundle: true,
        platform: "node",
        target: "node20",
        format: "cjs",
        outfile: outfilePath,
        minify: true,
        sourcemap: false,
        external: [
          "@aws-sdk/*",
          "@prisma/client",
          "prisma",
        ],
      })
    })
  )

  // Create minimal package.json
  const packageJson = JSON.parse(
    await readFile(join(__dirname, "package.json"), "utf-8")
  )

  const dependencies = packageJson.dependencies || {}

  const packageJsonContent = JSON.stringify(
    {
      name: "lambda",
      version: "1.0.0",
      type: "commonjs",
      dependencies,
    },
    null,
    2
  )

  await writeFile(join(distDir, "package.json"), packageJsonContent, "utf-8")

  // Create zip
  const zipPath = join(distDir, "lambda.zip")
  const output = createWriteStream(zipPath)
  const archive = archiver("zip", { zlib: { level: 9 } })

  archive.pipe(output)

  // Add compiled handlers
  for (const [outfile] of Object.entries(entryPoints)) {
    const sourcePath = join(distDir, `${outfile}.js`)
    if (!existsSync(sourcePath)) {
      throw new Error(`Built file not found: ${sourcePath}`)
    }
    archive.file(sourcePath, { name: `${outfile}.js` })
  }

  // Auto-generated API index
  // Exclude auth handler as it's accessed directly via api.handlers.auth.handler
  const apiHandlers = Object.keys(entryPoints)
    .filter((key) => key.startsWith("api/") && !key.includes("workers") && !key.includes("handlers/"))
    .map((key) => key.replace("api/", ""))

  const apiIndexContent = `// Auto-generated index for Lambda handler resolution
  ${apiHandlers.map((handler) => `const ${handler} = require('./${handler}');`).join('\n')}

  module.exports = {
  ${apiHandlers.map((handler) => `  ${handler},`).join('\n')}
  };`

  archive.append(apiIndexContent.trim(), { name: "api/index.js" })

  // Add package.json
  archive.file(join(distDir, "package.json"), { name: "package.json" })

  // ✅ Include Prisma engine binaries (.prisma)
  const prismaClientPath = join(__dirname, "node_modules", ".prisma", "client")
  if (existsSync(prismaClientPath)) {
    await copyDirectoryToArchive(
      archive,
      prismaClientPath,
      "node_modules/.prisma/client"
    )
  }

  // ✅ Include @prisma/client runtime
  const prismaRuntimePath = join(__dirname, "node_modules", "@prisma", "client")
  if (existsSync(prismaRuntimePath)) {
    await copyDirectoryToArchive(
      archive,
      prismaRuntimePath,
      "node_modules/@prisma/client"
    )
  }

  // ✅ Include OpenAPI spec
  const openApiSourcePath = join(__dirname, "openapi", "worklient.v1.json")
  if (existsSync(openApiSourcePath)) {
    archive.file(openApiSourcePath, {
      name: "openapi/worklient.v1.json",
    })
  }

  await archive.finalize()

  await new Promise((resolve, reject) => {
    output.on("close", () => {
      if (!existsSync(zipPath)) {
        reject(new Error(`Lambda zip file was not created at ${zipPath}`))
        return
      }

      const stats = statSync(zipPath)
      if (stats.size === 0) {
        reject(new Error(`Lambda zip file is empty at ${zipPath}`))
        return
      }

      console.log(`Lambda build complete: ${zipPath} (${stats.size} bytes)`)
      resolve()
    })

    output.on("error", reject)
  })
}

buildLambda().catch((error) => {
  console.error("Build failed:", error)
  console.error("Error stack:", error.stack)
  process.exit(1)
})
