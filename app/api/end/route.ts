"use server"

export async function endTransfer(prevState: any) {
    const finishedState = { ...prevState, transferStatus: "ended" };
    return finishedState;

    const res = await fetch('http://localhost:3000/api/end', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(finishedState),
    })
    
    const data = await res.json()
    
    if (!res.ok) {
        throw new Error(data.message || 'Something went wrong')
        }    
}
