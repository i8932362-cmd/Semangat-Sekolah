/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api, clearSessionToken, getSessionToken } from './services/api';
import { TenantSchool, InternalUser } from './types';
import { LoginSekolah } from './components/auth/LoginSekolah';
import { SuperAdminModal } from './components/superadmin/SuperAdminModal';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { PresensiManual } from './components/presensi/PresensiManual';
import { PresensiBarcodeRFID } from './components/presensi/PresensiBarcodeRFID';
import { IzinKamarMandi } from './components/izinkamarmandi/IzinKamarMandi';
import { WaliKelasView } from './components/walikelas/WaliKelasView';
import { KesiswaanView } from './components/kesiswaan/KesiswaanView';
import { MasterData } from './components/admin/MasterData';
import { DatabaseSettings } from './components/admin/DatabaseSettings';
import { UserManagement } from './components/admin/UserManagement';
import { BackupRestore } from './components/admin/BackupRestore';
import { AuditLogView } from './components/admin/AuditLogView';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

export default function App() {
  const [tenant, setTenant] = useState<TenantSchool | null>(null);
  const [currentUser, setCurrentUser] = useState<InternalUser | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    const token = getSessionToken();
    if (!token) {
      setIsLoadingSession(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.tenant) {
        setTenant(res.tenant);
        setAvailableUsers(res.availableInternalUsers || []);
        if (res.user) {
          setCurrentUser(res.user);
        } else if (res.availableInternalUsers?.length > 0) {
          // Default ke admin
          setCurrentUser(res.availableInternalUsers[0]);
        }
      } else {
        clearSessionToken();
      }
    } catch (e) {
      console.warn('Session verification error:', e);
      clearSessionToken();
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleLoginSuccess = (loggedTenant: TenantSchool, user?: any, targetTab?: NavTab) => {
    setTenant(loggedTenant);
    if (user) {
      setCurrentUser(user);
    }
    if (targetTab) {
      setCurrentTab(targetTab);
    }
    checkActiveSession();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    setTenant(null);
    setCurrentUser(null);
    setCurrentTab('dashboard');
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-600">Memuat Lingkungan Presensi Sekolah...</span>
        </div>
      </div>
    );
  }

  // Tampilan Login Sekolah jika belum ada sesi
  if (!tenant) {
    return (
      <>
        <LoginSekolah
          onLoginSuccess={handleLoginSuccess}
          onOpenSuperAdmin={() => setShowSuperAdmin(true)}
        />
        <SuperAdminModal
          isOpen={showSuperAdmin}
          onClose={() => setShowSuperAdmin(false)}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar Atas */}
      <Navbar
        tenant={tenant}
        currentUser={currentUser}
        onUserChanged={(user) => setCurrentUser(user)}
        onLogout={handleLogout}
        availableUsers={availableUsers}
        onOpenDatabaseSettings={() => setCurrentTab('database_settings')}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Konten Utama dengan Sidebar */}
      <div className="flex flex-1 relative">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          userRole={currentUser?.role || 'admin'}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard tenant={tenant} onNavigateTab={(tab) => setCurrentTab(tab)} />
          )}
          {currentTab === 'presensi_manual' && <PresensiManual />}
          {currentTab === 'presensi_scan' && <PresensiBarcodeRFID />}
          {currentTab === 'izin_kamar_mandi' && <IzinKamarMandi />}
          {currentTab === 'wali_kelas' && <WaliKelasView currentUser={currentUser} />}
          {currentTab === 'kesiswaan' && <KesiswaanView />}
          {currentTab === 'master_data' && <MasterData />}
          {currentTab === 'database_settings' && (
            <DatabaseSettings tenant={tenant} onTenantUpdated={(updated) => setTenant(updated)} />
          )}
          {currentTab === 'user_management' && <UserManagement />}
          {currentTab === 'backup_restore' && <BackupRestore />}
          {currentTab === 'audit_log' && <AuditLogView />}
        </main>
      </div>

      <SuperAdminModal
        isOpen={showSuperAdmin}
        onClose={() => setShowSuperAdmin(false)}
      />

      <OfflineIndicator />
    </div>
  );
}
