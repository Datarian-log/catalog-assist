import { NextResponse } from "next/server";
import { encodeMarcBinary } from "@/lib/marc/binary-encoder";
import { encodeMarcXml } from "@/lib/marc/xml-encoder";
import { MarcRecord } from "@/lib/marc/types";

export async function POST(request: Request) {
  try {
    const { record, format }: { record: MarcRecord; format: "mrc" | "xml" } =
      await request.json();

    if (!record || !record.leader) {
      return NextResponse.json(
        { error: "Invalid MARC record." },
        { status: 400 }
      );
    }

    if (format === "mrc") {
      const binary = encodeMarcBinary(record);
      return new Response(binary.buffer as ArrayBuffer, {
        headers: {
          "Content-Type": "application/marc",
          "Content-Disposition": 'attachment; filename="record.mrc"',
        },
      });
    } else if (format === "xml") {
      const xml = encodeMarcXml(record);
      return new Response(xml, {
        headers: {
          "Content-Type": "application/marcxml+xml; charset=utf-8",
          "Content-Disposition": 'attachment; filename="record.xml"',
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use "mrc" or "xml".' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export record." },
      { status: 500 }
    );
  }
}
