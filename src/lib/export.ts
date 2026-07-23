"use client";

/** Klientside eksport: CSV, PNG og permalenke. Delt av alle grafer. */

export type CsvColumn<Row> = { key: keyof Row & string; header: string };

export function toCsv<Row extends Record<string, unknown>>(
  rows: Row[],
  columns: CsvColumn<Row>[],
): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => esc(row[c.key])).join(","))
    .join("\n");
  return `${head}\n${body}\n`;
}

export function download(filename: string, content: BlobPart, type: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv<Row extends Record<string, unknown>>(
  filename: string,
  rows: Row[],
  columns: CsvColumn<Row>[],
) {
  download(filename, "﻿" + toCsv(rows, columns), "text/csv;charset=utf-8");
}

/** Serialiserer et <svg> til PNG med hvit bakgrunn (2× for skarphet). */
export async function svgToPng(svg: SVGSVGElement, filename: string, scale = 2) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const bbox = svg.getBoundingClientRect();
  const width = Math.max(1, Math.round(bbox.width || svg.clientWidth || 640));
  const height = Math.max(1, Math.round(bbox.height || svg.clientHeight || 400));

  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // Sørg for lesbar font i den frittstående filen.
  clone.style.fontFamily =
    "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";

  const xml = new XMLSerializer().serializeToString(clone);
  const svgUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

  const img = new Image();
  img.decoding = "sync";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Kunne ikke rendre SVG"));
    img.src = svgUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas ikke tilgjengelig");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, width, height);

  await new Promise<void>((resolve) =>
    canvas.toBlob((blob) => {
      if (blob) download(filename, blob, "image/png");
      resolve();
    }, "image/png"),
  );
}

/** Kopierer en permalenke (URL + #anker) til utklippstavlen. */
export async function copyPermalink(anchorId: string): Promise<string> {
  const url = new URL(window.location.href);
  url.hash = anchorId;
  const href = url.toString();
  try {
    await navigator.clipboard.writeText(href);
  } catch {
    /* utklippstavle kan være blokkert – lenken oppdateres uansett */
  }
  history.replaceState(null, "", href);
  return href;
}
