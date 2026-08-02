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

  const handleDemoEmployee = () => {
    const demoEmployee: UserAccount = {
      id: `emp-demo-${Date.now()}`,
      name: 'Cole Sonea (Cashier)',
      email: 'collesonea@gmail.com',
      role: 'employee',
      password: 'password123',
      pin: '1234',
      assignedStoreId: stores[0]?.id || 'store-1',
      department: 'Cashier & Sales',
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };
    onSignUp(demoEmployee);
    onSignIn(demoEmployee);
    onClose();
  };

  const handleDemoAdmin = () => {
    const demoAdmin: UserAccount = {
      id: `admin-demo-${Date.now()}`,
      name: 'Wilson Admin (Director)',
      email: 'admin@threadsstyle.co.ke',
      role: 'admin',
      password: 'adminpassword123',
      pin: '9999',
      assignedStoreId: stores[0]?.id || 'store-1',
      department: 'Store Director',
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };
    onSignUp(demoAdmin);
    onSignIn(demoAdmin);
    onClose();
  };

  const handleGoogleDemo = () => {
    const demoUser: UserAccount = {
      id: `google-${Date.now()}`,
      name: name.trim() || 'Google User',
      email: email.trim() || 'user@gmail.com',
      role: role,
      password: 'password123',
      pin: '1234',
      assignedStoreId: stores[0]?.id || 'store-1',
      department: role === 'admin' ? 'Store Director' : 'Cashier & Sales',
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };
    onSignUp(demoUser);
    onSignIn(demoUser);
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

          {/* OR Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase font-bold tracking-widest bg-white px-2">
              OR
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Quick Demo Role Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDemoEmployee}
              className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shadow-sm"
              title="1-Click sign in as Employee Cashier"
            >
              <span>👔</span> Demo Employee
            </button>
            <button
              type="button"
              onClick={handleDemoAdmin}
              className="w-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shadow-sm"
              title="1-Click sign in as Store Admin"
            >
              <span>👑</span> Demo Admin
            </button>
          </div>

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleDemo}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.2 21.3 7.23 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.99 0 12s.43 3.9 1.19 5.42l4.09-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.2 2.7 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Continue with Google
          </button>

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
