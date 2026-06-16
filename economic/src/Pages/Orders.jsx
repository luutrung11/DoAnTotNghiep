import React, { useEffect, useState } from 'react'
import './CSS/Orders.css'

const Orders = () => {
    const [orders, setOrders] = useState([]);

    // read the payment result from the URL (?payment=success/failed/invalid)
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get('payment');

    const fetchOrders = async () => {
        if (!localStorage.getItem('auth-token')) return;
        const response = await fetch('http://localhost:4000/myorders', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'auth-token': `${localStorage.getItem('auth-token')}`,
                'Content-Type': 'application/json',
            },
            body: "",
        });
        const data = await response.json();
        setOrders(data);
    }

    useEffect(() => {
        fetchOrders();
    }, [])

    return (
        <div className='orders'>
            <h1>My Orders</h1>

            {paymentResult === 'success' && <p className="orders-msg success">Payment successful!</p>}
            {paymentResult === 'failed' && <p className="orders-msg failed">Payment failed or was cancelled.</p>}
            {paymentResult === 'invalid' && <p className="orders-msg failed">Invalid signature.</p>}

            {orders.length === 0 && <p>You don't have any orders yet.</p>}

            {orders.map((order) => {
                return (
                    <div key={order._id} className="order-card">
                        <div className="order-head">
                            <span>Order ID: {order._id}</span>
                            <span className={order.payment ? "paid" : "unpaid"}>
                                {order.payment ? "Paid" : "Unpaid"}
                            </span>
                        </div>
                        <div className="order-items">
                            {order.items.map((item, i) => (
                                <div key={i} className="order-item">
                                    <img src={item.image} alt="" />
                                    <span>{item.name} x {item.quantity}</span>
                                    <span>${item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        <div className="order-foot">
                            <span>Status: <b>{order.status}</b></span>
                            <span>Total: <b>${order.amount}</b></span>
                        </div>
                    </div>
                );
            })}
        </div>
    )
}

export default Orders
