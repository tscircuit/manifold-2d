import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"

const root = new URL("../", import.meta.url)
const manifest = JSON.parse(
  await readFile(new URL("vendor/manifest.json", root), "utf8"),
)

for (const [filename, expectedHash] of Object.entries(manifest.files)) {
  const contents = await readFile(new URL(`vendor/${filename}`, root))
  const actualHash = createHash("sha256").update(contents).digest("hex")
  if (actualHash !== expectedHash) {
    throw new Error(
      `${filename} has SHA-256 ${actualHash}; expected ${expectedHash}`,
    )
  }
}

console.log(`Verified vendored manifold-3d@${manifest.version}`)
