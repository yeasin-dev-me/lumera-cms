"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import {
  BusinessProfile,
  BusinessProfileUpdatePayload,
  CurrencyConfig,
  FiscalYear,
  AccountingPeriod,
  NumberingSequence,
} from "@/types/business";
import { usePermissions } from "@/lib/auth/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Building2,
  Coins,
  Calendar,
  Clock,
  Hash,
  Save,
  Plus,
  Pencil,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

type ActiveTab = "profile" | "currencies" | "fiscal_years" | "periods" | "numbering";

export default function BusinessSettingsPage() {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  // Global State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile State
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [profileForm, setProfileForm] = useState<BusinessProfileUpdatePayload>({});
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Currencies State
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>([]);
  const [settingBase, setSettingBase] = useState<string | null>(null);

  // Fiscal Years & Periods State
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [creatingFy, setCreatingFy] = useState<boolean>(false);
  const [fyForm, setFyForm] = useState<{
    name: string;
    start_date: string;
    end_date: string;
    auto_generate_periods: boolean;
  }>({
    name: "",
    start_date: "2026-07-01",
    end_date: "2027-06-30",
    auto_generate_periods: true,
  });

  // Numbering Sequences State
  const [sequences, setSequences] = useState<NumberingSequence[]>([]);
  const [editingSequence, setEditingSequence] = useState<NumberingSequence | null>(null);
  const [seqForm, setSeqForm] = useState<{
    prefix: string;
    padding_length: number;
    reset_policy: "never" | "monthly" | "annual";
  }>({
    prefix: "",
    padding_length: 5,
    reset_policy: "monthly",
  });
  const [savingSeq, setSavingSeq] = useState<boolean>(false);

  // Load Initial Data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, currenciesRes, fyRes, seqRes] = await Promise.all([
        adminApi.getBusinessProfile(),
        adminApi.getCurrencies(),
        adminApi.getFiscalYears(),
        adminApi.getNumberingSequences(),
      ]);

      setProfile(profileRes);
      setProfileForm({
        company_name: profileRes.company_name,
        legal_name: profileRes.legal_name,
        tax_id: profileRes.tax_id,
        vat_bin: profileRes.vat_bin,
        email: profileRes.email,
        phone: profileRes.phone,
        website: profileRes.website,
        address_line1: profileRes.address_line1,
        address_line2: profileRes.address_line2,
        city: profileRes.city,
        postal_code: profileRes.postal_code,
        country: profileRes.country,
        timezone: profileRes.timezone,
      });

      const currList = Array.isArray(currenciesRes)
        ? currenciesRes
        : currenciesRes.results || [];
      setCurrencies(currList);

      const fyList = Array.isArray(fyRes) ? fyRes : fyRes.results || [];
      setFiscalYears(fyList);
      if (fyList.length > 0) {
        setSelectedFiscalYear(fyList[0].public_id);
      }

      const seqList = Array.isArray(seqRes) ? seqRes : seqRes.results || [];
      setSequences(seqList);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load business settings.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load Periods when selected fiscal year changes
  const loadPeriods = useCallback(async (fyPublicId: string) => {
    if (!fyPublicId) return;
    try {
      const periodsRes = await adminApi.getFiscalYearPeriods(fyPublicId);
      setPeriods(periodsRes);
    } catch {
      setPeriods([]);
    }
  }, []);

  useEffect(() => {
    if (selectedFiscalYear) {
      loadPeriods(selectedFiscalYear);
    }
  }, [selectedFiscalYear, loadPeriods]);

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await adminApi.updateBusinessProfile(profileForm);
      setProfile(updated);
      setSuccessMsg("Business profile updated successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to update business profile.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Set Base Currency
  const handleSetBaseCurrency = async (code: string, isApproved: boolean) => {
    setSettingBase(code);
    setError(null);
    setSuccessMsg(null);
    try {
      await adminApi.setBaseCurrency(code, isApproved);
      setSuccessMsg(`Base operating currency updated to ${code} (Approved: ${isApproved ? "Yes" : "Pending"}).`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadInitialData();
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to set base currency.");
      }
    } finally {
      setSettingBase(null);
    }
  };

  // Handle Create Fiscal Year
  const handleCreateFiscalYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      const newFy = await adminApi.createFiscalYear(fyForm);
      setSuccessMsg(`Fiscal year '${newFy.name}' created with 12 monthly periods.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setCreatingFy(false);
      await loadInitialData();
      setSelectedFiscalYear(newFy.public_id);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to create fiscal year.");
      }
    }
  };

  // Handle Update Sequence
  const handleSaveSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSequence) return;
    setSavingSeq(true);
    setError(null);
    try {
      await adminApi.updateNumberingSequence(editingSequence.doc_type, seqForm);
      setSuccessMsg(`Sequence for ${editingSequence.name} updated.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setEditingSequence(null);
      const seqRes = await adminApi.getNumberingSequences();
      setSequences(Array.isArray(seqRes) ? seqRes : seqRes.results || []);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to update sequence.");
      }
    } finally {
      setSavingSeq(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-lumera-primary" />
          <p className="text-sm text-lumera-text-muted">Loading business settings...</p>
        </div>
      </div>
    );
  }

  const isPermitted = hasPermission("business.manage");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-lumera-text">
              Business Foundation & Settings
            </h1>
            <Badge variant="success" className="text-xs font-semibold">
              Step 01 Active
            </Badge>
          </div>
          <p className="text-sm text-lumera-text-muted mt-1">
            Configure company identity, base operating currency, fiscal years, monthly accounting periods, and document sequences.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadInitialData}
          disabled={loading}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Global Alerts */}
      {error && <Alert variant="danger" title="Action Error">{error}</Alert>}
      {successMsg && <Alert variant="success" title="Success">{successMsg}</Alert>}

      {!isPermitted && (
        <Alert
          variant="warning"
          title="Permission Notice"
        >
          You are viewing settings in read-only mode. The &apos;business.manage&apos; permission is required to save changes.
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "profile"
              ? "border-lumera-primary text-lumera-primary font-semibold"
              : "border-transparent text-lumera-text-muted hover:text-lumera-text"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Business Profile
        </button>

        <button
          onClick={() => setActiveTab("currencies")}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "currencies"
              ? "border-lumera-primary text-lumera-primary font-semibold"
              : "border-transparent text-lumera-text-muted hover:text-lumera-text"
          }`}
        >
          <Coins className="h-4 w-4" />
          Currency Configuration
        </button>

        <button
          onClick={() => setActiveTab("fiscal_years")}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "fiscal_years"
              ? "border-lumera-primary text-lumera-primary font-semibold"
              : "border-transparent text-lumera-text-muted hover:text-lumera-text"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Fiscal Years
        </button>

        <button
          onClick={() => setActiveTab("periods")}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "periods"
              ? "border-lumera-primary text-lumera-primary font-semibold"
              : "border-transparent text-lumera-text-muted hover:text-lumera-text"
          }`}
        >
          <Clock className="h-4 w-4" />
          Accounting Periods
        </button>

        <button
          onClick={() => setActiveTab("numbering")}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "numbering"
              ? "border-lumera-primary text-lumera-primary font-semibold"
              : "border-transparent text-lumera-text-muted hover:text-lumera-text"
          }`}
        >
          <Hash className="h-4 w-4" />
          Document Numbering
        </button>
      </div>

      {/* TAB 1: Business Profile */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-base font-semibold text-lumera-text mb-4">
                Company Operational Profile
              </h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">
                      Trading / Display Name *
                    </label>
                    <input
                      type="text"
                      value={profileForm.company_name || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                      disabled={!isPermitted || savingProfile}
                      required
                      className="w-full px-3 py-2 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">
                      Registered Legal Entity Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.legal_name || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, legal_name: e.target.value })}
                      disabled={!isPermitted || savingProfile}
                      placeholder="e.g. Penguin Mart Ltd."
                      className="w-full px-3 py-2 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">
                      Taxpayer ID (TIN)
                    </label>
                    <input
                      type="text"
                      value={profileForm.tax_id || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, tax_id: e.target.value })}
                      disabled={!isPermitted || savingProfile}
                      placeholder="e.g. TIN-1234567890"
                      className="w-full px-3 py-2 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">
                      NBR VAT BIN Number
                    </label>
                    <input
                      type="text"
                      value={profileForm.vat_bin || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, vat_bin: e.target.value })}
                      disabled={!isPermitted || savingProfile}
                      placeholder="e.g. BIN-001234567-0101"
                      className="w-full px-3 py-2 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">
                      Official Contact Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      disabled={!isPermitted || savingProfile}
                      className="w-full px-3 py-2 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">
                      Official Contact Phone
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      disabled={!isPermitted || savingProfile}
                      className="w-full px-3 py-2 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={profileForm.website || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      disabled={!isPermitted || savingProfile}
                      placeholder="https://penguinmart.com.bd"
                      className="w-full px-3 py-2 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={profileForm.timezone || "Asia/Dhaka"}
                      onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                      disabled={!isPermitted || savingProfile}
                      className="w-full px-3 py-2 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-lumera-text-muted mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={profileForm.address_line1 || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, address_line1: e.target.value })}
                    disabled={!isPermitted || savingProfile}
                    placeholder="House, Road, Area"
                    className="w-full px-3 py-2 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary mb-2"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={profileForm.city || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      disabled={!isPermitted || savingProfile}
                      placeholder="City (e.g. Dhaka)"
                      className="px-3 py-2 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    />
                    <input
                      type="text"
                      value={profileForm.postal_code || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, postal_code: e.target.value })}
                      disabled={!isPermitted || savingProfile}
                      placeholder="Postal Code"
                      className="px-3 py-2 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    />
                    <input
                      type="text"
                      value={profileForm.country || "Bangladesh"}
                      onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                      disabled={!isPermitted || savingProfile}
                      placeholder="Country"
                      className="px-3 py-2 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    />
                  </div>
                </div>

                {isPermitted && (
                  <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={savingProfile} className="gap-2">
                      {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Profile Changes
                    </Button>
                  </div>
                )}
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-lumera-text mb-3">
                Operating Currency Status
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-lumera-text-muted block">Base Operating Currency</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-bold text-lumera-text">
                      {profile?.currency_code} ({profile?.currency_symbol})
                    </span>
                    <Badge variant={profile?.is_base_currency_approved ? "success" : "warning"} className="text-xs">
                      {profile?.is_base_currency_approved ? "Approved" : "Pending Sign-off"}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-surface-muted rounded-md text-xs text-lumera-text-muted space-y-1.5 border border-border">
                  <p className="font-medium text-lumera-text">Source of Truth Architecture:</p>
                  <p>
                    Currency metadata is stored canonically in <code className="text-lumera-primary">CurrencyConfig</code>. BusinessProfile derives currency dynamically to eliminate duplicate records.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-semibold text-lumera-text mb-2">
                Operational Guidance
              </h3>
              <p className="text-xs text-lumera-text-muted leading-relaxed">
                Updating contact information and tax identifiers automatically updates printed invoices, supplier purchase orders, and PDF reports.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Currency Configuration */}
      {activeTab === "currencies" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-lumera-text">Supported Currencies</h2>
              <p className="text-xs text-lumera-text-muted mt-0.5">
                Manage system currencies and designated base operating currency for the General Ledger.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currencies.map((curr) => (
              <Card key={curr.public_id} className={`p-5 relative ${curr.is_base ? "ring-2 ring-lumera-primary" : ""}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-lg font-bold text-lumera-text">{curr.code}</span>
                    <span className="text-xs text-lumera-text-muted ml-2">({curr.symbol})</span>
                  </div>
                  {curr.is_base ? (
                    <Badge variant="primary" className="text-[10px]">Active Base</Badge>
                  ) : (
                    <Badge variant="muted" className="text-[10px]">Secondary</Badge>
                  )}
                </div>

                <p className="text-sm text-lumera-text font-medium">{curr.name}</p>
                <p className="text-xs text-lumera-text-muted mt-1">
                  Decimals: {curr.decimal_places} | Format: {curr.display_format}
                </p>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-lumera-text-muted">
                    {curr.is_approved ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Owner Approved</span>
                      </>
                    ) : (
                      <>
                        <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                        <span>Approval Pending</span>
                      </>
                    )}
                  </div>

                  {isPermitted && !curr.is_base && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetBaseCurrency(curr.code, true)}
                      disabled={settingBase === curr.code}
                      className="text-xs h-7 px-2"
                    >
                      {settingBase === curr.code ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Set as Base"
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Fiscal Years */}
      {activeTab === "fiscal_years" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-lumera-text">Fiscal Years</h2>
              <p className="text-xs text-lumera-text-muted mt-0.5">
                Annual financial cycles. Each fiscal year contains 12 monthly accounting periods.
              </p>
            </div>
            {isPermitted && (
              <Button onClick={() => setCreatingFy(true)} className="gap-2" size="sm">
                <Plus className="h-4 w-4" />
                Add Fiscal Year
              </Button>
            )}
          </div>

          {/* Modal / Form to add Fiscal Year */}
          {creatingFy && (
            <Card className="p-5 border-lumera-primary">
              <h3 className="text-sm font-semibold text-lumera-text mb-3">New Fiscal Year Setup</h3>
              <form onSubmit={handleCreateFiscalYear} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">
                      Fiscal Year Name *
                    </label>
                    <input
                      type="text"
                      value={fyForm.name}
                      onChange={(e) => setFyForm({ ...fyForm, name: e.target.value })}
                      placeholder="e.g. FY 2026-2027"
                      required
                      className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-surface"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={fyForm.start_date}
                      onChange={(e) => setFyForm({ ...fyForm, start_date: e.target.value })}
                      required
                      className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-surface"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={fyForm.end_date}
                      onChange={(e) => setFyForm({ ...fyForm, end_date: e.target.value })}
                      required
                      className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-surface"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoPeriods"
                    checked={fyForm.auto_generate_periods}
                    onChange={(e) => setFyForm({ ...fyForm, auto_generate_periods: e.target.checked })}
                    className="rounded border-border text-lumera-primary focus:ring-lumera-primary h-4 w-4"
                  />
                  <label htmlFor="autoPeriods" className="text-xs text-lumera-text font-medium cursor-pointer">
                    Automatically generate 12 consecutive monthly Accounting Periods
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setCreatingFy(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Create Fiscal Year
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Fiscal Years List */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted text-lumera-text-muted uppercase border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Fiscal Year Name</th>
                    <th className="py-3 px-4 font-semibold">Start Date</th>
                    <th className="py-3 px-4 font-semibold">End Date</th>
                    <th className="py-3 px-4 font-semibold">Periods</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fiscalYears.map((fy) => (
                    <tr key={fy.public_id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-lumera-text">{fy.name}</td>
                      <td className="py-3 px-4 text-lumera-text-muted">{fy.start_date}</td>
                      <td className="py-3 px-4 text-lumera-text-muted">{fy.end_date}</td>
                      <td className="py-3 px-4">
                        <Badge variant="muted" className="text-[11px]">
                          {fy.periods_count} Periods
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {fy.is_closed ? (
                          <Badge variant="danger" className="text-[10px]">
                            Closed
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px]">
                            Open
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedFiscalYear(fy.public_id);
                            setActiveTab("periods");
                          }}
                          className="text-xs h-7"
                        >
                          View Periods
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {fiscalYears.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-lumera-text-muted">
                        No fiscal years configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: Accounting Periods */}
      {activeTab === "periods" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-lumera-text">Accounting Periods Calendar</h2>
              <p className="text-xs text-lumera-text-muted mt-0.5">
                Monthly financial intervals. Period locking will be governed in Step 08.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-lumera-text-muted whitespace-nowrap">Fiscal Year:</label>
              <select
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(e.target.value)}
                className="px-3 py-1.5 border border-border rounded-md text-xs bg-surface font-medium"
              >
                {fiscalYears.map((fy) => (
                  <option key={fy.public_id} value={fy.public_id}>
                    {fy.name} ({fy.start_date} to {fy.end_date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted text-lumera-text-muted uppercase border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold w-12">#</th>
                    <th className="py-3 px-4 font-semibold">Period Label</th>
                    <th className="py-3 px-4 font-semibold">Start Date</th>
                    <th className="py-3 px-4 font-semibold">End Date</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {periods.map((p) => (
                    <tr key={p.public_id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-lumera-text-muted">{p.period_number}</td>
                      <td className="py-3 px-4 font-medium text-lumera-text">{p.name}</td>
                      <td className="py-3 px-4 text-lumera-text-muted">{p.start_date}</td>
                      <td className="py-3 px-4 text-lumera-text-muted">{p.end_date}</td>
                      <td className="py-3 px-4">
                        {p.is_closed ? (
                          <Badge variant="danger" className="text-[10px]">
                            Closed
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px]">
                            Open
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {periods.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-lumera-text-muted">
                        No periods generated for the selected fiscal year.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: Document Numbering */}
      {activeTab === "numbering" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-lumera-text">Document Numbering Sequences</h2>
              <p className="text-xs text-lumera-text-muted mt-0.5">
                Concurrency-safe sequential number generators for future invoices, bills, and journal entries.
              </p>
            </div>
          </div>

          {editingSequence && (
            <Card className="p-5 border-lumera-primary">
              <h3 className="text-sm font-semibold text-lumera-text mb-3">
                Configure Sequence: {editingSequence.name}
              </h3>
              <form onSubmit={handleSaveSequence} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">Prefix *</label>
                    <input
                      type="text"
                      value={seqForm.prefix}
                      onChange={(e) => setSeqForm({ ...seqForm, prefix: e.target.value })}
                      required
                      className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-surface"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">Padding Length *</label>
                    <input
                      type="number"
                      min={3}
                      max={8}
                      value={seqForm.padding_length}
                      onChange={(e) => setSeqForm({ ...seqForm, padding_length: parseInt(e.target.value) || 5 })}
                      required
                      className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-surface"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-lumera-text-muted mb-1">Reset Policy</label>
                    <select
                      value={seqForm.reset_policy}
                      onChange={(e) =>
                        setSeqForm({
                          ...seqForm,
                          reset_policy: e.target.value as "never" | "monthly" | "annual",
                        })
                      }
                      className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-surface"
                    >
                      <option value="monthly">Monthly Reset (YYYYMM)</option>
                      <option value="annual">Annual Reset (YYYY)</option>
                      <option value="never">Never Reset</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setEditingSequence(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={savingSeq}>
                    {savingSeq ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted text-lumera-text-muted uppercase border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Document Module</th>
                    <th className="py-3 px-4 font-semibold">Prefix</th>
                    <th className="py-3 px-4 font-semibold">Reset Policy</th>
                    <th className="py-3 px-4 font-semibold">Last Used #</th>
                    <th className="py-3 px-4 font-semibold">Sample Next ID</th>
                    {isPermitted && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sequences.map((seq) => (
                    <tr key={seq.public_id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-lumera-text block">{seq.name}</span>
                        <span className="font-mono text-[10px] text-lumera-text-muted">{seq.doc_type}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-lumera-primary">{seq.prefix}</td>
                      <td className="py-3 px-4 capitalize text-lumera-text-muted">{seq.reset_policy}</td>
                      <td className="py-3 px-4 font-mono">{seq.current_number}</td>
                      <td className="py-3 px-4">
                        <code className="text-[11px] px-2 py-0.5 bg-surface-muted border border-border rounded">
                          {seq.next_preview_number}
                        </code>
                      </td>
                      {isPermitted && (
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingSequence(seq);
                              setSeqForm({
                                prefix: seq.prefix,
                                padding_length: seq.padding_length,
                                reset_policy: seq.reset_policy,
                              });
                            }}
                            className="text-xs h-7 px-2"
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
