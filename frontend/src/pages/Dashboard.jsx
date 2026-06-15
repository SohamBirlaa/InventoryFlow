import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get("/dashboard/")
      .then((res) => {
        setStats(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not connect to the backend server. Please make sure it is running.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Loading Dashboard Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto bg-red-950/30 border border-red-800/50 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              System Overview
            </h1>
            <p className="text-slate-400 mt-1">
              Real-time monitoring of products, customers, and orders.
            </p>
          </div>
          <div className="text-sm bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-lg text-slate-300">
            Current Date: <span className="font-mono text-blue-400">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Products */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
            <p className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
              Total Products
            </p>
            <div className="flex items-baseline mt-4 gap-2">
              <span className="text-4xl font-extrabold text-white">
                {stats?.total_products ?? 0}
              </span>
              <span className="text-xs text-blue-400 font-medium bg-blue-950/50 border border-blue-900/50 px-2 py-0.5 rounded">
                Items In Stock
              </span>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500">
              Active catalog items
            </div>
          </div>

          {/* Card 2: Total Customers */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all"></div>
            <p className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
              Registered Customers
            </p>
            <div className="flex items-baseline mt-4 gap-2">
              <span className="text-4xl font-extrabold text-white">
                {stats?.total_customers ?? 0}
              </span>
              <span className="text-xs text-teal-400 font-medium bg-teal-950/50 border border-teal-900/50 px-2 py-0.5 rounded">
                Clients
              </span>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500">
              Active system clients
            </div>
          </div>

          {/* Card 3: Total Orders */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
            <p className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
              Total Orders
            </p>
            <div className="flex items-baseline mt-4 gap-2">
              <span className="text-4xl font-extrabold text-white">
                {stats?.total_orders ?? 0}
              </span>
              <span className="text-xs text-indigo-400 font-medium bg-indigo-950/50 border border-indigo-900/50 px-2 py-0.5 rounded">
                Transactions
              </span>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500">
              Processed orders
            </div>
          </div>

          {/* Card 4: Low Stock Alert */}
          <div className={`bg-slate-950 border rounded-xl p-6 relative overflow-hidden group transition-all ${
            stats?.low_stock_products > 0
              ? "border-amber-500/50 hover:border-amber-400"
              : "border-slate-800 hover:border-slate-700"
          }`}>
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl group-hover:opacity-100 transition-all ${
              stats?.low_stock_products > 0 ? "bg-amber-500/10" : "bg-slate-500/10"
            }`}></div>
            <p className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
              Low Stock Alert
            </p>
            <div className="flex items-baseline mt-4 gap-2">
              <span className={`text-4xl font-extrabold ${
                stats?.low_stock_products > 0 ? "text-amber-400" : "text-white"
              }`}>
                {stats?.low_stock_products ?? 0}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                stats?.low_stock_products > 0
                  ? "text-amber-400 bg-amber-950/50 border-amber-900/50"
                  : "text-slate-400 bg-slate-950/50 border-slate-800/50"
              }`}>
                Stock &lt; 10
              </span>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500">
              {stats?.low_stock_products > 0 ? "Requires restock attention" : "Inventory stock levels stable"}
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Quick Management Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/products"
              className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-all group"
            >
              <div>
                <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">Products</h3>
                <p className="text-xs text-slate-400 mt-1">Manage catalog and stock</p>
              </div>
              <span className="text-blue-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>

            <Link
              to="/customers"
              className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-all group"
            >
              <div>
                <h3 className="font-bold text-white group-hover:text-teal-400 transition-colors">Customers</h3>
                <p className="text-xs text-slate-400 mt-1">Manage client registration</p>
              </div>
              <span className="text-teal-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>

            <Link
              to="/orders"
              className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-all group"
            >
              <div>
                <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">Orders</h3>
                <p className="text-xs text-slate-400 mt-1">Process sales & view details</p>
              </div>
              <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;