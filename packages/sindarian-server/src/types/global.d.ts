/// <reference types="reflect-metadata" />

// This file ensures that reflect-metadata types are available globally
// without requiring explicit imports in test files

declare global {
  namespace Reflect {
    function defineMetadata(
      metadataKey: any,
      metadataValue: any,
      target: any,
      propertyKey?: string | symbol
    ): void
    function getMetadata(
      metadataKey: any,
      target: any,
      propertyKey?: string | symbol
    ): any
    function getOwnMetadata(
      metadataKey: any,
      target: any,
      propertyKey?: string | symbol
    ): any
    function getMetadataKeys(target: any, propertyKey?: string | symbol): any[]
    function deleteMetadata(
      metadataKey: any,
      target: any,
      propertyKey?: string | symbol
    ): boolean
  }
}
