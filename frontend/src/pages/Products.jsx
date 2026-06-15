import { useEffect, useState } from "react";
import api from "../services/api";

function Products() {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Alerts
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // all, low, out

  // Form State (for Add)
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    quantity_in_stock: "",
  });

  // Edit State
  const [editingProduct, setEditingProduct] = useState(null);

  // Delete Confirmation State
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products/");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to fetch products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
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

  // Validation helper
  const validateForm = (data, isEdit = false, originalSku = "") => {
    if (!data.name.trim()) return "Product Name is required.";
    if (!data.sku.trim()) return "SKU code is required.";
    
    // SKU duplicates check (client-side)
    const skuExists = products.some(
      (p) => p.sku.toLowerCase() === data.sku.trim().toLowerCase() && (!isEdit || p.sku.toLowerCase() !== originalSku.toLowerCase())
    );
    if (skuExists) return `SKU "${data.sku}" already exists. SKU must be unique.`;

    const priceNum = Number(data.price);
    if (isNaN(priceNum) || priceNum <= 0) return "Price must be a positive number greater than 0.";

    const qtyNum = Number(data.quantity_in_stock);
    if (isNaN(qtyNum) || !Number.isInteger(qtyNum) || qtyNum < 0) return "Quantity must be an integer greater than or equal to 0.";

    return null;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm(form);
    if (validationError) {
      triggerAlert("error", validationError);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: Number(form.price),
        quantity_in_stock: Number(form.quantity_in_stock),
      };

      await api.post("/products/", payload);
      triggerAlert("success", "Product successfully added.");
      
      // Reset form
      setForm({
        name: "",
        sku: "",
        price: "",
        quantity_in_stock: "",
      });

      fetchProducts();
    } catch (err) {
      console.error(err);
      const backendErr = err.response?.data?.detail || "Failed to add product.";
      triggerAlert("error", backendErr);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm(editingProduct, true, editingProduct._originalSku);
    if (validationError) {
      triggerAlert("error", validationError);
      return;
    }

    try {
      const payload = {
        name: editingProduct.name.trim(),
        sku: editingProduct.sku.trim(),
        price: Number(editingProduct.price),
        quantity_in_stock: Number(editingProduct.quantity_in_stock),
      };

      await api.put(`/products/${editingProduct.id}`, payload);
      triggerAlert("success", "Product updated successfully.");
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const backendErr = err.response?.data?.detail || "Failed to update product.";
      triggerAlert("error", backendErr);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete.id}`);
      triggerAlert("success", `Product "${productToDelete.name}" deleted successfully.`);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const backendErr = err.response?.data?.detail || "Failed to delete product.";
      triggerAlert("error", backendErr);
      setProductToDelete(null);
    }
  };

  // Filter and search logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && p.quantity_in_stock > 0 && p.quantity_in_stock < 10) ||
      (stockFilter === "out" && p.quantity_in_stock === 0);

    return matchesSearch && matchesStock;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Products Catalog</h1>
            <p className="text-slate-400 mt-1">Add, update, and manage your inventory items.</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Product Form Column */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 h-fit">
            <h2 className="text-xl font-bold text-white mb-6">Add New Product</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Wireless Mouse"
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">SKU Code</label>
                <input
                  type="text"
                  placeholder="e.g. MOUSE-WRLS-01"
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="29.99"
                    className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    placeholder="150"
                    className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    value={form.quantity_in_stock}
                    onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors mt-2"
              >
                Add Product
              </button>
            </form>
          </div>

          {/* Product List Table Column */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
            
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="w-full sm:w-2/3 relative">
                <input
                  type="text"
                  placeholder="Search products by Name or SKU..."
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-2 pl-4 w-full text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="w-full sm:w-1/3 flex gap-2">
                <select
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white focus:outline-none focus:border-blue-500 text-sm"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="all">All Stocks</option>
                  <option value="low">Low Stock (&lt; 10)</option>
                  <option value="out">Out of Stock (0)</option>
                </select>
              </div>
            </div>

            {/* List / Table */}
            {loading ? (
              <div className="text-center py-12 text-slate-500">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No products found matching the criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4 text-right">Price</th>
                      <th className="py-3 px-4 text-center">Stock</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {filteredProducts.map((p) => {
                      // stock level badge style
                      let stockBadge = "text-emerald-400 bg-emerald-950/40 border border-emerald-900/50";
                      let stockText = "In Stock";
                      if (p.quantity_in_stock === 0) {
                        stockBadge = "text-red-400 bg-red-950/40 border border-red-900/50";
                        stockText = "Out of Stock";
                      } else if (p.quantity_in_stock < 10) {
                        stockBadge = "text-amber-400 bg-amber-950/40 border border-amber-900/50";
                        stockText = "Low Stock";
                      }

                      return (
                        <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-white">{p.name}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">{p.sku}</td>
                          <td className="py-3.5 px-4 text-right font-medium text-white">{formatCurrency(p.price)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-white">{p.quantity_in_stock}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold mt-1 ${stockBadge}`}>
                                {stockText}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => setEditingProduct({ ...p, _originalSku: p.sku })}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded text-xs transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setProductToDelete(p)}
                              className="px-2.5 py-1 bg-slate-800/80 hover:bg-red-950/60 hover:text-red-400 text-slate-400 rounded text-xs transition-colors"
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
        </div>

        {/* EDIT MODAL */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">Edit Product</h3>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-slate-500 hover:text-slate-300 font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Product Name</label>
                  <input
                    type="text"
                    className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white focus:outline-none focus:border-blue-500"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">SKU Code</label>
                  <input
                    type="text"
                    className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white focus:outline-none focus:border-blue-500"
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white focus:outline-none focus:border-blue-500"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Stock Qty</label>
                    <input
                      type="number"
                      className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white focus:outline-none focus:border-blue-500"
                      value={editingProduct.quantity_in_stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, quantity_in_stock: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {productToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">Delete Product</h3>
                <button
                  onClick={() => setProductToDelete(null)}
                  className="text-slate-500 hover:text-slate-300 font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="text-sm text-slate-300">
                Are you sure you want to delete <span className="font-bold text-white">"{productToDelete.name}"</span> (SKU: <span className="font-mono">{productToDelete.sku}</span>)?
                <p className="text-red-400 mt-2">This action is permanent and cannot be undone.</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
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

export default Products;