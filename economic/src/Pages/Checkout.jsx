import React, { useContext, useState } from 'react'
import { ShopContext } from '../Context/ShopContext'
import './CSS/Checkout.css'

const Checkout = () => {
    const { all_product, cartItems, getTotalCartAmount } = useContext(ShopContext);
    const [info, setInfo] = useState({ name: "", phone: "", address: "" });

    const changeHandler = (e) => {
        setInfo({ ...info, [e.target.name]: e.target.value });
    }

    const placeOrder = async () => {
        if (!localStorage.getItem('auth-token')) {
            alert("Please log in before checking out");
            return;
        }
        if (!info.name || !info.phone || !info.address) {
            alert("Please fill in all shipping information");
            return;
        }

        // build the order's product list from the cart
        let items = [];
        all_product.forEach((p) => {
            if (cartItems[p.id] > 0) {
                items.push({
                    id: p.id,
                    name: p.name,
                    image: p.image,
                    price: p.new_price,
                    quantity: cartItems[p.id],
                });
            }
        });

        if (items.length === 0) {
            alert("Your cart is empty");
            return;
        }

        const response = await fetch('http://localhost:4000/placeorder', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'auth-token': `${localStorage.getItem('auth-token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: items,
                amount: getTotalCartAmount(),
                address: info,
            }),
        });
        const data = await response.json();

        if (data.success && data.paymentUrl) {
            // redirect to the VNPay payment page
            window.location.href = data.paymentUrl;
        } else {
            alert("Failed to place order");
        }
    }

    return (
        <div className='checkout'>
            <div className="checkout-info">
                <h2>Shipping Information</h2>
                <input name='name' value={info.name} onChange={changeHandler} type="text" placeholder='Full name' />
                <input name='phone' value={info.phone} onChange={changeHandler} type="text" placeholder='Phone number' />
                <input name='address' value={info.address} onChange={changeHandler} type="text" placeholder='Shipping address' />
            </div>
            <div className="checkout-summary">
                <h2>Your Order</h2>
                {all_product.map((p) => {
                    if (cartItems[p.id] > 0) {
                        return (
                            <div key={p.id} className="checkout-item">
                                <span>{p.name} x {cartItems[p.id]}</span>
                                <span>${p.new_price * cartItems[p.id]}</span>
                            </div>
                        );
                    }
                    return null;
                })}
                <hr />
                <div className="checkout-total">
                    <h3>Total</h3>
                    <h3>${getTotalCartAmount()}</h3>
                </div>
                <button onClick={placeOrder}>PAY WITH VNPAY</button>
            </div>
        </div>
    )
}

export default Checkout
