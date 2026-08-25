import { Children, Fragment, isValidElement, type ReactNode } from 'react'

/**
 * A label that actually renders an element. `null`, `undefined` and booleans
 * are valid ReactNode but produce nothing, so a control typed on bare ReactNode
 * can satisfy a field's props union and still end up nameless.
 *
 * Two cases the type cannot exclude, both caught at runtime by
 * `hasRenderableLabel`: the empty string (`Exclude<string, ''>` is still
 * `string`) and a portal (a `ReactPortal` is a perfectly good `ReactNode`).
 */
export type RenderableLabel = Exclude<ReactNode, null | undefined | boolean>

/**
 * Does this label put readable content INSIDE the label element — i.e. does it
 * give the control an accessible name?
 *
 * Ceiling, on purpose: a non-fragment element always counts, even an empty one.
 * We cannot render a component to find out whether it emits text, so
 * `label={<EmptyThing />}` is accepted. Fragments ARE unwrapped, since they add
 * no markup of their own and `<></>` is a plausible way to say "no label".
 *
 * A PORTAL DOES NOT COUNT. It is the one node that renders its content
 * somewhere else in the DOM — by definition outside the label subtree — so the
 * label element itself stays empty and names nothing. The content is visible on
 * screen, which is exactly what makes this worth guarding: it looks labelled
 * and is silent to a screen reader. Pass `aria-label` when the visible text
 * lives in a portal.
 *
 * BRANCH ORDER IS LOAD-BEARING — element before portal before collection:
 * `Children.toArray` hands a portal straight back unchanged, so reaching the
 * collection branch with one would recurse forever. The portal branch is the
 * crash guard as much as the verdict. Every field in this directory shares this
 * one copy precisely so that ordering cannot drift.
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
  // Portals and any other React-internal node that is not an element: their
  // content lands outside this subtree (or is unknowable), so it cannot name
  // the control. Must stay ABOVE the collection branch: isValidElement is false
  // for a portal and Children.toArray hands the identical node straight back,
  // so recursing on it would never terminate.
  if (typeof label === 'object' && '$$typeof' in label) return false

  const children = Children.toArray(label)
  // Belt for anything else toArray cannot break down: no progress left to make,
  // and nothing we can confirm renders in place, so treat it as absent rather
  // than recurse forever.
  if (children.length === 1 && children[0] === label) return false
  // Arrays and other iterables: renderable only if some child is.
  return children.some((child) => hasRenderableLabel(child))
}
