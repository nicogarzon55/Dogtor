/** Une clases de Tailwind ignorando valores vacios, null o false. */
export function cn(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(' ')
}
