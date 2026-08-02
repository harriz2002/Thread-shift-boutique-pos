import React, { useState } from 'react';
import { UserAccount, StoreLocation, UserRole } from '../types';
import { Users, Shield, UserPlus, Trash2, Edit2, Check, X, Search, Building2, KeyRound } from 'lucide-react';

interface StaffManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  users: UserAccount[];
  stores: StoreLocation[];
  onAddUser: (user: UserAccount) => void;
  onUpdateUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser: (user: UserAccount) => void;
}

export const StaffManagerModal: React.FC<StaffManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  stores,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'employee'>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New staff form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [assignedStoreId, setAssignedStoreId] = useState<string>(stores[0]?.id || 'store-1');
  const [department, setDepartment] = useState('Sales Associate');
  const [password, setPassword] = useState('employee123');
  const [pin, setPin] = useState('1234');

  if (!isOpen) return null;

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      password: password.trim() || 'employee123',
      pin: pin.trim() || '1234',
      assignedStoreId,
      department: department.trim() || (role === 'admin' ? 'Store Director' : 'Cashier'),
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };

    onAddUser(newUser);
    setIsAddingNew(false);
    setName('');
    setEmail('');
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getStoreName = (storeId?: string) => {
    if (!storeId) return 'All Stores / Unassigned';
    const st = stores.find((s) => s.id === storeId);
    return st ? st.name : storeId;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Staff Directory & Role Management (Admin Platform)
              </h2>
              <p className="text-xs text-slate-400">
                Manage employees, store admins, access permissions & POS PINs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Top Controls Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-grow max-w-sm">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name, email, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="admin">Admins ({users.filter(u => u.role === 'admin').length})</option>
              <option value="employee">Employees ({users.filter(u => u.role === 'employee').length})</option>
            </select>

            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {isAddingNew ? 'Cancel New Staff' : 'Add Staff Member'}
            </button>
          </div>
        </div>

        {/* Add New Staff Form Drawer */}
        {isAddingNew && (
          <form onSubmit={handleCreateStaff} className="p-4 bg-slate-800/80 border-b border-slate-700/60 space-y-3">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              Register New Employee or Admin Account
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Ochieng"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. samuel@threadsstyle.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Platform Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
                >
                  <option value="employee">👔 Employee / Cashier (POS & Store operations)</option>
                  <option value="admin">👑 Store Admin / Director (All permissions)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Assigned Store</label>
                <select
                  value={assignedStoreId}
                  onChange={(e) => setAssignedStoreId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  {stores.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Department / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Cashier"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">4-Digit POS PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 5555"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm"
              >
                Create Staff Account
              </button>
            </div>
          </form>
        )}

        {/* Staff Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Staff Member</th>
                  <th className="py-2.5 px-3">Platform Role</th>
                  <th className="py-2.5 px-3">Assigned Store</th>
                  <th className="py-2.5 px-3">PIN / Access</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {u.role === 'admin' ? '👑' : '👔'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-1.5">
                              {u.name}
                              {isSelf && (
                                <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-normal">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                            <div className="text-[11px] text-slate-500">{u.department}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Switcher */}
                      <td className="py-3 px-3">
                        <select
                          value={u.role}
                          onChange={(e) => {
                            const newRole = e.target.value as UserRole;
                            onUpdateUser({ ...u, role: newRole });
                          }}
                          disabled={isSelf}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none ${
                            u.role === 'admin'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          } ${isSelf ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <option value="employee">👔 Employee Platform</option>
                          <option value="admin">👑 Admin Platform</option>
                        </select>
                      </td>

                      {/* Store */}
                      <td className="py-3 px-3">
                        <select
                          value={u.assignedStoreId || stores[0]?.id}
                          onChange={(e) => {
                            onUpdateUser({ ...u, assignedStoreId: e.target.value });
                          }}
                          className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 max-w-[170px] truncate"
                        >
                          {stores.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* PIN code badge */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-xs font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
                          <KeyRound className="w-3 h-3 text-slate-500" />
                          {u.pin || '1234'}
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (isSelf) return;
                            onUpdateUser({ ...u, isActive: !u.isActive });
                          }}
                          disabled={isSelf}
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                            u.isActive
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => {
                                onSwitchUser(u);
                                onClose();
                              }}
                              title="Switch to this account immediately"
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 px-2.5 py-1 rounded-lg border border-slate-700 font-semibold"
                            >
                              Login As
                            </button>
                          )}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => onDeleteUser(u.id)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                              title="Delete staff account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Total Accounts: <span className="text-white font-bold">{users.length}</span> (
            <span className="text-amber-400 font-semibold">{users.filter(u => u.role === 'admin').length} Admins</span>,{' '}
            <span className="text-blue-400 font-semibold">{users.filter(u => u.role === 'employee').length} Employees</span>)
          </div>
          <div className="text-slate-500 text-[11px]">
            All changes auto-save to Firebase Firestore DB
          </div>
        </div>
      </div>
    </div>
  );
};
