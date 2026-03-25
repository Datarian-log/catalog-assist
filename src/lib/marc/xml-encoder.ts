import { MarcRecord } from "./types";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function encodeMarcXml(record: MarcRecord): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<record xmlns="http://www.loc.gov/MARC21/slim" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.loc.gov/MARC21/slim http://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd">'
  );

  // Leader
  lines.push(`  <leader>${escapeXml(record.leader)}</leader>`);

  // Control fields
  for (const cf of record.controlFields) {
    lines.push(
      `  <controlfield tag="${escapeXml(cf.tag)}">${escapeXml(cf.value)}</controlfield>`
    );
  }

  // Data fields
  for (const df of record.dataFields) {
    lines.push(
      `  <datafield tag="${escapeXml(df.tag)}" ind1="${escapeXml(df.ind1)}" ind2="${escapeXml(df.ind2)}">`
    );
    for (const sf of df.subfields) {
      lines.push(
        `    <subfield code="${escapeXml(sf.code)}">${escapeXml(sf.value)}</subfield>`
      );
    }
    lines.push("  </datafield>");
  }

  lines.push("</record>");

  return lines.join("\n");
}
