/**
 * Halaman 403 — Akses Dibatasi (Bahasa Indonesia)
 */

import { useNavigate } from 'react-router';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/auth';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Ikon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldOff size={44} className="text-destructive" />
          </div>
        </div>

        {/* Judul & Penjelasan */}
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-destructive">
            403 — Hak Akses Dibatasi
          </p>
          <h1 className="text-2xl font-bold text-foreground">Akses Tidak Diizinkan</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Akun Anda tidak memiliki izin untuk membuka modul operasional ini.
            {user && (
              <>
                {' '}
                Peran Anda saat ini adalah{' '}
                <span className="font-semibold text-foreground uppercase tracking-wider">{user.role}</span>.
              </>
            )}
          </p>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center text-xs">
          <button
            id="unauthorized-go-back"
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-surface text-foreground hover:bg-muted transition-colors font-semibold cursor-pointer"
          >
            <ArrowLeft size={15} />
            Kembali
          </button>
          <button
            id="unauthorized-go-home"
            type="button"
            onClick={() => navigate('/app/dashboard', { replace: true })}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold cursor-pointer"
          >
            Menuju ke Dasbor
          </button>
        </div>

        {user && (
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            Masuk sebagai <span className="font-medium text-foreground">{user.email}</span> ({user.organizationName})
          </p>
        )}
      </div>
    </div>
  );
}
