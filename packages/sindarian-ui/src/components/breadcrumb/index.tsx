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
           * ⚠️ AND AN HREF-LESS ANCESTOR IS NOT A SWITCHED-OFF LINK. It used
           * to reach `BreadcrumbPage` too, which hard-codes `role="link"
           * aria-disabled="true"` — the right shape for the page you are ON,
           * a destination that exists and simply is not navigable from here.
           * An ancestor with no href is a grouping label: there is no page
           * behind it, so "Settings, link, dimmed" told the reader a
           * destination was unavailable to them rather than that it was never
           * a destination, and inflated the link count of the trail. It is
           * plain text now, and only the last crumb is the page.
           */
          const isLast = index === last

          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {path.href && !isLast ? (
                  <BreadcrumbLink href={path.href}>{path.name}</BreadcrumbLink>
                ) : isLast ? (
                  <BreadcrumbPage>{path.name}</BreadcrumbPage>
                ) : (
                  <span className="breadcrumb-page">{path.name}</span>
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
