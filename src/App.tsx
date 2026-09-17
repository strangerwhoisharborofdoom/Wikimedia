/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavigationTab } from './components/Sidebar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ArticleExplorerPage } from './pages/ArticleExplorerPage.js';
import { FactComparisonPage } from './pages/FactComparisonPage.js';
import { ReviewQueuePage } from './pages/ReviewQueuePage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { DatasetImportModal } from './components/DatasetImportModal.js';
import { MobileBottomNav } from './components/MobileBottomNav.js';
import { OfflineIndicator } from './components/OfflineIndicator.js';
import { PWAInstallButton } from './components/PWAInstallButton.js';
import { DashboardStats, HumanReviewDecision } from './types/index.js';
import { apiClient } from './services/apiClient.js';
import { Menu, X, Smartphone, Monitor } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>('874312');
  const [selectedFactId, setSelectedFactId] = useState<string | null>('fact-874312-2');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load stats from API or resilient fallback
  const refreshStats = useCallback(async () => {
    try {
      const data = await apiClient.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Handle saving human review
  const handleSaveReview = async (
    factId: string,
    decision: HumanReviewDecision,
    notes: string
  ): Promise<void> => {
    try {
      await apiClient.submitReview(factId, decision, notes);
      // Refresh global stats after saving
      await refreshStats();
    } catch (err) {
      console.error('Save review error:', err);
      throw err;
    }
  };

  const handleSelectArticle = (articleId: string) => {
    setSelectedArticleId(articleId);
    setSelectedFactId(null);
    setCurrentTab('explorer');
  };

  const handleSelectFactForComparison = (articleId: string, factId: string) => {
    setSelectedArticleId(articleId);
    setSelectedFactId(factId);
    setCurrentTab('comparison');
  };

  const handleGenerateReport = (articleId: string) => {
    setSelectedArticleId(articleId);
    setCurrentTab('reports');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stone-100 font-sans text-stone-900 antialiased">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar (Desktop fixed / Mobile drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setMobileMenuOpen(false);
          }}
          onOpenImport={() => {
            setIsImportModalOpen(true);
            setMobileMenuOpen(false);
          }}
          onCloseMobile={() => setMobileMenuOpen(false)}
          datasetCount={stats?.articlesAnalyzed || 10}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header (Phone & Tablet) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-stone-900 text-white border-b border-stone-800 shrink-0 z-30">
          <div className="flex items-center gap-2.5 font-serif font-bold text-sm">
            <span className="w-7 h-7 rounded-lg bg-stone-100 text-stone-900 flex items-center justify-center text-xs font-black shadow-xs">
              W
            </span>
            <div className="flex flex-col">
              <span className="leading-tight text-stone-100">WikiFact Lens</span>
              <span className="text-[10px] text-stone-400 font-sans font-normal">All Devices • PWA Ready</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PWAInstallButton variant="header" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Desktop Top Utility Bar (Laptop & Desktop) */}
        <header className="hidden lg:flex items-center justify-between px-6 py-2.5 bg-white border-b border-stone-200 text-xs shrink-0 z-20">
          <div className="flex items-center gap-3 text-stone-600">
            <span className="font-semibold text-stone-900 font-mono tracking-tight uppercase text-[11px]">
              System Status:
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Engine Online (5-Layer Hybrid Pipeline)
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-stone-500 hidden xl:inline">
              Responsive Multi-Device Layout (Desktop, Laptop, Tablet, Phone)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <PWAInstallButton variant="header" />
            <div className="text-[11px] text-stone-400 font-mono">
              Dataset: WM-Enterprise 2024.1
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto bg-stone-50/50 pb-24 lg:pb-8">
          {currentTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              loading={statsLoading}
              onSelectArticle={handleSelectArticle}
              onSelectFact={handleSelectFactForComparison}
              onNavigateToTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'explorer' && (
            <ArticleExplorerPage
              selectedArticleId={selectedArticleId}
              onSelectArticle={(id) => {
                setSelectedArticleId(id);
                setSelectedFactId(null);
              }}
              onSelectFactForComparison={handleSelectFactForComparison}
              onGenerateReport={handleGenerateReport}
            />
          )}

          {currentTab === 'comparison' && (
            <FactComparisonPage
              articleId={selectedArticleId}
              factId={selectedFactId}
              onBackToExplorer={() => setCurrentTab('explorer')}
              onSaveReview={handleSaveReview}
            />
          )}

          {currentTab === 'queue' && (
            <ReviewQueuePage
              onSelectFactForComparison={handleSelectFactForComparison}
              onSaveReview={handleSaveReview}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsPage
              articleId={selectedArticleId}
              onSelectArticle={(id) => setSelectedArticleId(id)}
            />
          )}

          {currentTab === 'about' && <AboutPage />}
        </main>

        {/* Mobile Bottom Navigation Bar (Phones & Small Tablets) */}
        <MobileBottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onOpenMenu={() => setMobileMenuOpen(true)}
          reviewCount={stats?.humanReviewsPending || 0}
        />

        {/* Offline Status Toast */}
        <OfflineIndicator />
      </div>

      {/* Dataset Ingestion Modal */}
      <DatasetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          refreshStats();
        }}
      />
    </div>
  );
}
