"use server"

import revalidatePath from "next/cache"
import {exec } from "child_process"
import { promisify } from "util"

export type Certificate = {
}

export async function executeCertificateScript(
    scriptPath: string,
    args: string[] = []
): Promise<{ stdout: string; stderr: string }> {
    const host = process.env.HOSTNAME || "localhost"
    const port = process.env.PORT || "5000"
    const user = process.env.USERNAME || "admin"
    const password = process.env.PASSWORD || "password"

    // Construct the command with arguments
    const escapedArgs = args
}