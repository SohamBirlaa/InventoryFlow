import { useEffect, useState } from "react";
import api from "../services/api";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Alerts
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Add Form State
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  // Delete Confirmation State
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/customer/");
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to fetch customers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
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

  const validateForm = (data) => {
    if (!data.full_name.trim()) return "Full Name is required.";
    if (!data.email.trim()) return "Email is required.";
    
    // simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!data.phone.trim()) return "Phone number is required.";

    // Check duplicate email locally
    const emailExists = customers.some(
      (c) => c.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    if (emailExists) {
      return `Email "${data.email}" is already registered.`;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm(form);
    if (validationError) {
      triggerAlert("error", validationError);
      return;
    }

    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };

      await api.post("/customer/", payload);
      triggerAlert("success", "Customer registered successfully.");
      
      setForm({
        full_name: "",
        email: "",
        phone: "",
      });

      fetchCustomers();
    } catch (err) {
      console.error(err);
      const backendErr = err.response?.data?.details || err.response?.data?.detail || "Failed to register customer.";
      triggerAlert("error", backendErr);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await api.delete(`/customer/${customerToDelete.id}`);
      triggerAlert("success", `Customer "${customerToDelete.full_name}" removed successfully.`);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      const backendErr = err.response?.data?.detail || "Failed to delete customer.";
      triggerAlert("error", backendErr);
      setCustomerToDelete(null);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    return (
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Customers Directory</h1>
            <p className="text-slate-400 mt-1">Register and manage customer profiles.</p>
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
          
          {/* Add Customer Column */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 h-fit">
            <h2 className="text-xl font-bold text-white mb-6">Register Customer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. john@example.com"
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 019-2834"
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors mt-2"
              >
                Register Customer
              </button>
            </form>
          </div>

          {/* Customer List Column */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search customers by Name, Email, or Phone..."
                className="bg-slate-900 border border-slate-800 rounded px-3 py-2 pl-4 w-full text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* List / Table */}
            {loading ? (
              <div className="text-center py-12 text-slate-500">Loading customers...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No customers found matching the search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Customer Details</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {filteredCustomers.map((c) => {
                      // Initials for avatar
                      const initials = c.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center font-bold text-xs">
                                {initials}
                              </div>
                              <div>
                                <span className="font-semibold text-white block">{c.full_name}</span>
                                <span className="text-xs text-slate-500">ID: {c.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-350">{c.email}</td>
                          <td className="py-3.5 px-4 text-slate-300">{c.phone}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setCustomerToDelete(c)}
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

        {/* DELETE CONFIRMATION MODAL */}
        {customerToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">Delete Customer</h3>
                <button
                  onClick={() => setCustomerToDelete(null)}
                  className="text-slate-500 hover:text-slate-300 font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="text-sm text-slate-300">
                Are you sure you want to delete <span className="font-bold text-white">"{customerToDelete.full_name}"</span> (Email: <span className="font-mono text-blue-400">{customerToDelete.email}</span>)?
                <p className="text-red-400 mt-2">All data associated with this customer will be removed.</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(null)}
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

export default Customers;