import Image from 'next/image'
import React from 'react'

const Timeline = () => {
  return (
    <section>
        <div className="bg-red-500">
            <h2>Timeline</h2>
        </div>
        <div>
            <p className='text-paragraph bg-background text-sm '>
                This timeline visualizes the sequence of events and milestones in the EV charging process, providing a clear overview of each step from initiation to completion.
            </p>
            <Image src="/path/to/image.jpg" alt="Timeline Image" width={500} height={300} />
            <div className='font semibold text-sm'>
                <p>Charging Session Timeline</p>
            </div>
        </div>
    </section>
  )
}

export default Timeline