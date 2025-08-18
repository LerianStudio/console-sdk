/**
 * Get the methods of a class
 * @param target - The class to get the methods from
 * @returns The methods of the class
 */
export function getClassMethods(target: Function) {
  const prototype = target.prototype

  const methodNames = Object.getOwnPropertyNames(prototype).filter(
    (name) => typeof prototype[name] === 'function' && name !== 'constructor'
  )

  return methodNames
}
