import React from 'react'
import './DescriptionBox.css'
export const DescriptionBox = () => {
  return (
    <div className='descriptionbox'>
        <div className="descriptionbox-navigator">
            <div className="descriptionbox-nav-box">Description</div>
            <div className="descriptionbox-nav-box fade">Reviews (122)</div>
        </div>
        <div className="descriptionbox-description">
            <p>E-commerce websites typically display products or services along with detailed descriptions, images,, prices,... Each product usually has its own dedicated page with relevant information.</p>
        </div>
    </div>
  )
}
