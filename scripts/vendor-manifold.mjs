import { createHash } from "node:crypto"
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
const manifestPath = join(root, "vendor", "manifest.json")
const currentManifest = JSON.parse(readFileSync(manifestPath, "utf8"))
const version = process.argv[2] ?? currentManifest.version
const temp = mkdtempSync(join(tmpdir(), "manifold-2d-vendor-"))
const sourceFilenames = [
  "manifold-encapsulated-types.d.ts",
  "manifold-global-types.d.ts",
  "manifold.d.ts",
  "manifold.js",
  "manifold.wasm",
]
const generatedFilenames = ["manifold.wasm.base64.js"]

try {
  const packResult = JSON.parse(
    execFileSync(
      "npm",
      ["pack", `manifold-3d@${version}`, "--pack-destination", temp, "--json"],
      { encoding: "utf8" },
    ),
  )[0]
  const tarball = join(temp, packResult.filename)
  execFileSync("tar", ["-xzf", tarball, "-C", temp])

  for (const filename of sourceFilenames) {
    const source = join(temp, "package", filename)
    const destination = join(root, "vendor", filename)
    copyFileSync(source, destination)
  }
  execFileSync(process.execPath, [
    join(root, "scripts", "generate-embedded-wasm.mjs"),
  ])

  const hashes = {}
  for (const filename of [...sourceFilenames, ...generatedFilenames]) {
    const destination = join(root, "vendor", filename)
    hashes[filename] = createHash("sha256")
      .update(readFileSync(destination))
      .digest("hex")
  }
  copyFileSync(join(temp, "package", "LICENSE"), join(root, "LICENSE"))

  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        package: "manifold-3d",
        version,
        tarballIntegrity: packResult.integrity,
        files: hashes,
      },
      null,
      2,
    )}\n`,
  )
  console.log(`Vendored manifold-3d@${version}`)
} finally {
  rmSync(temp, { recursive: true, force: true })
}
