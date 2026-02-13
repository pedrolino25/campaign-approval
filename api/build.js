import archiver from "archiver"
import { build } from "esbuild"
import { createWriteStream, existsSync, statSync } from "fs"
import { mkdir, readFile, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const entryPoints = {
  "api/organization": "src/handlers/organization.ts",
  "api/client": "src/handlers/client.ts",
  "api/review": "src/handlers/review.ts",
  "api/attachment": "src/handlers/attachment.ts",
  "api/comment": "src/handlers/comment.ts",
  "api/notification": "src/handlers/notification.ts",
  "api/documentation": "src/handlers/documentation.ts",
  "api/workers/email.worker": "src/workers/email.worker.ts",
  "api/workers/review-reminder.worker": "src/workers/review-reminder.worker.ts",
}

async function buildLambda() {
  const distDir = join(__dirname, "dist")
  await mkdir(distDir, { recursive: true })

  await Promise.all(
    Object.entries(entryPoints).map(async ([outfile, entryPoint]) => {
      await build({
        entryPoints: [join(__dirname, entryPoint)],
        bundle: true,
        platform: "node",
        target: "node18",
        format: "cjs",
        outfile: join(distDir, `${outfile}.js`),
        minify: true,
        sourcemap: false,
        external: ["@aws-sdk/*"],
      })
    })
  )

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

  await writeFile(
    join(distDir, "package.json"),
    packageJsonContent,
    "utf-8"
  )

  const zipPath = join(__dirname, "dist", "lambda.zip")
  const output = createWriteStream(zipPath)
  const archive = archiver("zip", { zlib: { level: 9 } })

  archive.pipe(output)

  archive.file(join(distDir, "package.json"), { name: "package.json" })
  for (const [outfile] of Object.entries(entryPoints)) {
    const sourcePath = join(distDir, `${outfile}.js`)
    archive.file(sourcePath, { name: `${outfile}.js` })
  }
  
  // Include OpenAPI specification file
  const openApiSourcePath = join(__dirname, "openapi", "worklient.v1.json")
  if (existsSync(openApiSourcePath)) {
    archive.file(openApiSourcePath, { name: "openapi/worklient.v1.json" })
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
