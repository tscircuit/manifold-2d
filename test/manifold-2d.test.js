import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import {
  getManifoldModule,
  getManifoldModuleSync,
} from "../index.js"

test("initializes the vendored runtime and performs 2D geometry", async () => {
  assert.equal(getManifoldModuleSync(), null)

  const manifold = await getManifoldModule()
  const square = manifold.CrossSection.square([10, 10])
  const inset = square.offset(-1, "Miter")

  assert.equal(square.area(), 100)
  assert.equal(inset.area(), 64)
  assert.equal(getManifoldModuleSync(), manifold)
})

test("has no install dependencies", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  )

  assert.deepEqual(packageJson.dependencies ?? {}, {})
  assert.deepEqual(packageJson.optionalDependencies ?? {}, {})
  assert.deepEqual(packageJson.peerDependencies ?? {}, {})
})
