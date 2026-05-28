import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Activity, ArrowRight, ShieldCheck, Clock, Users, UserRound, Stethoscope, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser, registerUser } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import { Spinner } from '../components/common/UIComponents';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ fullName: '', username: '', password: '' });
  const [accountType, setAccountType] = useState('patient');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const validate = () => {
    const e = {};
    if (mode === 'register' && !form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.username.trim()) e.username = 'Username is required';
    else if (form.username.trim().length < 3) e.username = 'Username must be at least 3 characters';
    if (!form.password) e.password = 'Password is required';
    else if (mode === 'register' && form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'register' && accountType === 'admin') {
      toast.error('Admin accounts are created by the hospital administrator.');
      return;
    }
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      const payload = {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        password: form.password,
        role: accountType,
      };
      const { data } = mode === 'register'
        ? await registerUser(payload)
        : await loginUser(payload.username, payload.password, payload.role);
      login(data.user);
      toast.success(mode === 'register' ? 'Account created successfully!' : `Welcome back, ${data.user.name}!`);
      const paths = { patient: '/patient', doctor: '/doctor', admin: '/admin' };
      navigate(paths[data.user.role] || '/');
    } catch (err) {
      const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const msg = err.response?.data?.message ||
        (err.code === 'ECONNABORTED'
          ? 'Server is waking up (Render free tier). Wait 30 seconds and try again.'
          : !err.response
            ? `Cannot reach the server at ${apiUrl}. Check that Render is running and Vercel has REACT_APP_API_BASE_URL set.`
            : 'Unable to sign in. Please check your credentials and try again.');
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ─── Left Panel ─────────────────────────── */}
      <div className="hidden lg:flex flex-col bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }} />
        </div>

        <div className="relative flex-1 flex flex-col justify-between p-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Activity size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-xl">HealthSync</span>
          </Link>

          {/* Center Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h1 className="font-display font-bold text-white text-4xl leading-tight mb-4">
                Your Health,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-300">
                  Our Priority
                </span>
              </h1>
              <p className="text-white/60 text-lg leading-relaxed mb-10">
                Sign in to access your personalized healthcare dashboard with appointments, records, and more.
              </p>
              <div className="space-y-4">
                {[
                  { icon: ShieldCheck, text: 'HIPAA-compliant secure platform' },
                  { icon: Clock, text: 'Real-time appointment management' },
                  { icon: Users, text: 'Connected care across departments' },
                ].map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <f.icon size={16} className="text-accent" />
                    </div>
                    <span className="text-white/80 text-sm">{f.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { v: '50K+', l: 'Patients' },
              { v: '200+', l: 'Doctors' },
              { v: '98%', l: 'Satisfaction' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <div className="font-display font-bold text-white text-xl">{s.v}</div>
                <div className="text-white/50 text-xs">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Panel ────────────────────────── */}
      <div className="flex items-center justify-center bg-bg p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Activity size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-dark text-lg">HealthSync</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-dark text-3xl mb-2">
              {mode === 'register' ? 'Create account' : 'Welcome back'}
            </h2>
            <p className="text-muted text-sm">
              {mode === 'register'
                ? 'Register with your username and password'
                : 'Sign in to your HealthSync account'}
            </p>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Account Type</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'patient', label: 'Patient', icon: UserRound },
                { value: 'doctor', label: 'Doctor', icon: Stethoscope },
                { value: 'admin', label: 'Admin', icon: Shield },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setAccountType(item.value);
                    setErrors({});
                    if (item.value === 'admin' && mode === 'register') setMode('login');
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${
                    accountType === item.value
                      ? 'border-primary bg-primary/10 text-primary shadow-card'
                      : 'border-border bg-white text-muted hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
            {accountType === 'admin' && (
              <p className="text-xs text-muted mt-3 bg-hover rounded-lg px-3 py-2">
                Admin login only. Create your admin username and password using the backend command after setup.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl px-4 py-3"
              >
                {errors.general}
              </motion.div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-dark text-sm font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  className={`input-field ${errors.fullName ? 'border-danger focus:ring-danger/30' : ''}`}
                  placeholder={accountType === 'doctor' ? 'Dr. Your Name' : 'Your full name'}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  autoComplete="name"
                />
                {errors.fullName && <p className="text-danger text-xs mt-1">{errors.fullName}</p>}
              </div>
            )}

            <div>
              <label className="block text-dark text-sm font-semibold mb-2">Username</label>
              <input
                type="text"
                className={`input-field ${errors.username ? 'border-danger focus:ring-danger/30' : ''}`}
                placeholder="Enter your username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
              />
              {errors.username && <p className="text-danger text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-dark text-sm font-semibold">Password</label>
                <button type="button" className="text-primary text-xs font-medium hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`input-field pr-12 ${errors.password ? 'border-danger focus:ring-danger/30' : ''}`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-dark transition-colors"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 text-sm py-3.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <><Spinner size={18} /> {mode === 'register' ? 'Creating account...' : 'Signing in...'}</>
              ) : (
                <>{mode === 'register' ? 'Register' : 'Sign In'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {accountType !== 'admin' && (
            <p className="text-center text-muted text-sm mt-6">
              {mode === 'register' ? 'Already registered?' : 'New to HealthSync?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'register' ? 'login' : 'register');
                  setErrors({});
                }}
                className="text-primary font-semibold hover:underline"
              >
                {mode === 'register' ? 'Sign in' : 'Sign up to register'}
              </button>
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-border flex items-center justify-center gap-6">
            {['NABH', 'ISO 27001', 'HIPAA'].map(b => (
              <div key={b} className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-success" />
                <span className="text-muted text-xs">{b}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
