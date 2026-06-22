let _idCounter = 0
export function generateId(): string {
  return `comp_${++_idCounter}_${Date.now()}`
}
