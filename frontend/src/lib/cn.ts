/**
 * Tiny class join helper — joins truthy values with a space.
 * (Deliberately avoids a clsx/tailwind-merge dependency.)
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}