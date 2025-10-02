import React from 'react'

const page = () => {
  return (
    <section>
      <div className="flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold">Infotainment</h1>
        <button className="btn">Settings</button>
      </div>
      <div className="p-4">
        <p>Welcome to the Infotainment system of your EV charger!</p>
      </div>
    </section>
  )
}

export default page