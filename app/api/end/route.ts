// This Endpoint is called, when the User ends the charging process forcefully
// After Clicking the "End" Button in the UI
// All running processes must be stopped and the UI should return to the initial state
// This includes stopping any ongoing charging sessions, resetting states, and ensuring that the system is ready for the next session

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    return NextResponse.json({ message: "End Endpoint - Not yet implemented" });
}

