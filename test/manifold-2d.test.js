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

test("initializes from embedded WASM in a browser-like runtime", async () => {
  const originalProcess = globalThis.process
  const originalWindow = globalThis.window
  const OriginalURL = globalThis.URL

  try {
    globalThis.process = undefined
    globalThis.window = {}
    globalThis.URL = class URLWithoutModuleBase {
      constructor() {
        throw new TypeError("Failed to construct 'URL': Invalid URL")
      }
    }

    const browserRuntime = await import(`../index.js?browser=${Date.now()}`)
    const manifold = await browserRuntime.getManifoldModule()
    assert.equal(manifold.CrossSection.square([4, 5]).area(), 20)
  } finally {
    globalThis.process = originalProcess
    globalThis.URL = OriginalURL
    if (originalWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = originalWindow
    }
  }
})
