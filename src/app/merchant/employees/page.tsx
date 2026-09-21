'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { User, EmployeeSubRole } from '@/types';
import { UserCheck, PlusCircle, Search, Shield, Phone, Mail, Key } from 'lucide-react';

export default function MerchantEmployeesPage() {
  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  const [employees, setEmployees] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [subRole, setSubRole] = useState<EmployeeSubRole>('CASHIER');
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    if (!companyId) return;
    const all = localStore.getCompanyUsers(companyId);
    setEmployees(all.filter((u) => u.role === 'EMPLOYEE'));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    return () => unsub();
  }, [companyId]);

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !username.trim() || !password) {
      setError('Please provide all mandatory fields.');
      return;
    }

    const existing = localStore.getAllUsers().find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (existing) {
      setError(`Username '${username}' is already in use.`);
      return;
    }

    const newEmp: User = {
      id: `usr_emp_${Date.now()}`,
      companyId,
      username: username.trim(),
      email: email.trim() || `${username.trim()}@shop.com`,
      mobile: mobile.trim() || '9876543210',
      name: name.trim(),
      role: 'EMPLOYEE',
      subRole,
      status: 'ACTIVE',
      permissions:
        subRole === 'CASHIER'
          ? ['pos.billing', 'sales.view', 'customers.view']
          : subRole === 'INVENTORY'
          ? ['products.view', 'products.edit', 'inventory.manage']
          : ['pos.billing', 'sales.view', 'products.view', 'inventory.manage', 'reports.view'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveUser(newEmp, password);
    localStore.addAuditLog({
      companyId,
      userId: user?.id || 'merchant',
      userName: user?.name || 'Merchant',
      userRole: 'MERCHANT',
      action: 'EMPLOYEE_CREATED',
      module: 'employees',
      entityType: 'user',
      entityId: newEmp.id,
      details: `Created employee '${newEmp.name}' with subrole ${subRole}`,
    });

    setShowAddModal(false);
    setName('');
    setUsername('');
    setPassword('');
    setMobile('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Roles Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create employee logins for cashiers, store clerks, inventory handlers and branch managers
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Employee Account</span>
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {employees.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-700">No Staff Accounts Created Yet</div>
            <p className="text-slate-400 mt-1">
              Add your cashiers and store clerks so they can operate the POS under their own credentials.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Employee Name</th>
                  <th className="px-4 py-3.5">Login Username</th>
                  <th className="px-4 py-3.5">Assigned Subrole</th>
                  <th className="px-4 py-3.5">Active Permissions</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[11px] text-slate-500">{emp.mobile}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-blue-700 font-bold">@{emp.username}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {emp.subRole || 'CASHIER'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <span className="text-[11px]">{emp.permissions.join(', ')}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col p-4 sm:p-6 border border-slate-200 text-xs">
            <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add Staff Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 font-bold p-1 hover:text-slate-600">✕</button>
            </div>

            {error && <div className="flex-shrink-0 mb-3 p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">{error}</div>}

            <form onSubmit={handleCreateEmployee} className="flex-1 flex flex-col min-h-0 text-xs">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikas Sharma"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Store Role</label>
                  <select
                    value={subRole}
                    onChange={(e: any) => setSubRole(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="CASHIER">Cashier (POS & Billing only)</option>
                    <option value="SALES">Sales Associate (POS, Catalog & Customers)</option>
                    <option value="INVENTORY">Inventory Manager (Stock & Inward Purchases)</option>
                    <option value="MANAGER">Store Manager (Full Store Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit phone"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Username *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. cashier_vikas"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2 bg-white">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
