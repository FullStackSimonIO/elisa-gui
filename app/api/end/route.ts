import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const finishedState = { ...body, transferStatus: "ended" };
        
        // Here you would typically handle the end transfer logic
        // For now, just return the finished state
        
        return NextResponse.json(finishedState);
    } catch (error) {
        return NextResponse.json(
            { message: 'Failed to end transfer', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({ message: "End Endpoint - Use POST method to end transfer" });
}
