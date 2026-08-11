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
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');

  // Sign Up state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [assignedStoreId, setAssignedStoreId] = useState<string>(stores[0]?.id || 'store-1');
  const [password, setPassword] = useState('');
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
      setSignInError('No account found with this email or username.');
      return;
    }

    if (user.password && signInPassword && user.password !== signInPassword) {
      setSignInError('Incorrect password.');
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
      pin: '1234',
      assignedStoreId,
      department: role === 'admin' ? 'Store Director' : 'Cashier & Sales',
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };

    onSignUp(newUser);
    onSignIn(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              ThreadsStyle POS
            </span>
          </div>
          {currentUser && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕ Close
            </button>
          )}
        </div>

        {/* Modal Center Content */}
        <div className="p-6 pt-2 space-y-5">
          {/* App Icon / Command Symbol */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/25 text-white text-xl font-bold">
              ⌘
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {authMode === 'signup'
                  ? 'Join the future of retail POS & multi-store inventory.'
                  : 'Sign in to your cashier or admin workstation.'}
              </p>
            </div>
          </div>

          {currentUser && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-slate-500 block">Logged in as:</span>
                <strong className="text-indigo-900 font-bold">
                  {currentUser.name} ({currentUser.role === 'admin' ? '👑 Admin' : '👔 Employee'})
                </strong>
              </div>
              <button
                onClick={() => {
                  onSignIn(currentUser);
                  onClose();
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {/* Role selector tab for Employee vs Admin */}
          <div className="space-y-2">
            <div className="bg-slate-100 p-1 rounded-2xl grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setRole('employee')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  role === 'employee'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>👔</span> Employee Role
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  role === 'admin'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>👑</span> Admin Role
              </button>
            </div>

            {/* Role Permission Badge */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              {role === 'employee' ? (
                <div>
                  <span className="font-bold text-slate-800">👔 Employee POS Access:</span> Make a sale (POS Register), Hold & Layaway, Return & Exchange, Customers & Loyalty.
                </div>
              ) : (
                <div>
                  <span className="font-bold text-indigo-900">👑 Admin Role Access:</span> All Employee POS tools + Multi-Store Inventory Matrix, Store Management, Analytics & Staff Accounts.
                </div>
              )}
            </div>
          </div>

          {authMode === 'signup' ? (
            /* Sign Up Form */
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              {signUpError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {signUpError}
                </div>
              )}

              {/* Full Name */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Full Name (e.g. Cole Sonea)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              {/* Username / Handle */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="text-xs font-bold">@</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Username (e.g. wilson)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Email address (e.g. collesonea@gmail.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              {/* Assigned Store */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 px-1">
                  Assigned Store Branch
                </label>
                <select
                  value={assignedStoreId}
                  onChange={(e) => setAssignedStoreId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 text-xs mt-2"
              >
                Create Account
              </button>
            </form>
          ) : (
            /* Sign In Form */
            <form onSubmit={handleSignInSubmit} className="space-y-3.5">
              {signInError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {signInError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 px-1">
                  Email or Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. collesonea@gmail.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 px-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter password..."
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 text-xs mt-2"
              >
                Sign In to Workstation
              </button>
            </form>
          )}

          {/* Footer toggle link */}
          <div className="text-center pt-2">
            {authMode === 'signup' ? (
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Create Account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
