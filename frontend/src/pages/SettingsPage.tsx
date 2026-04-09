import React from 'react';
import MainLayout from '@/components/layout/MainLayout';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-2">Configure your preferences and account settings</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-400 text-lg">Settings coming soon</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
