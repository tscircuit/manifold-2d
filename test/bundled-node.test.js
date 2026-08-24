import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import { build } from "esbuild"

const execFileAsync = promisify(execFile)
const root = fileURLToPath(new URL("../", import.meta.url))

test("initializes embedded WASM from a standalone Node bundle", async () => {
  const tempDirectory = await mkdtemp(join(tmpdir(), "manifold-2d-node-test-"))
  const bundlePath = join(tempDirectory, "bundle.mjs")

  try {
    await build({
      bundle: true,
      format: "esm",
      outfile: bundlePath,
      platform: "node",
      stdin: {
        contents: `
          import { getManifoldModule } from "./index.js"

          const manifold = await getManifoldModule()
          console.log(manifold.CrossSection.square([4, 5]).area())
        `,
        resolveDir: root,
        sourcefile: "node-entry.js",
      },
    })

    const { stdout } = await execFileAsync(process.execPath, [bundlePath])
    assert.equal(stdout.trim(), "20")
  } finally {
    await rm(tempDirectory, { recursive: true, force: true })
  }
})
