/// <reference types="vite/client" />
/// <reference types="react-dom/client" />

declare module "*.png" {
  const src: string
  export default src
}

declare module "*.jpg" {
  const src: string
  export default src
}

declare module "*.jpeg" {
  const src: string
  export default src
}

declare module "*.svg" {
  const src: string
  export default src
}

declare module "*.css" {
  const content: string
  export default content
}
