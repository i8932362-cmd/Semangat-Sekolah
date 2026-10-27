import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Plus,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Key,
  Power,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Mail,
  FolderPlus,
  ExternalLink,
  Edit,
  Database,
  Building,
  Server,
  Sparkles,
} from 'lucide-react';
import { api, setSuperToken, getSuperToken, clearSuperToken } from '../../services/api';
import { googleSignIn, getAccessToken } from '../../services/googleAuth';

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchoolAdded?: () => void;
}

export const SuperAdminModal: React.FC<SuperAdminModalProps> = ({ isOpen, onClose, onSchoolAdded }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [superEmail, setSuperEmail] = useState('presensiapp138@gmail.com');
  const [superPassword, setSuperPassword] = useState('');
  const [showSuperLoginPassword, setShowSuperLoginPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Form Tambah Sekolah
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [npsn, setNpsn] = useState('');
  const [password, setPassword] = useState('');
  const [showSchoolPassword, setShowSchoolPassword] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [driveFolderId, setDriveFolderId] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [formMsg, setFormMsg] = useState({ text: '', isError: false });

  // Form Edit Sekolah
  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNpsn, setEditNpsn] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDriveFolderId, setEditDriveFolderId] = useState('');
  const [editSpreadsheetId, setEditSpreadsheetId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editMsg, setEditMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Reset Password Sekolah State
  const [resetTenantId, setResetTenantId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Ubah Sandi Superadmin Sendiri
  const [showChangeSuperPassword, setShowChangeSuperPassword] = useState(false);
  const [currSuperPass, setCurrSuperPass] = useState('');
  const [newSuperPass, setNewSuperPass] = useState('');
  const [confirmNewSuperPass, setConfirmNewSuperPass] = useState('');
  const [newSuperEmail, setNewSuperEmail] = useState('');
  const [changeSuperPassMsg, setChangeSuperPassMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [showSuperPassText, setShowSuperPassText] = useState(false);

  // Konfirmasi Hapus Sekolah
  const [deleteConfirmTenant, setDeleteConfirmTenant] = useState<any | null>(null);

  // Loading state pembuatan database otomatis
  const [creatingDbTenantId, setCreatingDbTenantId] = useState<string | null>(null);

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
    if (!superEmail.trim()) {
      setAuthError('Email Superadmin wajib diisi.');
      return;
    }
    if (!superPassword.trim()) {
      setAuthError('Kata sandi Superadmin wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.loginSuperadmin(superPassword, superEmail.trim());
      if (res.success && res.token) {
        setSuperToken(res.token);
        setIsAuthenticated(true);
        await loadTenants(res.token);
      } else {
        setAuthError(res.error || 'Autentikasi gagal. Periksa kembali email dan sandi.');
      }
    } catch (e: any) {
      setAuthError(e.message || 'Sandi atau Email Superadmin tidak valid.');
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
      setAuthError('Sesi Superadmin kedaluwarsa atau belum masuk. Silakan masukkan email & kata sandi kembali.');
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
      setFormMsg({ text: 'Nama sekolah, kode sekolah, dan sandi wajib diisi.', isError: true });
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.createTenant({
        name,
        code,
        email: schoolEmail,
        npsn,
        password,
        address,
        phone,
        driveFolderId,
        spreadsheetId,
      });
      if (res.success) {
        setFormMsg({ text: 'Sekolah baru berhasil didaftarkan.', isError: false });
        setName('');
        setCode('');
        setSchoolEmail('');
        setNpsn('');
        setPassword('');
        setAddress('');
        setPhone('');
        setDriveFolderId('');
        setSpreadsheetId('');
        setShowAddForm(false);
        setActionFeedback({
          text: `Sekolah "${res.tenant?.name || name}" berhasil didaftarkan ke sistem multi-tenant.`,
          isError: false,
        });
        loadTenants();
        if (onSchoolAdded) onSchoolAdded();
      }
    } catch (e: any) {
      setFormMsg({ text: e.message || 'Gagal mendaftarkan sekolah.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEditTenant = (t: any) => {
    setEditingTenant(t);
    setEditName(t.name || '');
    setEditCode(t.code || '');
    setEditEmail(t.email || t.databaseEmail || '');
    setEditNpsn(t.npsn || '');
    setEditAddress(t.address || '');
    setEditPhone(t.phone || '');
    setEditDriveFolderId(t.driveFolderId || '');
    setEditSpreadsheetId(t.spreadsheetId || '');
    setEditPassword('');
    setEditMsg(null);
  };

  const handleSaveEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setIsLoading(true);
    setEditMsg(null);
    try {
      const res = await api.updateTenant(editingTenant.id, {
        name: editName,
        code: editCode,
        email: editEmail,
        npsn: editNpsn,
        address: editAddress,
        phone: editPhone,
        driveFolderId: editDriveFolderId,
        spreadsheetId: editSpreadsheetId,
        newPassword: editPassword.trim() ? editPassword.trim() : undefined,
      });

      if (res.success) {
        setActionFeedback({
          text: `Data sekolah "${editName}" berhasil diperbarui.`,
          isError: false,
        });
        setEditingTenant(null);
        await loadTenants();
        if (onSchoolAdded) onSchoolAdded();
      } else {
        setEditMsg({ text: res.error || 'Gagal memperbarui sekolah.', isError: true });
      }
    } catch (err: any) {
      setEditMsg({ text: err.message || 'Gagal memperbarui sekolah.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoCreateDatabase = async (tenant: any) => {
    setCreatingDbTenantId(tenant.id);
    setActionFeedback(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        // Tawarkan login Google OAuth jika belum ada token aktif
        try {
          const authRes = await googleSignIn();
          if (authRes?.accessToken) {
            token = authRes.accessToken;
          }
        } catch (oauthErr) {
          console.warn('OAuth prompt dismissed, proceeding with managed database generation:', oauthErr);
        }
      }

      const res = await api.autoCreateGoogleDatabase(tenant.id, token || '');
      if (res.success) {
        setActionFeedback({
          text: `Database Google Drive & Sheet untuk "${tenant.name}" berhasil dibuat dan dihubungkan!`,
          isError: false,
        });
        await loadTenants();
        if (onSchoolAdded) onSchoolAdded();
      } else {
        setActionFeedback({
          text: res.error || 'Gagal membuat database Google otomatis.',
          isError: true,
        });
      }
    } catch (err: any) {
      setActionFeedback({
        text: err.message || 'Gagal membuat database Google otomatis.',
        isError: true,
      });
    } finally {
      setCreatingDbTenantId(null);
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
      const res = await api.changeSuperadminPassword(currSuperPass, newSuperPass, newSuperEmail.trim() || undefined);
      if (res.success) {
        setChangeSuperPassMsg({ text: 'Akun & Sandi Superadmin berhasil diperbarui. Sandi lama tidak lagi berlaku.', isError: false });
        setCurrSuperPass('');
        setNewSuperPass('');
        setConfirmNewSuperPass('');
        if (newSuperEmail.trim()) {
          setSuperEmail(newSuperEmail.trim());
          setNewSuperEmail('');
        }
        setTimeout(() => setShowChangeSuperPassword(false), 2500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Panel Kontrol Superadmin</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  Multi-Tenant Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pendaftaran & Pengelolaan Database Sekolah Terintegrasi Google Drive & Sheet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleSuperLogout}
                className="px-2.5 py-1 text-xs text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition font-medium cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
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
                <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-3 border border-indigo-100">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Masuk Otoritas Superadmin</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Masukkan email terdaftar dan kata sandi untuk mengelola seluruh tenant sekolah.
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Email terdaftar: <strong>presensiapp138@gmail.com</strong></span>
                </div>
              </div>

              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium">{authError}</span>
                </div>
              )}

              <form onSubmit={handleSuperLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Terdaftar Superadmin
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={superEmail}
                      onChange={(e) => setSuperEmail(e.target.value)}
                      placeholder="presensiapp138@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Kata Sandi Superadmin
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSuperLoginPassword(!showSuperLoginPassword)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer transition"
                    >
                      {showSuperLoginPassword ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Sembunyikan</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tampilkan</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showSuperLoginPassword ? 'text' : 'password'}
                      value={superPassword}
                      onChange={(e) => setSuperPassword(e.target.value)}
                      placeholder="Masukkan sandi superadmin..."
                      className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSuperLoginPassword(!showSuperLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer transition"
                    >
                      {showSuperLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Sandi default awal: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono font-bold">superadmin123</code> (tidak berlaku jika sudah diubah)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
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
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">Database Sekolah Terdaftar ({tenants.length})</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Multi-Tenant Terisolasi
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Superadmin: <strong className="text-slate-800">{superEmail}</strong> • Peraturan tiap sekolah terisolasi dan tidak saling menimpa.
                  </p>
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
                      setEditingTenant(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                      showChangeSuperPassword
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ubah Sandi / Akun</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(!showAddForm);
                      setShowChangeSuperPassword(false);
                      setEditingTenant(null);
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
                <div
                  className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
                    actionFeedback.isError
                      ? 'bg-rose-50 text-rose-800 border border-rose-300 font-medium'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {actionFeedback.isError ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    )}
                    <span>{actionFeedback.text}</span>
                  </div>
                  <button onClick={() => setActionFeedback(null)} className="text-slate-500 hover:text-slate-800 p-0.5 cursor-pointer">
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
                      Ubah Kata Sandi & Email Superadmin
                    </h5>
                    <button onClick={() => setShowChangeSuperPassword(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {changeSuperPassMsg && (
                    <div
                      className={`mb-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                        changeSuperPassMsg.isError
                          ? 'bg-rose-50 text-rose-800 border border-rose-300 font-medium'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium'
                      }`}
                    >
                      {changeSuperPassMsg.isError ? (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      ) : (
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      )}
                      <span>{changeSuperPassMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangeSuperPassword} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Email Superadmin Baru (Opsional)</label>
                      <input
                        type="email"
                        value={newSuperEmail}
                        onChange={(e) => setNewSuperEmail(e.target.value)}
                        placeholder={superEmail}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
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
                    <div className="sm:col-span-2 flex items-center justify-between pt-1">
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
                          {isLoading ? 'Menyimpan...' : 'Simpan Pembaruan'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Form Tambah Sekolah Baru */}
              {showAddForm && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-600" />
                      Formulir Registrasi Sekolah Baru & Database Terhubung
                    </h5>
                    <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {formMsg.text && (
                    <div
                      className={`mb-4 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                        formMsg.isError
                          ? 'bg-rose-50 text-rose-800 border border-rose-300 font-medium'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium'
                      }`}
                    >
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
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 uppercase font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Email Resmi Sekolah / Admin (Database Google) *
                      </label>
                      <input
                        type="email"
                        value={schoolEmail}
                        onChange={(e) => setSchoolEmail(e.target.value)}
                        placeholder="Contoh: admin.smpn3@gmail.com"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        required
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Email ini digunakan untuk menghubungkan & membuat Google Drive / Google Sheets.
                      </span>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">NPSN Sekolah</label>
                      <input
                        type="text"
                        value={npsn}
                        onChange={(e) => setNpsn(e.target.value)}
                        placeholder="Contoh: 20108877"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-bold">Sandi Sekolah Awal *</label>
                        <button
                          type="button"
                          onClick={() => setShowSchoolPassword(!showSchoolPassword)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                        >
                          {showSchoolPassword ? 'Sembunyikan' : 'Tampilkan'}
                        </button>
                      </div>
                      <input
                        type={showSchoolPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sandi login portal sekolah..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">No. Kontak / Telepon</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="021-1234567"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-bold mb-1">Alamat Sekolah</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Jl. Raya Pendidikan No. 12..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>

                    <div className="sm:col-span-2 p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-800">Konfigurasi Database Google (Opsional / Bisa Dibuat Otomatis)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-slate-600 mb-1">ID Google Drive Folder</label>
                          <input
                            type="text"
                            value={driveFolderId}
                            onChange={(e) => setDriveFolderId(e.target.value)}
                            placeholder="Contoh: 1AbCdEfGhIjKlMnOpQrStUv..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">ID Google Spreadsheet</label>
                          <input
                            type="text"
                            value={spreadsheetId}
                            onChange={(e) => setSpreadsheetId(e.target.value)}
                            placeholder="Contoh: 1a2b3c4d5e6f7g8h9i0j-..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        💡 Jika dikosongkan, Anda dapat mengklik tombol "Buat Database Otomatis" setelah sekolah didaftarkan.
                      </p>
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
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isLoading ? 'Menyimpan...' : 'Daftarkan Sekolah'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Modal Edit Detail Sekolah In-place */}
              {editingTenant && (
                <div className="bg-slate-50 border border-indigo-200 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                      <Edit className="w-4 h-4 text-indigo-600" />
                      Edit Data Sekolah & Konfigurasi ({editingTenant.name})
                    </h5>
                    <button onClick={() => setEditingTenant(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {editMsg && (
                    <div
                      className={`mb-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                        editMsg.isError
                          ? 'bg-rose-50 text-rose-800 border border-rose-300 font-medium'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium'
                      }`}
                    >
                      {editMsg.isError ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      <span>{editMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveEditTenant} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Nama Sekolah</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Kode Sekolah</label>
                      <input
                        type="text"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono uppercase"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Email Resmi Sekolah / Database Google</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="admin.sekolah@gmail.com"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">NPSN</label>
                      <input
                        type="text"
                        value={editNpsn}
                        onChange={(e) => setEditNpsn(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Google Drive Folder ID</label>
                      <input
                        type="text"
                        value={editDriveFolderId}
                        onChange={(e) => setEditDriveFolderId(e.target.value)}
                        placeholder="ID Folder Google Drive"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Google Sheets ID</label>
                      <input
                        type="text"
                        value={editSpreadsheetId}
                        onChange={(e) => setEditSpreadsheetId(e.target.value)}
                        placeholder="ID Spreadsheet Google Sheets"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-bold mb-1">Sandi Baru Sekolah (Kosongkan jika tidak diubah)</label>
                      <input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Masukkan sandi baru jika ingin mereset..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingTenant(null)}
                        className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
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
                      <th className="py-2.5 px-3">Kode & Email Database</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Database Drive & Sheets</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{t.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal pl-5">{t.address || '-'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-indigo-700 font-semibold">
                            {t.code}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1 font-sans">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{t.email || t.databaseEmail || 'Belum didaftarkan'}</span>
                          </div>
                          <span className="block text-[10px] text-slate-400">NPSN: {t.npsn || '-'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              t.isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            {t.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          {t.spreadsheetId ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-mono text-[10px] truncate max-w-[140px]">{t.spreadsheetId}</span>
                                <a
                                  href={`https://docs.google.com/spreadsheets/d/${t.spreadsheetId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 p-0.5 rounded"
                                  title="Buka Google Sheets"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              {t.driveFolderId && (
                                <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                                  Folder: {t.driveFolderId}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAutoCreateDatabase(t)}
                              disabled={creatingDbTenantId === t.id}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                              title="Buat folder Google Drive dan Google Sheet otomatis"
                            >
                              <FolderPlus className={`w-3.5 h-3.5 ${creatingDbTenantId === t.id ? 'animate-spin text-amber-700' : 'text-amber-700'}`} />
                              <span>{creatingDbTenantId === t.id ? 'Membuat...' : 'Buat Database Otomatis'}</span>
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          <button
                            onClick={() => handleStartEditTenant(t)}
                            className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Data Sekolah & Konfigurasi"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(t.id, t.isActive)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              t.isActive ? 'border-amber-300 text-amber-800 hover:bg-amber-50' : 'border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                            }`}
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
                    Reset Sandi Sekolah ({tenants.find((t) => t.id === resetTenantId)?.name})
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
                      <h5 className="font-bold text-rose-900 text-sm mb-1">Konfirmasi Hapus Sekolah Permanen</h5>
                      <p className="text-rose-800 leading-relaxed">
                        Apakah Anda yakin ingin menghapus sekolah <strong className="font-bold text-slate-950 underline">"{deleteConfirmTenant.name}"</strong> (Kode: {deleteConfirmTenant.code})?
                      </p>
                      <p className="text-rose-700 font-semibold mt-1">
                        ⚠️ Seluruh data siswa, kelas, rekapitulasi presensi, izin kamar mandi, dan konfigurasi database sekolah ini akan dihapus secara permanen dari server.
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
