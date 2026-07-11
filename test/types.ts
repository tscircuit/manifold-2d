import {
  getManifoldModule,
  getManifoldModuleSync,
  setWasmUrl,
  type FillRule,
  type SimplePolygon,
} from "../index.js"

const polygon: SimplePolygon = [
  [0, 0],
  [1, 0],
  [1, 1],
]
const fillRule: FillRule = "Positive"

setWasmUrl("/assets/manifold.wasm")
void getManifoldModule().then(({ CrossSection }) =>
  CrossSection.ofPolygons([polygon], fillRule),
)
getManifoldModuleSync()?.CrossSection.ofPolygons([polygon], fillRule)
