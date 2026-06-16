import React, { useEffect, useState } from 'react'
import './Orders.css'

const STATUS_OPTIONS = ["Processing", "Paid", "Shipping", "Delivered", "Cancelled"];

const Orders = () => {
    const [orders, setOrders] = useState([]);

    const fetchOrders = async () => {
        const res = await fetch('http://localhost:4000/allorders');
        const data = await res.json();
        setOrders(data);
    }

    useEffect(() => {
        fetchOrders();
    }, [])

    const updateStatus = async (orderId, status) => {
        await fetch('http://localhost:4000/updateorderstatus', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId, status }),
        });
        await fetchOrders();
    }

    const removeOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to delete this order?")) return;
        await fetch('http://localhost:4000/removeorder', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId }),
        });
        await fetchOrders();
    }

    return (
        <div className='admin-orders'>
            <h1>Order Management</h1>
            {orders.length === 0 && <p>No orders yet.</p>}
            {orders.map((order) => (
                <div key={order._id} className="admin-order-card">
                    <div className="admin-order-info">
                        <div className="admin-order-items">
                            {order.items.map((item, i) => (
                                <p key={i}>{item.name} x {item.quantity}</p>
                            ))}
                        </div>
                        <div className="admin-order-address">
                            <p><b>{order.address?.name}</b></p>
                            <p>{order.address?.phone}</p>
                            <p>{order.address?.address}</p>
                        </div>
                        <div className="admin-order-meta">
                            <p>Total: <b>${order.amount}</b></p>
                            <p>Payment: {order.payment ? "Paid" : "Unpaid"}</p>
                            <p>{order.paymentMethod}</p>
                        </div>
                        <div className="admin-order-status">
                            <select value={order.status} onChange={(e) => updateStatus(order._id, e.target.value)}>
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <button className="admin-order-delete" onClick={() => removeOrder(order._id)}>Delete</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Orders
