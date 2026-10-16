export function downloadTextFile(filename: string, content: string, mime = "text/plain"): void {
  // Il BOM fa riconoscere a Excel la codifica UTF-8 dei CSV (accenti, simbolo €).
  const blob = new Blob([mime === "text/csv" ? "\uFEFF" + content : content], {
    type: `${mime};charset=utf-8`,
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
