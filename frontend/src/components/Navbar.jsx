import { NavLink } from "react-router-dom";

function Navbar() {
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-slate-800 text-blue-400"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <nav className="bg-slate-950 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                InventoryFlow
              </span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-700">
                v1.0
              </span>
            </div>
            <div className="flex space-x-4">
              <NavLink to="/" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/products" className={linkClass}>
                Products
              </NavLink>
              <NavLink to="/customers" className={linkClass}>
                Customers
              </NavLink>
              <NavLink to="/orders" className={linkClass}>
                Orders
              </NavLink>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-slate-400 font-medium">System Online</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 ml-2 animate-pulse"></span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;