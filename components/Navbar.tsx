import React from 'react'
import { ThemeToggle } from './theme-toggle'
import Image from 'next/image'

const Navbar = () => {
  return (
    <div className='bg-accent w-full h-[5vh]'>
        <div className="text-background flex h-full w-full items-center justify-start p-4 font-semibold gap-4">
            <Image src="/logo.png" alt="Elisa Logo" width={32} height={32} />
            <p>Elisa - <span>Smart Charging</span></p>
        </div>
    </div>
  )
}

export default Navbar