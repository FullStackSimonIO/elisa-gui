import {Client} from "ssh2"



/**
 * SSH Config is defined inside here. These Props are used to connect to the Raspberry Pi over SSH.
 */
interface SSHConfig {
    host: string
    port: number
    username: string
    password?: string
    privateKey?: Buffer
}



/**
 * This Function tries to connect over SSH to the Raspberry PI and executes a provided file
 * Because we will have multiple Scripts to execute later, that need a SSH Function this will be expanded with a Script Name and Args
 * Based on the Script Name, different Paths need to be handled inside
 * @param command - The command to execute on the remote server
 * @param config  - SSH Configuration including host, port, username, and authentication method as defined above in SSHConfig
 * @returns - Promise that resolves with stdout and stderr of the executed command
 */

export async function executeRemoteCommand(
    command: string,
    config: SSHConfig): Promise<{
        stdout: string, stderr: string
    }> {
        return new Promise((resolve, reject) => {
            const conn = new Client()
            // Outputs & Errors are initialized as empty strings
            let stdout = ""
            let stderr = ""

            // When the Connection is established correctly, the provided Command is executed
            conn.on("ready", () => {
                conn.exec(command, (err, stream) => {
                    if (err) {
                        conn.end()
                        reject(err)
                        return
                    }
                    
                    // After Closing the Stream, the Connection is ended and the Outputs are returned
                    stream.on("close", (code: number, signal: string) => {
                        conn.end()
                        if (code === 0) {
                            resolve({stdout, stderr})
                        } else {
                            reject(new Error(`Command failed with code ${code}, signal: ${signal}, stderr: ${stderr}`))
                        }
                    })
                    .on("data", (data: Buffer) => {
                        stdout += data.toString()
                    })
                    stream.stderr.on("data", (data: Buffer) => {
                        stderr += data.toString()
                    })
                })
            })

            // If there is an Error during the Connection, it is caught here
            .on("error", (err) => {
                reject(err)
            })

            // Finally, the Connection is started with the provided Config
            .connect(config)
        })
    }

    