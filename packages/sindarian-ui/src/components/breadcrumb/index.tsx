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
  return (
    <BaseBreadcrumb>
      <BreadcrumbList>
        {paths.map((path, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {path.href ? (
                <BreadcrumbLink href={path.href}>{path.name}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{path.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>

            <BreadcrumbSeparator />
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </BaseBreadcrumb>
  )
}
