import React from 'react'
import { Skeleton } from '../ui/skeleton'

const SmallSkeleton = () => {
  return (
    <div className='flex flex-col space-y-3'>
        <Skeleton className='h-[125px] w-[250px] rounded-xl flex items-center justify-center'>
            <div className="h-2 w-2 rounded-full bg-muted" />
        </Skeleton>
        <div className="space-y-2">
            <Skeleton className='h-4 w-[250px]' />
            <Skeleton className='h-4 w-[200px]' /> 
        </div>
    </div>
  )
}

export default SmallSkeleton