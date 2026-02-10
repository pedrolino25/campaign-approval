import { build } from "esbuild"
import { mkdir, writeFile, readFile } from "fs/promises"
import { createWriteStream } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import archiver from "archiver"

const __dirname = dirname(fileURLToPath(import.meta.url))

const entryPoints = {
  "api/organization": "src/api/organization.ts",
  "api/client": "src/api/client.ts",
  "api/review": "src/api/review.ts",
  "api/attachment": "src/api/attachment.ts",
  "api/comment": "src/api/comment.ts",
  "api/notification": "src/api/notification.ts",
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

  await archive.finalize()

  await new Promise((resolve, reject) => {
    output.on("close", resolve)
    output.on("error", reject)
  })

  console.log("Lambda build complete:", zipPath)
}

buildLambda().catch((error) => {
  console.error("Build failed:", error)
  process.exit(1)
})
