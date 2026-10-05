/**
 * Halaman Masuk (Login) — SIRAGU Trace (Bahasa Indonesia).
 *
 * Kredensial akun demo ditampilkan di layar untuk memudahkan pengujian.
 */

import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, LogIn, Eye, EyeOff, Leaf } from 'lucide-react';
import { useAuth } from '@/auth';

// ── Skema Validasi ────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
});
type LoginForm = z.infer<typeof loginSchema>;

// ── Daftar Akun Demo (Ditampilkan di layar) ───────────────────────────────────

const DEMO_CREDENTIALS = [
  { role: 'Pemilik (Owner)', email: 'owner@siragu.demo', desc: 'Akses penuh portal CRM & laporan efisiensi', org: 'Koperasi Nira Lestari' },
  { role: 'Operator Pabrik', email: 'operator@siragu.demo', desc: 'Penerimaan bahan, oven, pengemasan, & logistik', org: 'Koperasi Nira Lestari' },
] as const;

// ── Komponen Utama ────────────────────────────────────────────────────────────

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/app/dashboard';

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal masuk akun.');
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'demo1234');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Panel Kiri (Branding & Identitas Industri) ── */}
      <div className="hidden lg:flex flex-col w-[45%] bg-gradient-to-br from-[#003d7a] to-[#0075DE] p-12 text-white justify-between relative overflow-hidden">
        {/* Dekorasi Visual */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-white/10"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full border border-white/10"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Leaf size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">SIRAGU Trace</span>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wide uppercase">
            Rantai Pasok Gula Semut Terverifikasi
          </div>
          <h2 className="text-4xl font-bold leading-tight">
            Transparansi Dari<br />Penderes Nira<br />Hingga Ke Konsumen.
          </h2>
          <p className="text-white/80 text-base max-w-sm leading-relaxed">
            Pantau setiap tetes nira, verifikasi rendemen kristalisasi secara otomatis, dan berikan kepastian sertifikat mutu bagi mitra pembeli.
          </p>
        </div>

        <div className="relative z-10 text-white/50 text-sm">
          &copy; {new Date().getFullYear()} SIRAGU Trace · Standar Ketertelusuran B2B
        </div>
      </div>

      {/* ── Panel Kanan (Formulir Masuk) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          {/* Logo (khusus tampilan mobile) */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Leaf size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-primary">SIRAGU Trace</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground">Masuk Akun</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Masuk ke dasbor sistem ketertelusuran koperasi dan pabrik Anda.
            </p>
          </div>

          {/* ── Formulir ── */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-sm font-medium text-foreground">
                Alamat Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="nama@siragu.demo"
                {...register('email')}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow text-sm"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-sm font-medium text-foreground">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full px-4 py-2.5 pr-11 rounded-lg border border-border bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow text-sm"
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Pesan Kesalahan Server */}
            {serverError && (
              <div
                role="alert"
                className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive"
              >
                {serverError}
              </div>
            )}

            {/* Tombol Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {isSubmitting ? 'Memproses Masuk…' : 'Masuk ke Aplikasi'}
            </button>
          </form>

          {/* ── Akun Demo Cepat (Quick Fill) ── */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Pilih Akun Demo Cepat (Kata Sandi: demo1234)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map((c) => (
                <button
                  key={c.email}
                  id={`demo-login-${c.role.toLowerCase().replace(/\s+/g, '-')}`}
                  type="button"
                  onClick={() => fillDemo(c.email)}
                  className="group text-left p-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <span className="block text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {c.role}
                  </span>
                  <span className="block text-[11px] text-muted-foreground truncate">
                    {c.email}
                  </span>
                  <span className="block text-[10px] text-muted-foreground/75 truncate mt-0.5">
                    {c.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Mode Demo Interaktif ·{' '}
            <Link to="/" className="text-primary hover:underline font-medium">
              Kembali ke Beranda
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
