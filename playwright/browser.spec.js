import { expect, test } from "@playwright/test"
import { build } from "esbuild"
import { createServer } from "node:http"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
let server
let baseUrl
let tempDirectory

test.beforeAll(async () => {
  tempDirectory = await mkdtemp(join(tmpdir(), "manifold-2d-browser-test-"))
  const bundlePath = join(tempDirectory, "bundle.js")

  await build({
    bundle: true,
    external: ["node:module"],
    format: "esm",
    outfile: bundlePath,
    platform: "browser",
    stdin: {
      contents: `
        import { getManifoldModule } from "./index.js"

        const output = document.querySelector("#output")
        try {
          const manifold = await getManifoldModule()
          const area = manifold.CrossSection.square([4, 5]).area()
          output.textContent = \`area: \${area}\`
        } catch (error) {
          output.textContent = \`error: \${error?.stack ?? error}\`
        }
      `,
      resolveDir: root,
      sourcefile: "browser-entry.js",
    },
  })

  const bundle = await readFile(bundlePath)
  server = createServer((request, response) => {
    if (request.url === "/bundle.js") {
      response.writeHead(200, { "Content-Type": "text/javascript" })
      response.end(bundle)
      return
    }
    response.writeHead(200, { "Content-Type": "text/html" })
    response.end(
      '<!doctype html><div id="output">loading</div><script type="module" src="/bundle.js"></script>',
    )
  })
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

test.afterAll(async () => {
  if (server) {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
  if (tempDirectory) {
    await rm(tempDirectory, { recursive: true, force: true })
  }
})

test("initializes embedded WASM from a browser bundle", async ({ page }) => {
  const pageErrors = []
  page.on("pageerror", (error) => pageErrors.push(error.message))

  await page.goto(baseUrl)

  await expect(page.locator("#output")).toHaveText("area: 20")
  expect(pageErrors).toEqual([])
})
