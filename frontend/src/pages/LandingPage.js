import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDoctors } from '../services/api';
import { normalizeDoctor } from '../utils/doctorUtils';
import { SAMPLE_DOCTORS } from '../data/sampleDoctors';
import {
  Activity, Heart, Shield, Clock, Star, ChevronRight,
  Phone, Mail, MapPin, ArrowRight, CheckCircle2,
  Stethoscope, Brain, Bone, Eye, Baby, Microscope,
  Users, Award, TrendingUp, Menu, X, Zap
} from 'lucide-react';

const NAV_LINKS = ['Services', 'Doctors', 'About', 'Contact'];

const STATS = [
  { value: '50,000+', label: 'Patients Served', icon: Users },
  { value: '200+', label: 'Expert Doctors', icon: Stethoscope },
  { value: '15+', label: 'Years of Excellence', icon: Award },
  { value: '98%', label: 'Patient Satisfaction', icon: TrendingUp },
];

const SERVICES = [
  { icon: Heart, title: 'Cardiology', desc: 'Advanced cardiac care with state-of-the-art diagnostics', color: 'from-red-500/10 to-pink-500/10', accent: '#EF4444' },
  { icon: Brain, title: 'Neurology', desc: 'Expert neurological diagnosis and treatment plans', color: 'from-purple-500/10 to-indigo-500/10', accent: '#8B5CF6' },
  { icon: Bone, title: 'Orthopedics', desc: 'Comprehensive bone, joint and sports injury care', color: 'from-amber-500/10 to-orange-500/10', accent: '#F59E0B' },
  { icon: Eye, title: 'Ophthalmology', desc: 'Complete eye care from vision to surgery', color: 'from-cyan-500/10 to-blue-500/10', accent: '#06B6D4' },
  { icon: Baby, title: 'Pediatrics', desc: 'Specialized healthcare for infants and children', color: 'from-green-500/10 to-emerald-500/10', accent: '#10B981' },
  { icon: Microscope, title: 'Pathology', desc: 'Precision diagnostics with cutting-edge lab technology', color: 'from-primary/10 to-primary-light/10', accent: '#1E88E5' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Marketing Director', text: 'HealthSync made booking appointments incredibly seamless. The digital records system is a game-changer.', rating: 5, avatar: 'PS' },
  { name: 'Rohit Verma', role: 'Software Engineer', text: "The doctors are world-class and the platform's ease of use is unmatched. Highly recommend!", rating: 5, avatar: 'RV' },
  { name: 'Ananya Patel', role: 'Teacher', text: 'From consultation to billing, everything is transparent and professional. Truly a premium experience.', rating: 5, avatar: 'AP' },
];

const WHY_US = [
  'AI-powered appointment scheduling',
  'Real-time doctor availability',
  'Secure digital medical records',
  'Transparent billing & payments',
  'Telemedicine consultations',
  '24/7 patient support',
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    getDoctors()
      .then(res => {
        const doctorsData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const normalized = doctorsData.map(normalizeDoctor);
        setDoctors(normalized.length > 0 ? normalized : SAMPLE_DOCTORS.map(normalizeDoctor));
      })
      .catch(() => {
        setDoctors(SAMPLE_DOCTORS.map(normalizeDoctor));
      })
      .finally(() => setLoadingDoctors(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg font-sans overflow-x-hidden">
      {/* ─── Navbar ────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-xl shadow-card border-b border-border/50' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-card">
              <Activity size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-dark text-lg">HealthSync</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-muted hover:text-primary text-sm font-medium transition-colors">
                {l}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-primary font-semibold text-sm px-4 py-2 rounded-xl hover:bg-hover transition-colors">
              Sign In
            </Link>
            <Link to="/login" className="btn-primary text-sm py-2.5">
              Book Appointment
            </Link>
          </div>
          <button className="md:hidden p-2 rounded-xl hover:bg-hover" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-border px-6 py-4 space-y-3">
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="block text-muted text-sm font-medium py-2" onClick={() => setMenuOpen(false)}>
                {l}
              </a>
            ))}
            <Link to="/login" className="block btn-primary text-center text-sm mt-2">Book Appointment</Link>
          </div>
        )}
      </nav>

      {/* ─── Hero ────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center bg-gradient-hero overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-primary-light/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
          {/* Floating dots pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 mb-6">
              <Zap size={12} className="text-accent" />
              India's Premier Hospital Management Platform
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display font-bold text-white text-5xl lg:text-6xl xl:text-7xl leading-tight mb-6">
              Healthcare{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-300">
                Reimagined
              </span>{' '}
              for the Digital Age
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/70 text-lg leading-relaxed mb-8 max-w-xl">
              Experience world-class medical care with seamless appointment booking, instant access to your health records, and transparent billing — all in one intelligent platform.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link to="/login" className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-4 rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm">
                Book Appointment <ArrowRight size={16} />
              </Link>
              <a href="#services" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all text-sm">
                Explore Services
              </a>
            </motion.div>
            <motion.div variants={fadeUp} className="flex items-center gap-6 mt-10">
              <div className="flex -space-x-3">
                {['AK', 'PM', 'SR', 'VR'].map((init, i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-primary-light border-2 border-white flex items-center justify-center text-white font-bold text-xs">
                    {init}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-white/70 text-xs">Trusted by 50,000+ patients</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Main card */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: 'Active Patients', value: '12,847', icon: Users, color: 'text-accent' },
                    { label: 'Appointments Today', value: '248', icon: Clock, color: 'text-blue-300' },
                    { label: 'Recovery Rate', value: '98.2%', icon: TrendingUp, color: 'text-green-400' },
                    { label: 'Avg Response', value: '< 2 min', icon: Zap, color: 'text-amber-400' },
                  ].map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="bg-white/10 rounded-2xl p-4"
                    >
                      <s.icon size={20} className={`${s.color} mb-2`} />
                      <div className="font-display font-bold text-white text-xl">{s.value}</div>
                      <div className="text-white/60 text-xs">{s.label}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/80 text-sm font-semibold">Health Metrics</span>
                    <span className="text-accent text-xs">Live</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Bed Occupancy', pct: 72 },
                      { label: 'ICU Availability', pct: 45 },
                      { label: 'Staff on Duty', pct: 88 },
                    ].map((m, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                          <span>{m.label}</span><span>{m.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-accent to-primary-light rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${m.pct}%` }}
                            transition={{ delay: 0.8 + i * 0.15, duration: 0.8 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="absolute -top-6 -right-6 bg-accent text-white rounded-2xl px-4 py-3 shadow-glow"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span className="font-semibold text-sm">NABH Accredited</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Bar ───────────────────────────── */}
      <section className="bg-white border-b border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {STATS.map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-hover rounded-xl mb-3">
                  <s.icon size={22} className="text-primary" />
                </div>
                <div className="font-display font-bold text-3xl text-dark mb-1">{s.value}</div>
                <div className="text-muted text-sm">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Services ────────────────────────────── */}
      <section id="services" className="py-24 max-w-7xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-hover text-primary text-xs font-semibold px-4 py-2 rounded-full mb-4">
              <Stethoscope size={12} />
              Our Specializations
            </div>
            <h2 className="section-title text-4xl mb-4">World-Class Medical Services</h2>
            <p className="text-muted max-w-xl mx-auto">Comprehensive healthcare across all major specializations, delivered by India's finest medical professionals.</p>
          </motion.div>
          <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s, i) => (
              <motion.div
                key={i} variants={fadeUp}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50 group cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <s.icon size={24} style={{ color: s.accent }} />
                </div>
                <h3 className="font-display font-bold text-dark text-lg mb-2">{s.title}</h3>
                <p className="text-muted text-sm leading-relaxed mb-4">{s.desc}</p>
                <div className="flex items-center text-primary text-sm font-semibold group-hover:gap-2 gap-1 transition-all">
                  Learn more <ChevronRight size={14} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Doctors ────────────────────────────── */}
      <section id="doctors" className="py-24 bg-hover/30 max-w-7xl mx-auto px-6 border-b border-border/50">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-hover text-primary text-xs font-semibold px-4 py-2 rounded-full mb-4">
              <Users size={12} />
              Our Medical Experts
            </div>
            <h2 className="section-title text-4xl mb-4">Meet Our Top Doctors</h2>
            <p className="text-muted max-w-xl mx-auto">Dedicated professionals committed to providing the best healthcare experience across various specializations.</p>
          </motion.div>
          
          {loadingDoctors ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-border/50 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse mb-4" />
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse" />
                  <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <p className="text-center text-muted">No doctors available right now. Run the database seed script to add sample doctors.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {doctors.map((doctor, i) => (
                <motion.div 
                  key={doctor.doctor_id || i}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50 group flex flex-col h-full"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {(doctor.full_name || 'Dr').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <h3 className="font-display font-bold text-dark text-lg truncate mb-1" title={`Dr. ${doctor.full_name || 'Unknown'}`}>
                    Dr. {doctor.full_name || 'Unknown'}
                  </h3>
                  <p className="text-primary text-sm font-medium mb-4 truncate">{doctor.specialization || 'General Practitioner'}</p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
                    <div className="bg-hover rounded-xl p-3">
                      <div className="text-muted text-xs mb-0.5">Department</div>
                      <div className="font-semibold text-dark text-sm truncate">{doctor.department_name || 'General'}</div>
                    </div>
                    <div className="bg-hover rounded-xl p-3">
                      <div className="text-muted text-xs mb-0.5">Experience</div>
                      <div className="font-semibold text-dark text-sm truncate">{doctor.experience_years || 0} Years</div>
                    </div>
                  </div>
                  
                  <Link to="/login" className="flex items-center justify-center w-full py-2.5 rounded-xl border border-primary/20 text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-colors">
                    Book Appointment
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* ─── Why Choose Us ───────────────────────── */}
      <section className="py-24 bg-gradient-hero overflow-hidden relative" id="about">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 mb-6">
                <Shield size={12} className="text-accent" />
                Why HealthSync
              </div>
              <h2 className="section-title text-4xl text-white mb-6">Built for the Future of Healthcare</h2>
              <p className="text-white/70 text-lg mb-8 leading-relaxed">
                We combine clinical excellence with cutting-edge technology to deliver a healthcare experience that's efficient, transparent, and deeply human.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-6 py-3.5 rounded-xl hover:shadow-glow hover:-translate-y-0.5 transition-all text-sm">
                Get Started Today <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div variants={stagger} className="grid grid-cols-1 gap-3">
              {WHY_US.map((item, i) => (
                <motion.div key={i} variants={fadeUp} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/10">
                  <CheckCircle2 size={18} className="text-accent flex-shrink-0" />
                  <span className="text-white/90 font-medium text-sm">{item}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────── */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-hover text-primary text-xs font-semibold px-4 py-2 rounded-full mb-4">
              <Star size={12} />
              Patient Stories
            </div>
            <h2 className="section-title text-4xl mb-4">What Our Patients Say</h2>
          </motion.div>
          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-white rounded-2xl p-6 shadow-card border border-border/50">
                <div className="flex mb-3">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={14} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-dark/80 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-dark text-sm">{t.name}</div>
                    <div className="text-muted text-xs">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── CTA ────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="bg-white rounded-3xl p-12 shadow-modal border border-border/50">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Activity size={28} className="text-white" />
              </div>
              <h2 className="section-title text-3xl mb-4">Ready to Experience Premium Healthcare?</h2>
              <p className="text-muted mb-8">Join thousands of patients who trust HealthSync for their medical care.</p>
              <Link to="/login" className="inline-flex items-center gap-2 btn-primary px-10 py-4">
                Book Your Appointment <ArrowRight size={16} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────── */}
      <footer id="contact" className="bg-dark text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Activity size={18} className="text-white" />
                </div>
                <span className="font-display font-bold text-xl">HealthSync</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                India's most trusted hospital management platform, delivering excellence in healthcare technology.
              </p>
              <div className="flex gap-3">
                {['NABH', 'ISO', 'HIPAA'].map(b => (
                  <span key={b} className="text-xs font-semibold bg-white/10 px-2.5 py-1 rounded-lg text-white/70">{b}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white/90">Services</h4>
              <ul className="space-y-2">
                {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Pathology'].map(s => (
                  <li key={s}><a href="#services" className="text-white/50 text-sm hover:text-white transition-colors">{s}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white/90">Platform</h4>
              <ul className="space-y-2">
                {['Patient Portal', 'Doctor Portal', 'Admin Console', 'Telemedicine', 'Medical Records'].map(p => (
                  <li key={p}><span className="text-white/50 text-sm hover:text-white cursor-pointer transition-colors">{p}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white/90">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-white/50 text-sm"><Phone size={14} /> 1800-HEALTH-SYNC</li>
                <li className="flex items-center gap-2 text-white/50 text-sm"><Mail size={14} /> care@healthsync.in</li>
                <li className="flex items-center gap-2 text-white/50 text-sm"><MapPin size={14} /> Bangalore, India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">© 2026 HealthSync. All rights reserved.</p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
                <button key={l} className="text-white/40 text-sm hover:text-white transition-colors">{l}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
