import * as XLSX from "xlsx"

export function generateXlsx(data: Record<string, unknown>[], sheetName: string = "Dados"): Buffer {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }))
}

export function generateXlsxMultiSheet(sheets: { name: string; data: Record<string, unknown>[] }[]): Buffer {
  const wb = XLSX.utils.book_new()
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.data)
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  }
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }))
}
