import React, { useState } from 'react';
import { UserAccount, StoreLocation, UserRole } from '../types';
import { Shield, User, Lock, Mail, Building2, UserCheck, ArrowRight, Sparkles, UserPlus, LogIn, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  users: UserAccount[];
  stores: StoreLocation[];
  onSignIn: (user: UserAccount) => void;
  onSignUp: (newUser: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  stores,
  onSignIn,
  onSignUp,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');

  // Sign Up state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [assignedStoreId, setAssignedStoreId] = useState<string>(stores[0]?.id || 'store-1');
  const [department, setDepartment] = useState('Cashier & Sales');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('1234');
  const [signUpError, setSignUpError] = useState('');

  if (!isOpen) return null;

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');

    const trimmedEmail = signInEmail.trim().toLowerCase();
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === trimmedEmail ||
        u.name.toLowerCase() === trimmedEmail
    );

    if (!user) {
      setSignInError('No account found with this email or name.');
      return;
    }

    if (user.password && signInPassword && user.password !== signInPassword) {
      setSignInError('Incorrect password or PIN.');
      return;
    }

    onSignIn(user);
    onClose();
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setSignUpError('Please fill in Name, Email, and Password.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      setSignUpError('An account with this email already exists.');
      return;
    }

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: trimmedEmail,
      role,
      password: password.trim(),
      pin: pin.trim() || '0000',
      assignedStoreId,
      department: department.trim() || (role === 'admin' ? 'Executive Director' : 'Cashier & Sales'),
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };

    onSignUp(newUser);
    onSignIn(newUser);
    onClose();
  };

  // Quick demo logins
  const handleDemoLogin = (roleToLogin: 'admin' | 'employee') => {
    const found = users.find((u) => u.role === roleToLogin && u.isActive);
    if (found) {
      onSignIn(found);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Staff & Admin Portal
              </h2>
              <p className="text-xs text-slate-400">
                Sign in to switch between Employee Cashier & Admin Executive platforms
              </p>
            </div>
          </div>
          {currentUser && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          )}
        </div>

        {/* Current Active Account Banner (if already logged in) */}
        {currentUser && (
          <div className="bg-slate-800/80 px-5 py-3 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-slate-400">Currently Logged In:</span>
              <span className="text-xs font-bold text-white bg-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                {currentUser.role === 'admin' ? (
                  <span className="text-amber-400">👑 ADMIN</span>
                ) : (
                  <span className="text-blue-400">👔 EMPLOYEE</span>
                )}
                — {currentUser.name}
              </span>
            </div>
            <button
              onClick={() => {
                // Keep modal open so they can switch
              }}
              className="text-xs text-amber-400 hover:underline font-medium"
            >
              Switch Account
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setSignInError('');
            }}
            className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'signin'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Sign In (Employee / Admin)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setSignUpError('');
            }}
            className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'signup'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Register New Staff / Admin
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {activeTab === 'signin' ? (
            <div className="space-y-6">
              {/* Quick Demo Login Cards */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Instant Quick Demo Access:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Admin Demo Button */}
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('admin')}
                    className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-purple-600/10 hover:from-amber-500/20 hover:to-purple-600/20 border border-amber-500/30 text-left transition-all group shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        👑 Admin Platform
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-xs font-semibold text-white">Sarah Vance (Director)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Full access: POS, Inventory, Reorder Level Alerts, Store Management & Financial Analytics
                    </p>
                  </button>

                  {/* Employee Demo Button */}
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('employee')}
                    className="p-3.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-emerald-600/10 hover:from-blue-500/20 hover:to-emerald-600/20 border border-blue-500/30 text-left transition-all group shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                        👔 Employee Platform
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-xs font-semibold text-white">David Kamau (Cashier)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Streamlined POS Register, Layaways, Customer Lookup & Tag Barcode Scanner
                    </p>
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-xs text-slate-500 font-semibold">OR SIGN IN WITH EMAIL</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Standard Sign In Form */}
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                {signInError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {signInError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Staff Email or Full Name
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. cashier@threadsstyle.com or admin@threadsstyle.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password / PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="e.g. admin or employee (or PIN)"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Default demo passwords: <span className="text-slate-400 font-mono">admin</span> for admin account or <span className="text-slate-400 font-mono">employee</span> for employee accounts.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In to Platform
                </button>
              </form>
            </div>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              {signUpError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {signUpError}
                </div>
              )}

              {/* Role Selection (Admin vs Employee Platform) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Platform Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('employee');
                      if (department === 'Executive Director') setDepartment('Cashier & Sales');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      role === 'employee'
                        ? 'bg-blue-500/20 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      👔
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-300">Employee / Cashier</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        POS Checkout, Inventory lookup, Customer loyalty & layaways
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('admin');
                      setDepartment('Executive Director');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      role === 'admin'
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      👑
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-300">Store Admin</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Full access: Financials, Reorder alerts, Store & Staff control
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Mwangi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. jane@threadsstyle.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assigned Store Location
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={assignedStoreId}
                      onChange={(e) => setAssignedStoreId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Job Title / Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Cashier"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Set password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    4-Digit POS PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 1234"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <UserCheck className="w-4 h-4" />
                Create Account & Sign In ({role === 'admin' ? 'Admin Platform' : 'Employee Platform'})
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
