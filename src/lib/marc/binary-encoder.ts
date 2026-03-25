import { MarcRecord } from "./types";

const FIELD_TERMINATOR = 0x1e;
const RECORD_TERMINATOR = 0x1d;
const SUBFIELD_DELIMITER = 0x1f;

const encoder = new TextEncoder();

function encodeFieldData(
  record: MarcRecord
): { tag: string; data: Uint8Array }[] {
  const fields: { tag: string; data: Uint8Array }[] = [];

  // Control fields
  for (const cf of record.controlFields) {
    const bytes = encoder.encode(cf.value);
    const data = new Uint8Array(bytes.length + 1);
    data.set(bytes);
    data[bytes.length] = FIELD_TERMINATOR;
    fields.push({ tag: cf.tag, data });
  }

  // Data fields
  for (const df of record.dataFields) {
    const parts: number[] = [];
    parts.push(df.ind1.charCodeAt(0));
    parts.push(df.ind2.charCodeAt(0));

    for (const sf of df.subfields) {
      parts.push(SUBFIELD_DELIMITER);
      parts.push(sf.code.charCodeAt(0));
      const valueBytes = encoder.encode(sf.value);
      for (let i = 0; i < valueBytes.length; i++) {
        parts.push(valueBytes[i]);
      }
    }

    parts.push(FIELD_TERMINATOR);
    fields.push({ tag: df.tag, data: new Uint8Array(parts) });
  }

  return fields;
}

function padNumber(num: number, width: number): string {
  return String(num).padStart(width, "0");
}

export function encodeMarcBinary(record: MarcRecord): Uint8Array {
  const fields = encodeFieldData(record);

  // Directory: each entry is 12 bytes (3 tag + 4 length + 5 position)
  const directoryLength = fields.length * 12 + 1; // +1 for field terminator
  const baseAddress = 24 + directoryLength;

  // Calculate data positions
  let dataLength = 0;
  const entries: { tag: string; length: number; position: number }[] = [];
  for (const field of fields) {
    entries.push({
      tag: field.tag,
      length: field.data.length,
      position: dataLength,
    });
    dataLength += field.data.length;
  }

  const recordLength = baseAddress + dataLength + 1; // +1 for record terminator

  // Build leader (24 characters)
  const leaderBase = record.leader || "00000nam a2200000 i 4500";
  const leader =
    padNumber(recordLength, 5) +
    leaderBase.substring(5, 12) +
    padNumber(baseAddress, 5) +
    leaderBase.substring(17, 20) +
    "4500";

  // Build directory string
  let directory = "";
  for (const entry of entries) {
    directory +=
      entry.tag +
      padNumber(entry.length, 4) +
      padNumber(entry.position, 5);
  }

  // Assemble the record
  const headerBytes = encoder.encode(leader + directory);
  const result = new Uint8Array(recordLength);
  result.set(headerBytes);
  result[headerBytes.length] = FIELD_TERMINATOR; // directory terminator

  let offset = baseAddress;
  for (const field of fields) {
    result.set(field.data, offset);
    offset += field.data.length;
  }
  result[recordLength - 1] = RECORD_TERMINATOR;

  return result;
}
