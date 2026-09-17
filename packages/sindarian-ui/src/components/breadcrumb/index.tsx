import React from 'react'
import {
  Breadcrumb as BaseBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

export type BreadcrumbPath = {
  name: string
  href?: string
}

type BreadcrumbProps = {
  paths: BreadcrumbPath[]
}

export const Breadcrumb = ({ paths }: BreadcrumbProps) => {
  const last = paths.length - 1

  return (
    <BaseBreadcrumb>
      <BreadcrumbList>
        {paths.map((path, index) => {
          /**
           * ⛔ THE LAST CRUMB IS THE PAGE, whatever the caller passed.
           *
           * The page marker used to be a side effect of the caller omitting
           * `href`, and nothing in `getBreadcrumbPaths` makes the last entry
           * omit one. A trail whose final entry carried an href therefore had
           * no `aria-current="page"` anywhere — a screen reader could not tell
           * which of three links was the page being read — and the crumb was a
           * live link back to the page the reader is already on.
           *
           * `aria-current` is passed explicitly rather than left to
           * `BreadcrumbPage`'s own default, because an href-less ANCESTOR
           * reaches the same branch and is not the current page;
           * `BreadcrumbPage` spreads props after its own attributes, so
           * `undefined` there drops the attribute.
           */
          const isLast = index === last

          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {path.href && !isLast ? (
                  <BreadcrumbLink href={path.href}>{path.name}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage aria-current={isLast ? 'page' : undefined}>
                    {path.name}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>

              {/* BETWEEN items, not after each one. Emitted inside the
                  fragment unconditionally, the trail ended in a chevron
                  pointing at a level that does not exist. */}
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </BaseBreadcrumb>
  )
}
