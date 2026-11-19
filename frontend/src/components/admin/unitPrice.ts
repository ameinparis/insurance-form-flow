/** Format decimal strings without converting financial prices to floating point. */
export function formatUnitPrice(value: string): string {
  const [integer, fraction = ""] = value.split(".")
  return `BWP ${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.padEnd(2, "0")}`
}