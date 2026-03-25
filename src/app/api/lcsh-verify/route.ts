import { NextResponse } from "next/server";
import { verifyLcshCandidate } from "@/lib/lcsh/verify";
import { LcshCandidate } from "@/lib/marc/types";

export async function POST(request: Request) {
  try {
    const { candidate }: { candidate: LcshCandidate } = await request.json();

    if (!candidate?.subfields?.length) {
      return NextResponse.json(
        { error: "Invalid candidate." },
        { status: 400 }
      );
    }

    const verified = await verifyLcshCandidate(candidate);
    return NextResponse.json(verified);
  } catch (error) {
    console.error("LCSH verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify LCSH term." },
      { status: 500 }
    );
  }
}
