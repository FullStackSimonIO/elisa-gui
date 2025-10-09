// This Endpoint will reset all installed certificates on the device
// This is useful, if you want to manually re-install all certificates
// First, it will check, if there are any certificates installed
// If there are certificates installed, it will delete them all
// Else, the workflow will just stop or send a message, that there are no certificates installed

import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({ message: "Reset Certificates Endpoint - Not yet implemented" });
}