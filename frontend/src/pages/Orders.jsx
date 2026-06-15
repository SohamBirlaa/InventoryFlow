import { useEffect, useState } from "react";
import api from "../services/api";

function Orders() {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // View States
  const [isCreating, setIsCreating] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Alerts
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Create Order Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [orderItems, setOrderItems] = useState([
    { product_id: "", quantity: 1 } // start with one blank item
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch customers, products and orders in parallel
      const [custRes, prodRes, ordRes] = await Promise.all([
        api.get("/customer/"),
        api.get("/products/"),
        api.get("/orders/")
      ]);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
      setOrders(ordRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load page data. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerAlert = (type, message) => {
    if (type === "success") {
      setSuccessMsg(message);
      setErrorMsg("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      setErrorMsg(message);
      setSuccessMsg("");
      setTimeout(() => setErrorMsg(""), 5000);
    }
  };

  // Maps helpers
  const customersMap = customers.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {});

  const productsMap = products.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  // Form management
  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    const newItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newItems.length ? newItems : [{ product_id: "", quantity: 1 }]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = orderItems.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setOrderItems(updated);
  };

  // Calculate live grand total
  const calculateGrandTotal = () => {
    return orderItems.reduce((total, item) => {
      const product = productsMap[item.product_id];
      if (product) {
        return total + Number(product.price) * (Number(item.quantity) || 0);
      }
      return total;
    }, 0);
  };

  // Submit Order
  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      triggerAlert("error", "Please select a customer.");
      return;
    }

    if (orderItems.length === 0) {
      triggerAlert("error", "An order must contain at least one product.");
      return;
    }

    // Validate each item
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item.product_id) {
        triggerAlert("error", `Please select a product for item #${i + 1}.`);
        return;
      }

      const product = productsMap[item.product_id];
      if (!product) {
        triggerAlert("error", `Invalid product selected at item #${i + 1}.`);
        return;
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        triggerAlert("error", `Quantity for "${product.name}" must be a positive integer.`);
        return;
      }

      if (qty > product.quantity_in_stock) {
        triggerAlert(
          "error",
          `Insufficient stock for "${product.name}". Available: ${product.quantity_in_stock}, requested: ${qty}.`
        );
        return;
      }
    }

    try {
      const payload = {
        customer_id: Number(selectedCustomerId),
        items: orderItems.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity)
        }))
      };

      await api.post("/orders/", payload);
      triggerAlert("success", "Order successfully created.");
      
      // Reset state
      setSelectedCustomerId("");
      setOrderItems([{ product_id: "", quantity: 1 }]);
      setIsCreating(false);
      
      fetchData(); // reload
    } catch (err) {
      console.error(err);
      const backendErr = err.response?.data?.detail || "Failed to create order.";
      triggerAlert("error", backendErr);
    }
  };

  // Delete Order
  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    try {
      await api.delete(`/orders/${orderToDelete.id}`);
      triggerAlert("success", `Order #${orderToDelete.id} successfully deleted.`);
      setOrderToDelete(null);
      fetchData();
    } catch (err) {
      console.error(err);
      const backendErr = err.response?.data?.detail || "Failed to delete order.";
      triggerAlert("error", backendErr);
      setOrderToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Orders Management</h1>
            <p className="text-slate-400 mt-1">Process sales transactions and view order records.</p>
          </div>
          <div>
            <button
              onClick={() => {
                setIsCreating(!isCreating);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded font-medium text-sm transition-colors"
            >
              {isCreating ? "View Orders List" : "Create New Order"}
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 p-4 rounded-lg flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="hover:text-emerald-300 font-bold">&times;</button>
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-950/40 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="hover:text-red-300 font-bold">&times;</button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && <div className="text-center py-12 text-slate-500">Loading orders...</div>}

        {/* MAIN PANEL */}
        {!loading && (
          <>
            {isCreating ? (
              /* CREATE ORDER FORM */
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 max-w-4xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-6">Create Sales Order</h2>
                <form onSubmit={handleCreateOrder} className="space-y-6">
                  
                  {/* Customer Select */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Customer <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white focus:outline-none focus:border-blue-500 text-sm"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                      <option value="">-- Select Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Items List */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-sm font-bold text-slate-300">Order Items</span>
                      <button
                        type="button"
                        onClick={handleAddItemRow}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1.5 rounded transition-colors"
                      >
                        + Add Item
                      </button>
                    </div>

                    <div className="space-y-3">
                      {orderItems.map((item, index) => {
                        const product = productsMap[item.product_id];
                        const price = product ? Number(product.price) : 0;
                        const stock = product ? product.quantity_in_stock : 0;
                        const lineTotal = price * (Number(item.quantity) || 0);

                        return (
                          <div key={index} className="flex flex-col sm:flex-row items-start sm:items-end gap-3 bg-slate-900/40 border border-slate-850 p-3 rounded">
                            
                            {/* Product Select */}
                            <div className="w-full sm:flex-1">
                              <label className="block text-xs text-slate-500 mb-1">Product</label>
                              <select
                                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 w-full text-white text-xs focus:outline-none focus:border-blue-500"
                                value={item.product_id}
                                onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                              >
                                <option value="">-- Choose Product --</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
                                    {p.name} (SKU: {p.sku}) — Price: {formatCurrency(p.price)} [Stock: {p.quantity_in_stock}]
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Quantity Input */}
                            <div className="w-24 sm:w-20">
                              <label className="block text-xs text-slate-500 mb-1">Qty</label>
                              <input
                                type="number"
                                min="1"
                                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 w-full text-white text-xs text-center focus:outline-none focus:border-blue-500"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                              />
                            </div>

                            {/* Info */}
                            {product && (
                              <div className="flex flex-col justify-end text-xs w-32 pb-2">
                                <span className="text-slate-500">Unit: {formatCurrency(price)}</span>
                                {item.quantity > stock ? (
                                  <span className="text-red-400 font-semibold text-[10px]">Exceeds Stock ({stock})</span>
                                ) : (
                                  <span className="text-slate-400">Total: {formatCurrency(lineTotal)}</span>
                                )}
                              </div>
                            )}

                            {/* Remove Row Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(index)}
                              className="px-2 py-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors border border-slate-800 hover:border-red-900 rounded bg-slate-900/60"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order summary */}
                  <div className="border-t border-slate-850 pt-4 flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-400">Total Order Amount</span>
                    <span className="text-2xl font-black text-blue-400">{formatCurrency(calculateGrandTotal())}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setSelectedCustomerId("");
                        setOrderItems([{ product_id: "", quantity: 1 }]);
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded font-medium text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded font-semibold text-sm transition-colors"
                    >
                      Submit Sales Order
                    </button>
                  </div>

                </form>
              </div>
            ) : (
              /* ORDERS LIST VIEW */
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    No sales orders processed yet. Click "Create New Order" to start.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <th className="py-3 px-4">Order ID</th>
                          <th className="py-3 px-4">Customer Name</th>
                          <th className="py-3 px-4 text-center">Items Count</th>
                          <th className="py-3 px-4 text-right">Total Amount</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-sm">
                        {orders.map((ord) => {
                          const customer = customersMap[ord.customer_id];
                          const name = customer ? customer.full_name : `Customer ID: ${ord.customer_id}`;
                          const itemsCount = ord.items ? ord.items.length : 0;

                          return (
                            <tr key={ord.id} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-3.5 px-4 font-mono text-white font-bold">#{ord.id}</td>
                              <td className="py-3.5 px-4 text-slate-300">{name}</td>
                              <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{itemsCount}</td>
                              <td className="py-3.5 px-4 text-right text-blue-400 font-bold">{formatCurrency(ord.total_amount)}</td>
                              <td className="py-3.5 px-4 text-right space-x-2">
                                <button
                                  onClick={() => setSelectedOrderDetail(ord)}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                                >
                                  View Invoice
                                </button>
                                <button
                                  onClick={() => setOrderToDelete(ord)}
                                  className="px-2.5 py-1 bg-slate-800/85 hover:bg-red-950/60 hover:text-red-400 text-slate-450 rounded text-xs transition-colors"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ORDER DETAILS MODAL (INVOICE) */}
        {selectedOrderDetail && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <h3 className="text-xl font-black text-white">Sales Invoice</h3>
                  <span className="text-xs text-slate-500 font-mono">Invoice Ref: #{selectedOrderDetail.id}</span>
                </div>
                <button
                  onClick={() => setSelectedOrderDetail(null)}
                  className="text-slate-500 hover:text-slate-300 font-bold text-xl"
                >
                  &times;
                </button>
              </div>

              {/* Customer Bill To Details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-900/60 p-4 border border-slate-850 rounded text-sm text-slate-300">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Billed To:</span>
                  <span className="font-bold text-white text-base block mt-1">
                    {customersMap[selectedOrderDetail.customer_id]?.full_name || `Customer ID: ${selectedOrderDetail.customer_id}`}
                  </span>
                  <span className="text-slate-400 block">{customersMap[selectedOrderDetail.customer_id]?.email || ""}</span>
                  <span className="text-slate-400 block">{customersMap[selectedOrderDetail.customer_id]?.phone || ""}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Issued:</span>
                  <span className="text-white block mt-1">{new Date().toLocaleDateString()}</span>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">Payment Status:</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-0.5 rounded-full inline-block mt-1">Paid</span>
                </div>
              </div>

              {/* Items details table */}
              <div className="overflow-x-auto border border-slate-850 rounded">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/40 border-b border-slate-850 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right font-bold">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                    {selectedOrderDetail.items?.map((item) => {
                      const product = productsMap[item.product_id];
                      const name = product ? product.name : `Product ID: ${item.product_id}`;
                      const lineTotal = Number(item.unit_price) * item.quantity;

                      return (
                        <tr key={item.id} className="hover:bg-slate-900/30">
                          <td className="py-3 px-3 font-medium text-white">{name}</td>
                          <td className="py-3 px-3 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="py-3 px-3 text-center font-bold text-white">{item.quantity}</td>
                          <td className="py-3 px-3 text-right font-bold text-white">{formatCurrency(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-slate-400">Total Invoice Amount</span>
                <span className="text-2xl font-black text-blue-400">{formatCurrency(selectedOrderDetail.total_amount)}</span>
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-3 border-t border-slate-850">
                <button
                  onClick={() => setSelectedOrderDetail(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded text-sm transition-colors"
                >
                  Close Invoice
                </button>
              </div>

            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {orderToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">Delete Order</h3>
                <button
                  onClick={() => setOrderToDelete(null)}
                  className="text-slate-500 hover:text-slate-300 font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="text-sm text-slate-300">
                Are you sure you want to delete <span className="font-bold text-white">Order #{orderToDelete.id}</span>?
                <p className="text-red-400 mt-2">This transaction record will be permanently deleted.</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded text-sm transition-colors"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Orders;