'use client'

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import suppliersData from '@/src/data/supplierDummy.json';

type Stock = {
  id: string;
  supplierName: string;
  items: { product_name: string; qty: number; purchase_price: number; subtotal: number }[];
  total: number;
  createdAt: string;
};

type Order = {
  id: string;
  user_id: string;
  item_name: string;
  quantity: number;
  due_date: string;
  supplier: string;
  unit_price: number;
  status: string;
  confirmation_date: string | null;
};

export default function SupplierDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [user, setUser] = useState<User | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const allSuppliers = suppliersData as string[];

   // Fetch orders and stocks
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Fetch orders
          const ordersSnapshot = await getDocs(collection(db, 'orders'));
          const ordersData = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Order[];
          setOrders(ordersData);
          console.log('Orders fetched:', ordersData); // Debug log

          // Fetch stocks for the current user
          const stocksSnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'stocks'));
          const stocksData = stocksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
          })) as Stock[];
          setStocks(stocksData);
          console.log('Stocks fetched:', stocksData); // Debug log
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      } else {
        console.log('No user logged in'); // Debug log
        setOrders([]);
        setStocks([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle order confirmation
  const handleConfirm = async (orderId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'confirmed', confirmation_date: today });
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: 'confirmed', confirmation_date: today } : order
      ));
      alert('Order confirmed successfully!');
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Failed to confirm order.');
    }
  };

  // Group stocks by supplier
  const groupedStocks = stocks.reduce((acc, stock) => {
    const supplier = stock.supplierName || 'Unknown';
    if (!acc[supplier]) {
      acc[supplier] = { total_qty: 0, total: 0, items: [] };
    }
    acc[supplier].total_qty += stock.items.reduce((sum, item) => sum + item.qty, 0);
    acc[supplier].total += stock.total || 0;
    acc[supplier].items.push(
      ...stock.items.map(item => ({
        product_name: item.product_name,
        qty: item.qty,
        purchase_price: item.purchase_price,
        subtotal: item.subtotal,
      }))
    );
    return acc;
  }, {} as Record<string, { total_qty: number; total: number; items: { product_name: string; qty: number; purchase_price: number; subtotal: number }[] }>);

  const filteredOrders = selectedSupplier === 'all' ? orders : orders.filter(order => order.supplier === selectedSupplier);
  const pendingOrders = filteredOrders.filter(order => order.status === 'pending');
  const confirmedOrders = filteredOrders.filter(order => order.status === 'confirmed');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Supplier Dashboard</h1>

      {user ? (
        <>
          {/* Supplier Filter Dropdown */}
          <div className="mb-4">
            <label className="mr-2">Filter by Supplier:</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All Suppliers</option>
              {allSuppliers.map(supplier => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 ${activeTab === 'pending' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Order List ({pendingOrders.length})
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'confirmed' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
              onClick={() => setActiveTab('confirmed')}
            >
              Past Confirmed Orders ({confirmedOrders.length})
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'stocks' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
              onClick={() => setActiveTab('stocks')}
            >
              Stock Classification
            </button>
          </div>

          {/* Order List Tab */}
          {activeTab === 'pending' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Pending Orders</h2>
              {pendingOrders.length === 0 ? (
                <p>No pending orders.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Item Name</th>
                      <th className="border p-2 text-left">Quantity</th>
                      <th className="border p-2 text-left">Due Date</th>
                      <th className="border p-2 text-left">Supplier</th>
                      <th className="border p-2 text-left">Unit Price</th>
                      <th className="border p-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map(order => (
                      <tr key={order.id}>
                        <td className="border p-2">{order.item_name}</td>
                        <td className="border p-2">{order.quantity}</td>
                        <td className="border p-2">{order.due_date}</td>
                        <td className="border p-2">{order.supplier}</td>
                        <td className="border p-2">${order.unit_price?.toFixed(2) || '0.00'}</td>
                        <td className="border p-2">
                          <button
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                            onClick={() => handleConfirm(order.id)}
                          >
                            Confirm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Past Confirmed Orders Tab */}
          {activeTab === 'confirmed' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Past Confirmed Orders</h2>
              {confirmedOrders.length === 0 ? (
                <p>No confirmed orders.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Item Name</th>
                      <th className="border p-2 text-left">Quantity</th>
                      <th className="border p-2 text-left">Due Date</th>
                      <th className="border p-2 text-left">Supplier</th>
                      <th className="border p-2 text-left">Unit Price</th>
                      <th className="border p-2 text-left">Confirmation Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confirmedOrders.map(order => (
                      <tr key={order.id}>
                        <td className="border p-2">{order.item_name}</td>
                        <td className="border p-2">{order.quantity}</td>
                        <td className="border p-2">{order.due_date}</td>
                        <td className="border p-2">{order.supplier}</td>
                        <td className="border p-2">${order.unit_price?.toFixed(2) || '0.00'}</td>
                        <td className="border p-2">{order.confirmation_date || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Stock Classification Tab */}
          {activeTab === 'stocks' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Stock Classification by Supplier</h2>
              {Object.keys(groupedStocks).length === 0 ? (
                <p>No stocks available.</p>
              ) : (
                <div>
                  {Object.entries(groupedStocks).map(([supplier, data]) => (
                    <div key={supplier} className="mb-6">
                      <h3 className="text-lg font-bold mb-2">{supplier}</h3>
                      <p>Total Delivered: {data.total_qty} units</p>
                      <p>Total Price: ${data.total.toFixed(2)}</p>
                      <h4 className="font-semibold mt-2">Items:</h4>
                      <table className="w-full border-collapse mt-2">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Product Name</th>
                            <th className="border p-2 text-left">Quantity</th>
                            <th className="border p-2 text-left">Purchase Price</th>
                            <th className="border p-2 text-left">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.items.map((item, index) => (
                            <tr key={index}>
                              <td className="border p-2">{item.product_name}</td>
                              <td className="border p-2">{item.qty}</td>
                              <td className="border p-2">${item.purchase_price.toFixed(2)}</td>
                              <td className="border p-2">${item.subtotal.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <p>Please log in to view the dashboard.</p>
      )}
    </div>
  );
}
