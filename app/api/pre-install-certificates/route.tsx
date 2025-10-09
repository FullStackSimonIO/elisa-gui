// Pre-Install Certificates API Route
// This Route will first check, if there are any pre-installed certificates available
// If there are NO certificates installed, it will automatically fetch and install them from a predefined source
// Else, the workflow will automatically skip this step and continue with the next step in the process

import { NextResponse } from "next/server";
import * as z from "zod"

// Certification Schema is defined here for hardening the Input Data on Client Side
const CertificateSchema = z.object({
    id: z.string(),
    name: z.string()
})

type CertificationSchema = z.infer<typeof CertificateSchema>



export async function GET() {
    // Fetch pre-installed certificates
    const response: CertificationSchema = await fetch(`https://test-endpoint.com/api/certificates`, {
        // Set your API token in environment variables for security
    headers: { Authorization: `Bearer ${process.env.EVCC_API_TOKEN}` },
    }).then(res => res.json()); // Parse the JSON response
    console.log(response);
    return NextResponse.json(response); // Return the response as JSON

    if (!response) {
        return NextResponse.json({ message: "No pre-installed certificates found." }, { status: 404 });
    }
    return NextResponse.json(response)
}