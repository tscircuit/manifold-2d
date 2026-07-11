import createManifoldModule from "./vendor/manifold.js"

let manifoldModule = null
let manifoldModulePromise = null
let wasmUrl = null

export { createManifoldModule }

export const setWasmUrl = (url) => {
  wasmUrl = String(url)
}

export const instantiateManifold = async () => {
  const module = await createManifoldModule(
    wasmUrl ? { locateFile: () => wasmUrl } : undefined,
  )
  module.setup()
  return module
}

export const getManifoldModule = async () => {
  if (manifoldModule) return manifoldModule

  manifoldModulePromise ??= instantiateManifold()
    .then((module) => {
      manifoldModule = module
      return module
    })
    .catch((error) => {
      manifoldModulePromise = null
      throw error
    })

  return manifoldModulePromise
}

export const getManifoldModuleSync = () => manifoldModule
