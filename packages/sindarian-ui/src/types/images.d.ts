declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

// Side-effect stylesheet imports (Storybook's preview, mainly). TypeScript 6
// rejects a side-effect import with no declaration at all (TS2882), and the
// bundler — not tsc — is what actually resolves these.
declare module '*.css'
