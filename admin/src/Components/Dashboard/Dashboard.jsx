import React, { useEffect, useState } from 'react'
import './Dashboard.css'

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);

    const fetchData = async () => {
        const [ordersRes, productsRes] = await Promise.all([
            fetch('http://localhost:4000/allorders'),
            fetch('http://localhost:4000/allproducts'),
        ]);
        setOrders(await ordersRes.json());
        setProducts(await productsRes.json());
    }

    useEffect(() => {
        fetchData();
    }, [])

    // ----- compute statistics -----
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.payment);
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalProducts = products.length;

    // orders grouped by status
    const statusCounts = orders.reduce((acc, o) => {
        const key = o.status || "Unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    // best-selling products by quantity (from paid orders)
    const productSales = {};
    paidOrders.forEach((o) => {
        (o.items || []).forEach((item) => {
            if (!productSales[item.name]) {
                productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
            }
            productSales[item.name].quantity += item.quantity;
            productSales[item.name].revenue += item.price * item.quantity;
        });
    });
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    return (
        <div className='dashboard'>
            <h1>Dashboard</h1>

            <div className="dashboard-cards">
                <div className="dashboard-card">
                    <p className="dashboard-card-label">Total Revenue</p>
                    <p className="dashboard-card-value">${totalRevenue.toLocaleString()}</p>
                </div>
                <div className="dashboard-card">
                    <p className="dashboard-card-label">Total Orders</p>
                    <p className="dashboard-card-value">{totalOrders}</p>
                </div>
                <div className="dashboard-card">
                    <p className="dashboard-card-label">Paid Orders</p>
                    <p className="dashboard-card-value">{paidOrders.length}</p>
                </div>
                <div className="dashboard-card">
                    <p className="dashboard-card-label">Total Products</p>
                    <p className="dashboard-card-value">{totalProducts}</p>
                </div>
            </div>

            <div className="dashboard-panels">
                <div className="dashboard-panel">
                    <h2>Orders by Status</h2>
                    {Object.keys(statusCounts).length === 0 && <p>No orders yet.</p>}
                    {Object.entries(statusCounts).map(([status, count]) => (
                        <div key={status} className="dashboard-row">
                            <span>{status}</span>
                            <b>{count}</b>
                        </div>
                    ))}
                </div>

                <div className="dashboard-panel">
                    <h2>Top Selling Products</h2>
                    {topProducts.length === 0 && <p>No sales yet.</p>}
                    {topProducts.map((p) => (
                        <div key={p.name} className="dashboard-row">
                            <span>{p.name}</span>
                            <b>{p.quantity} sold · ${p.revenue.toLocaleString()}</b>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
