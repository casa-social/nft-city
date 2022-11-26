import { faCartShopping } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { PrimaryButton } from '../button'

const NFTItem = (props) => {
  const { className, nft } = props
  return (
    <div className={`relative rounded-md ${className}`}>
      <img src={nft.image} className='rounded-md' alt='nft'/>
      <p className='absolute top-2 text-white font-semibold z-10 px-4 text-xl'>{nft.name}</p>
      <div className='absolute rounded-md top-0 w-full h-12 bg-gradient-to-b from-app-primary-100 to-app-trans'></div>
      <div className='absolute rounded-md bottom-0 w-full h-12 bg-gradient-to-t from-app-primary-100 to-app-trans'></div>
      <div className='bg-white rounded-md m-2 absolute bottom-1 left-1 right-1 p-2 gap-2 flex flex-col'>
        <div className='flex justify-between'>
          <div className='flex items-center gap-2'>
            <FontAwesomeIcon icon={faCartShopping} className='text-app-primary-light'/>
            <p className='text-xs md:text-sm '>Up for sale</p>
          </div>
          <p className='text-app-orange font-bold md:text-xl lg:text-2xl'>
            {nft.listing.price.matic}
          </p>
        </div>
        <PrimaryButton className="uppercase text-white w-full">buy now</PrimaryButton>
      </div>
    </div>
  )
}

export default NFTItem