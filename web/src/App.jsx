import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import GatewayProvidersView from './components/GatewayProvidersView';
import QuotaTrackerView from './components/QuotaTrackerView';
import CombosView from './components/CombosView';
import TaskExecutionView from './components/TaskExecutionView';
import UsageView from './components/UsageView';
import SettingsView from './components/SettingsView';
import DonateView from './components/DonateView';
import ErrorBoundary from './components/ErrorBoundary';

const VALID_TABS = ['provider', 'gateway', 'quotas', 'combos', 'tasks', 'usage', 'settings', 'donate'];

function getTabFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  const root = raw.split('/')[0].split('?')[0];
  if (root === 'gateway') return 'provider';
  return VALID_TABS.includes(root) ? root : 'provider';
}

export default function App() {
  const [currentTab, setCurrentTab] = useState(getTabFromHash);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // Restore user-selected theme on app startup or URL query ?theme=light/dark
    const searchParams = new URLSearchParams(window.location.search);
    const themeParam = searchParams.get('theme');
    const savedTheme = themeParam || localStorage.getItem('ai_router_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    fetchStatus();

    const handleHashChange = () => {
      const tab = getTabFromHash();
      setCurrentTab(tab);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    window.location.hash = `#${tabId}`;
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ErrorBoundary onNavigateHome={() => handleSelectTab('provider')}>
      <div className="app-container">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={handleSelectTab}
          status={status}
        />

        <main className="main-content">
          <ErrorBoundary key={currentTab} onNavigateHome={() => handleSelectTab('provider')}>
            {(currentTab === 'provider' || currentTab === 'gateway') && (
              <GatewayProvidersView
                status={status}
                onStatusChange={fetchStatus}
              />
            )}

            {currentTab === 'quotas' && (
              <QuotaTrackerView />
            )}

            {currentTab === 'combos' && (
              <CombosView />
            )}

            {currentTab === 'tasks' && (
              <TaskExecutionView />
            )}

            {currentTab === 'usage' && (
              <UsageView />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                status={status}
                onStatusChange={fetchStatus}
              />
            )}

            {currentTab === 'donate' && (
              <DonateView />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  );
}
