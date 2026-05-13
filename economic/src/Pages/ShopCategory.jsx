import React from 'react'
import all_product from '../Components/Assets/all_product'
import { Link } from 'react-router-dom'

const ShopCategory = ({ category }) => {
  const products = all_product.filter(p => p.category === category)

  return (
    <div className="shop-category">
      <div className="shopcategory-products">
        {products.map(product => (
          <Link key={product.id} to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="product-item">
              <img src={product.image} alt={product.name} />
              <p>{product.name}</p>
              <div>
                <span style={{ textDecoration: 'line-through', color: '#aaa', marginRight: 8 }}>${product.old_price}</span>
                <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>${product.new_price}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ShopCategory
