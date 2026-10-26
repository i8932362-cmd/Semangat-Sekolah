import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Plus, CheckCircle, AlertCircle, RefreshCw, Key, Power, Trash2, Lock, Eye, EyeOff } from 'lucide-react';
import { api, setSuperToken, getSuperToken, clearSuperToken } from '../../services/api';

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchoolAdded?: () => void;
}

export const SuperAdminModal: React.FC<SuperAdminModalProps> = ({ isOpen, onClose, onSchoolAdded }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [superPassword, setSuperPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Form Tambah Sekolah
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [npsn, setNpsn] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [formMsg, setFormMsg] = useState({ text: '', isError: false });

  // Reset Password Sekolah State
  const [resetTenantId, setResetTenantId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Ubah Sandi Superadmin Sendiri
  const [showChangeSuperPassword, setShowChangeSuperPassword] = useState(false);
  const [currSuperPass, setCurrSuperPass] = useState('');
  const [newSuperPass, setNewSuperPass] = useState('');
  const [confirmNewSuperPass, setConfirmNewSuperPass] = useState('');
  const [changeSuperPassMsg, setChangeSuperPassMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [showSuperPassText, setShowSuperPassText] = useState(false);

  // Konfirmasi Hapus Sekolah
  const [deleteConfirmTenant, setDeleteConfirmTenant] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      const token = getSuperToken();
      if (token) {
        setIsAuthenticated(true);
        loadTenants(token);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSuperLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    try {
      const res = await api.loginSuperadmin(superPassword);
      if (res.success && res.token) {
        setSuperToken(res.token);
        setIsAuthenticated(true);
        await loadTenants(res.token);
      } else {
        setAuthError(res.error || 'Sandi salah.');
      }
    } catch (e: any) {
      setAuthError(e.message || 'Sandi Superadmin tidak valid.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTenants = async (tokenOverride?: string) => {
    setIsLoading(true);
    try {
      const res = await api.getSuperadminTenants(tokenOverride);
      if (res.success) {
        setTenants(res.tenants || []);
      }
    } catch (e: any) {
      console.warn('Error load tenants, resetting super session:', e);
      setIsAuthenticated(false);
      clearSuperToken();
      setAuthError('Sesi Superadmin kedaluwarsa atau belum masuk. Silakan masukkan kata sandi kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuperLogout = () => {
    clearSuperToken();
    setIsAuthenticated(false);
    setTenants([]);
    setSuperPassword('');
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !password) {
      setFormMsg({ text: 'Nama, kode, dan sandi wajib diisi.', isError: true });
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.createTenant({ name, code, npsn, password, address });
      if (res.success) {
        setFormMsg({ text: 'Sekolah baru berhasil didaftarkan.', isError: false });
        setName('');
        setCode('');
        setNpsn('');
        setPassword('');
        setAddress('');
        setShowAddForm(false);
        loadTenants();
        if (onSchoolAdded) onSchoolAdded();
      }
    } catch (e: any) {
      setFormMsg({ text: e.message || 'Gagal mendaftarkan sekolah.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      await api.updateTenantStatus(tenantId, !currentStatus);
      setActionFeedback({
        text: `Status sekolah berhasil diubah menjadi ${!currentStatus ? 'Aktif' : 'Nonaktif'}.`,
        isError: false,
      });
      loadTenants();
    } catch (e: any) {
      setActionFeedback({
        text: e.message || 'Gagal mengubah status sekolah.',
        isError: true,
      });
    }
  };

  const handleResetPassword = async (tenantId: string) => {
    if (!newPassword.trim()) {
      setActionFeedback({ text: 'Masukkan kata sandi baru untuk sekolah.', isError: true });
      return;
    }
    try {
      await api.updateTenantStatus(tenantId, undefined, newPassword);
      setActionFeedback({ text: 'Sandi sekolah berhasil diperbarui.', isError: false });
      setResetTenantId(null);
      setNewPassword('');
    } catch (e: any) {
      setActionFeedback({ text: e.message || 'Gagal mereset sandi sekolah.', isError: true });
    }
  };

  const handleChangeSuperPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeSuperPassMsg(null);
    if (!currSuperPass || !newSuperPass) {
      setChangeSuperPassMsg({ text: 'Sandi saat ini dan sandi baru wajib diisi.', isError: true });
      return;
    }
    if (newSuperPass !== confirmNewSuperPass) {
      setChangeSuperPassMsg({ text: 'Konfirmasi sandi baru tidak sesuai.', isError: true });
      return;
    }
    if (newSuperPass.length < 6) {
      setChangeSuperPassMsg({ text: 'Sandi baru minimal 6 karakter.', isError: true });
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.changeSuperadminPassword(currSuperPass, newSuperPass);
      if (res.success) {
        setChangeSuperPassMsg({ text: 'Sandi Superadmin berhasil diperbarui.', isError: false });
        setCurrSuperPass('');
        setNewSuperPass('');
        setConfirmNewSuperPass('');
        setTimeout(() => setShowChangeSuperPassword(false), 2000);
      } else {
        setChangeSuperPassMsg({ text: res.error || 'Gagal mengubah sandi superadmin.', isError: true });
      }
    } catch (err: any) {
      setChangeSuperPassMsg({ text: err.message || 'Gagal mengubah sandi superadmin.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    setIsLoading(true);
    try {
      const res = await api.deleteTenant(tenantId);
      if (res.success) {
        setActionFeedback({
          text: res.message || 'Sekolah berhasil dihapus dari sistem.',
          isError: false,
        });
        setDeleteConfirmTenant(null);
        await loadTenants();
        if (onSchoolAdded) onSchoolAdded();
      }
    } catch (err: any) {
      setActionFeedback({
        text: err.message || 'Gagal menghapus sekolah.',
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Superadmin Multi-Tenant</h3>
              <p className="text-xs text-slate-600">Pendaftaran & Pengelolaan Sekolah Global</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleSuperLogout}
                className="px-2.5 py-1 text-xs text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition font-medium cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Keluar Superadmin</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto py-6">
              <div className="text-center mb-6">
                <p className="text-sm font-medium text-slate-700">
                  Masukkan sandi otoritas Superadmin untuk mengelola tenant sekolah.
                </p>
                <p className="text-xs text-slate-500 mt-1">Sandi default: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono font-bold border border-slate-200">superadmin123</code></p>
              </div>

              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium">{authError}</span>
                </div>
              )}

              <form onSubmit={handleSuperLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Sandi Superadmin</label>
                  <input
                    type="password"
                    value={superPassword}
                    onChange={(e) => setSuperPassword(e.target.value)}
                    placeholder="Masukkan sandi superadmin..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition cursor-pointer shadow-xs"
                >
                  {isLoading ? 'Memverifikasi...' : 'Masuk Panel Superadmin'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Daftar Sekolah Terdaftar ({tenants.length})</h4>
                  <p className="text-xs text-slate-600">Kelola status aktif dan reset sandi tenant</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => loadTenants()}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
                    <span>Muat Ulang</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowChangeSuperPassword(!showChangeSuperPassword);
                      setShowAddForm(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                      showChangeSuperPassword
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ubah Sandi Superadmin</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(!showAddForm);
                      setShowChangeSuperPassword(false);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Daftarkan Sekolah Baru</span>
                  </button>
                </div>
              </div>

              {/* Feedback Notifikasi Aksi */}
              {actionFeedback && (
                <div className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${actionFeedback.isError ? 'bg-rose-50 text-rose-800 border border-rose-300 font-medium' : 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium'}`}>
                  <div className="flex items-center gap-2">
                    {actionFeedback.isError ? <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> : <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />}
                    <span>{actionFeedback.text}</span>
                  </div>
                  <button
                    onClick={() => setActionFeedback(null)}
                    className="text-slate-500 hover:text-slate-800 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Panel Ubah Sandi Superadmin */}
              {showChangeSuperPassword && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-600" />
                      Ubah Kata Sandi Superadmin
                    </h5>
                    <button
                      onClick={() => setShowChangeSuperPassword(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {changeSuperPassMsg && (
                    <div className={`mb-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${changeSuperPassMsg.isError ? 'bg-rose-50 text-rose-800 border border-rose-300 font-medium' : 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium'}`}>
                      {changeSuperPassMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> : <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />}
                      <span>{changeSuperPassMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangeSuperPassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Sandi Superadmin Saat Ini *</label>
                      <input
                        type={showSuperPassText ? 'text' : 'password'}
                        value={currSuperPass}
                        onChange={(e) => setCurrSuperPass(e.target.value)}
                        placeholder="Sandi saat ini..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Sandi Baru (Min. 6 Karakter) *</label>
                      <input
                        type={showSuperPassText ? 'text' : 'password'}
                        value={newSuperPass}
                        onChange={(e) => setNewSuperPass(e.target.value)}
                        placeholder="Sandi baru..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Konfirmasi Sandi Baru *</label>
                      <input
                        type={showSuperPassText ? 'text' : 'password'}
                        value={confirmNewSuperPass}
                        onChange={(e) => setConfirmNewSuperPass(e.target.value)}
                        placeholder="Ulangi sandi baru..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        required
                      />
                    </div>
                    <div className="sm:col-span-3 flex items-center justify-between pt-1">
                      <label className="inline-flex items-center gap-1.5 text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showSuperPassText}
                          onChange={(e) => setShowSuperPassText(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        <span>Tampilkan karakter sandi</span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowChangeSuperPassword(false)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {isLoading ? 'Menyimpan...' : 'Simpan Sandi Baru'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Form Tambah Sekolah Baru */}
              {showAddForm && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
                  <h5 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    Formulir Registrasi Sekolah Baru
                  </h5>

                  {formMsg.text && (
                    <div className={`mb-4 p-2.5 rounded-lg text-xs flex items-center gap-2 ${formMsg.isError ? 'bg-rose-50 text-rose-800 border border-rose-300 font-medium' : 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium'}`}>
                      {formMsg.isError ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      <span>{formMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateSchool} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Nama Lengkap Sekolah *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: SMP Negeri 3 Harapan"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Kode Sekolah (Unik) *</label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Contoh: SMPN3"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 uppercase"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">NPSN</label>
                      <input
                        type="text"
                        value={npsn}
                        onChange={(e) => setNpsn(e.target.value)}
                        placeholder="Contoh: 20108877"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Sandi Sekolah Awal *</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sandi login sekolah..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-bold mb-1">Alamat Sekolah</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Jl. Raya Pendidikan..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs"
                      >
                        {isLoading ? 'Menyimpan...' : 'Simpan Sekolah'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tabel Daftar Sekolah */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Sekolah</th>
                      <th className="py-2.5 px-3">Kode / NPSN</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Database G-Sheets</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {t.name}
                          <div className="text-[11px] text-slate-500 font-normal">{t.address || '-'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-indigo-700 font-semibold">{t.code}</span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">NPSN: {t.npsn || '-'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.isActive ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'}`}>
                            {t.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          {t.spreadsheetId ? (
                            <span className="text-emerald-700 font-mono font-semibold">ID: {t.spreadsheetId.slice(0, 10)}...</span>
                          ) : (
                            <span className="text-amber-800 font-medium">Belum diatur</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5">
                          <button
                            onClick={() => handleToggleStatus(t.id, t.isActive)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${t.isActive ? 'border-amber-300 text-amber-800 hover:bg-amber-50' : 'border-emerald-300 text-emerald-800 hover:bg-emerald-50'}`}
                            title={t.isActive ? 'Nonaktifkan Sekolah' : 'Aktifkan Sekolah'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setResetTenantId(t.id);
                              setNewPassword('');
                            }}
                            className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            title="Reset Sandi Sekolah"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmTenant(t)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Sekolah dari Sistem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reset Password Modal In-place */}
              {resetTenantId && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300">
                  <h5 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-700" />
                    Reset Sandi Sekolah ({tenants.find(t => t.id === resetTenantId)?.name})
                  </h5>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan sandi baru..."
                      className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      onClick={() => handleResetPassword(resetTenantId)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Perbarui Sandi
                    </button>
                    <button
                      onClick={() => setResetTenantId(null)}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Konfirmasi Hapus Sekolah */}
              {deleteConfirmTenant && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-300">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-xs">
                      <h5 className="font-bold text-rose-900 text-sm mb-1">
                        Konfirmasi Hapus Sekolah Permanen
                      </h5>
                      <p className="text-rose-800 leading-relaxed">
                        Apakah Anda yakin ingin menghapus sekolah <strong className="font-bold text-slate-950 underline">"{deleteConfirmTenant.name}"</strong> (Kode: {deleteConfirmTenant.code})?
                      </p>
                      <p className="text-rose-700 font-semibold mt-1">
                        ⚠️ Seluruh data siswa, kelas, rekapitulasi presensi, izin keluar, dan konfigurasi database sekolah ini akan dihapus secara permanen.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleDeleteTenant(deleteConfirmTenant.id)}
                          disabled={isLoading}
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer transition shadow-xs disabled:opacity-50"
                        >
                          {isLoading ? 'Menghapus...' : 'Ya, Hapus Sekolah Ini'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmTenant(null)}
                          className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-lg cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

