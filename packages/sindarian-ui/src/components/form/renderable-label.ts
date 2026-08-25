import { Children, Fragment, isValidElement, type ReactNode } from 'react'

/**
 * A label that actually renders an element. `null`, `undefined` and booleans
 * are valid ReactNode but produce nothing, so a control typed on bare ReactNode
 * can satisfy a field's props union and still end up nameless.
 *
 * The empty string cannot be excluded here — `Exclude<string, ''>` is still
 * `string` — so `label=""` is caught at runtime by `hasRenderableLabel` instead.
 */
export type RenderableLabel = Exclude<ReactNode, null | undefined | boolean>

/**
 * Does this label produce a real element a screen reader can read?
 *
 * Ceiling, on purpose: a non-fragment element always counts, even an empty one.
 * We cannot render a component to find out whether it emits text, so
 * `label={<EmptyThing />}` is accepted. Fragments ARE unwrapped, since they add
 * no markup of their own and `<></>` is a plausible way to say "no label".
 *
 * BRANCH ORDER IS LOAD-BEARING — element before portal before collection:
 * `Children.toArray` hands a portal straight back unchanged, so reaching the
 * collection branch with one would recurse forever. Every field in this
 * directory shares this one copy precisely so that ordering cannot drift.
 */
export function hasRenderableLabel(label: ReactNode): boolean {
  if (label === null || label === undefined || typeof label === 'boolean') {
    return false
  }
  // Empty AND whitespace-only strings render a label box with nothing to
  // announce, so both count as absent. A number (`0`) is a real label.
  if (typeof label === 'string') return label.trim() !== ''
  if (typeof label === 'number' || typeof label === 'bigint') return true
  if (isValidElement(label)) {
    return label.type === Fragment
      ? hasRenderableLabel(
          (label.props as { children?: ReactNode })?.children ?? null
        )
      : true
  }
  // Portals and any other React-internal node that is not an element: they
  // render something, and their text is as unknowable as a component's, so they
  // count. Critically they are NOT decomposable — isValidElement is false for a
  // portal and Children.toArray hands the identical node straight back, so
  // recursing on it would never terminate.
  if (typeof label === 'object' && '$$typeof' in label) return true

  const children = Children.toArray(label)
  // Belt for anything else toArray cannot break down: if it returns the very
  // node we passed in, there is no progress left to make, so stop rather than
  // recurse forever.
  if (children.length === 1 && children[0] === label) return true
  // Arrays and other iterables: renderable only if some child is.
  return children.some((child) => hasRenderableLabel(child))
}
