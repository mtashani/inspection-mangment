/**
 * Utility functions for transforming data between snake_case and camelCase
 */

/**
 * Convert a string from snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Convert a string from camelCase to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert an object's keys from snake_case to camelCase recursively
 */
export function snakeToCamelObject<T>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamelObject(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const transformed: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = snakeToCamel(key);
        transformed[camelKey] = snakeToCamelObject(obj[key]);
      }
    }
    return transformed as T;
  }
  
  return obj as T;
}

/**
 * Convert an object's keys from camelCase to snake_case recursively
 */
export function camelToSnakeObject<T>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => camelToSnakeObject(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const transformed: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const snakeKey = camelToSnake(key);
        transformed[snakeKey] = camelToSnakeObject(obj[key]);
      }
    }
    return transformed as T;
  }
  
  return obj as T;
}