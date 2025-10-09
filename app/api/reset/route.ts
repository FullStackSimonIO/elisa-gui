// This Endpoint will be called, when the User wants to reset the Charging Process
// After the User clicks the "Reset"-Button in the UI
// First, we check if the Certificates are pre-installed
// If yes, we will delete all installed certificates on the client side
// Else, nothing will happen and the workflow will stop here

import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({ message: "Reset Endpoint - Not yet implemented" });
}