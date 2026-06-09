"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useTransition, useRef, useEffect } from "react";
import { AtlasAiMark } from "@/components/atlas-ai-mark";
import {
  saveConnectorConfig,
  disconnectIntegration,
  toggleSkill,
} from "./actions";

// ─── Brand SVG icons ──────────────────────────────────────────────────────────

function IconSlack() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" /></svg>;
}
function IconTeams() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5"><rect x="7" y="5" width="15" height="12" rx="2" fill="#6264A7" /><circle cx="17.5" cy="5" r="2" fill="#7B83EB" /><rect x="2" y="7" width="12" height="10" rx="1.6" fill="#464EB8" /><path d="M5.2 9.3h5.6v1.4H8.7v4H7.3v-4H5.2V9.3z" fill="white" /></svg>;
}
function IconZoom() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M4.5 8.25A3.75 3.75 0 0 1 8.25 4.5h7.5A3.75 3.75 0 0 1 19.5 8.25v3.375l3-2.25A.75.75 0 0 1 24 10v4a.75.75 0 0 1-1.5.625L19.5 12.375V15.75A3.75 3.75 0 0 1 15.75 19.5h-7.5A3.75 3.75 0 0 1 4.5 15.75V8.25z" /></svg>;
}
function IconGoogleG() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
}
function IconLinkedIn() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>;
}
function IconOkta() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M12 0C5.389 0 0 5.389 0 12s5.389 12 12 12 12-5.389 12-12S18.611 0 12 0zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z" /></svg>;
}
function IconStripe() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.32 2.473-3.234 2.473-5.573-.001-4.265-2.57-5.931-6.539-7.464z" /></svg>;
}
function IconNotion() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933z" /></svg>;
}
function IconJira() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.214 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.005 1.005 0 0 0-1.021-1.005zM23.013 0H11.459a5.215 5.215 0 0 0 5.214 5.215h2.129v2.057A5.215 5.215 0 0 0 24.017 12.47V1.005A1.005 1.005 0 0 0 23.013 0z" /></svg>;
}
function IconChrome() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5"><circle cx="12" cy="12" r="3.5" fill="white"/><circle cx="12" cy="12" r="2.5" fill="#4285F4"/><path d="M12 8a4 4 0 0 1 3.46 2h5.04a10 10 0 0 0-8.5-4.75V8z" fill="#EA4335"/><path d="M8.54 10A4 4 0 0 0 8 12a4 4 0 0 0 4 4v2.75A10 10 0 0 1 3.5 10h5.04z" fill="#34A853"/><path d="M12 16a4 4 0 0 0 3.46-2l4.25 2.5A10 10 0 0 1 12 20.75V16z" fill="#FBBC04"/></svg>;
}
function IconApple() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>;
}
function IconAndroid() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M17.523 15.341a.902.902 0 0 1-.897.897.902.902 0 0 1-.897-.897V10.66a.902.902 0 0 1 .897-.897.902.902 0 0 1 .897.897v4.681zm-9.25 0a.902.902 0 0 1-.897.897.902.902 0 0 1-.897-.897V10.66a.902.902 0 0 1 .897-.897.902.902 0 0 1 .897.897v4.681zM14.683 5.2l.97-1.785a.204.204 0 0 0-.073-.277.2.2 0 0 0-.277.073l-.986 1.814a5.87 5.87 0 0 0-2.327-.473c-.829 0-1.62.167-2.327.473L8.677 3.211a.2.2 0 0 0-.277-.073.202.202 0 0 0-.073.277L9.297 5.2a5.727 5.727 0 0 0-3.246 5.043H17.93A5.727 5.727 0 0 0 14.683 5.2zM5.865 10.66v7.19a1.44 1.44 0 0 0 1.44 1.44h9.39a1.44 1.44 0 0 0 1.44-1.44V10.66H5.865z" /></svg>;
}
function IconAzure() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M22.379 23.343a1.62 1.62 0 0 0 1.536-2.14L13.095 1.62A1.62 1.62 0 0 0 11.56.657H8.921a1.62 1.62 0 0 0-1.536 1.098L.086 21.204a1.62 1.62 0 0 0 1.536 2.14h4.043a1.62 1.62 0 0 0 1.535-1.083l1.198-3.371 5.065 4.12c.283.23.634.333.985.333h7.931zm-9.217-6.913L9.7 9.24l-3.476 9.78H4.166L10.24 3.086l5.517 13.344h-2.595z" /></svg>;
}
function IconXero() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5"><circle cx="12" cy="12" r="10" fill="#13B5EA"/><text x="12" y="14.5" textAnchor="middle" fontSize="5.2" fontWeight="800" fill="white" fontFamily="Arial">XERO</text></svg>;
}
function IconSage() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.41 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.92 7.5 12.41 7.5c1.24 0 2.36.5 3.18 1.32l-1.42 1.42a2.5 2.5 0 1 0 0 3.54l1.42 1.42A4.48 4.48 0 0 1 12.41 16.5z" /></svg>;
}
function IconQuickBooks() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5"><circle cx="12" cy="12" r="10" fill="#2CA01C"/><circle cx="9" cy="12" r="4" fill="none" stroke="white" strokeWidth="2"/><circle cx="15" cy="12" r="4" fill="none" stroke="white" strokeWidth="2"/></svg>;
}
function IconGreenhouse() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zm0 11L2 8v9l10 5 10-5V8l-10 5z" /></svg>;
}
function IconIndeed() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M11.307 6.666h2.667V4H11.307v2.666zm0 13.334h2.667V8H11.307v12z" /></svg>;
}
function IconWorkable() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 6 18 9 9 12 18 15 6 18 18 21 6" /></svg>;
}
function IconM365() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white"><path d="M11.5 2.25L2.25 6v12l9.25 3.75L21.75 18V6L11.5 2.25zM11 4.5v15L4 17V7l7-2.5zm1.5 0L18.5 7v10l-6 2.5v-15z" /></svg>;
}

const BRAND_LOGOS: Record<string, React.ReactNode> = {
  slack: <IconSlack />, teams: <IconTeams />, zoom: <IconZoom />,
  "google-meet": <IconGoogleG />, quickbooks: <IconQuickBooks />,
  xero: <IconXero />, sage: <IconSage />, stripe: <IconStripe />,
  linkedin: <IconLinkedIn />, greenhouse: <IconGreenhouse />,
  indeed: <IconIndeed />, workable: <IconWorkable />,
  "google-workspace": <IconGoogleG />, "microsoft-365": <IconM365 />,
  notion: <IconNotion />, jira: <IconJira />, okta: <IconOkta />,
  "google-sso": <IconGoogleG />, "azure-ad": <IconAzure />,
  "slack-bot": <IconSlack />, "teams-bot": <IconTeams />,
  "chrome-ext": <IconChrome />, "ios-app": <IconApple />, "android-app": <IconAndroid />,
};

// ─── Config field definitions ─────────────────────────────────────────────────

interface CField { label: string; placeholder: string; key: string; sensitive?: boolean }

const CFIELDS: Record<string, CField[]> = {
  slack: [{ label: "Webhook URL", placeholder: "https://hooks.slack.com/services/...", key: "webhook_url" }],
  teams: [{ label: "Webhook URL", placeholder: "https://outlook.office.com/webhook/...", key: "webhook_url" }],
  zoom: [{ label: "API Key", placeholder: "Zoom API Key", key: "api_key", sensitive: true }, { label: "API Secret", placeholder: "Zoom API Secret", key: "api_secret", sensitive: true }],
  "google-meet": [{ label: "Admin Email", placeholder: "admin@yourcompany.com", key: "admin_email" }],
  quickbooks: [{ label: "Client ID", placeholder: "QuickBooks Client ID", key: "client_id", sensitive: true }, { label: "Client Secret", placeholder: "QuickBooks Client Secret", key: "client_secret", sensitive: true }],
  xero: [{ label: "Client ID", placeholder: "Xero Client ID", key: "client_id", sensitive: true }, { label: "Client Secret", placeholder: "Xero Client Secret", key: "client_secret", sensitive: true }],
  sage: [{ label: "API Key", placeholder: "Sage API Key", key: "api_key", sensitive: true }],
  stripe: [{ label: "Secret Key", placeholder: "sk_live_...", key: "api_key", sensitive: true }],
  linkedin: [{ label: "Access Token", placeholder: "LinkedIn Access Token", key: "access_token", sensitive: true }],
  greenhouse: [{ label: "API Key", placeholder: "Greenhouse API Key", key: "api_key", sensitive: true }],
  indeed: [{ label: "Publisher ID", placeholder: "Indeed Publisher ID", key: "publisher_id" }],
  workable: [{ label: "API Token", placeholder: "Workable API Token", key: "api_token", sensitive: true }, { label: "Subdomain", placeholder: "yourcompany", key: "subdomain" }],
  "google-workspace": [{ label: "Admin Email", placeholder: "admin@yourcompany.com", key: "admin_email" }, { label: "Service Account JSON", placeholder: '{"type":"service_account",...}', key: "sa_json", sensitive: true }],
  "microsoft-365": [{ label: "Tenant ID", placeholder: "Azure Tenant ID", key: "tenant_id" }, { label: "Client ID", placeholder: "App Client ID", key: "client_id", sensitive: true }, { label: "Client Secret", placeholder: "App Client Secret", key: "client_secret", sensitive: true }],
  notion: [{ label: "Integration Token", placeholder: "secret_...", key: "token", sensitive: true }],
  jira: [{ label: "Domain", placeholder: "yourcompany.atlassian.net", key: "domain" }, { label: "Email", placeholder: "admin@yourcompany.com", key: "email" }, { label: "API Token", placeholder: "Jira API Token", key: "api_token", sensitive: true }],
  okta: [{ label: "Domain", placeholder: "yourcompany.okta.com", key: "domain" }, { label: "API Token", placeholder: "Okta API Token", key: "api_token", sensitive: true }],
  "google-sso": [{ label: "Client ID", placeholder: "Google OAuth Client ID", key: "client_id", sensitive: true }, { label: "Client Secret", placeholder: "Google OAuth Client Secret", key: "client_secret", sensitive: true }],
  "azure-ad": [{ label: "Tenant ID", placeholder: "Azure Tenant ID", key: "tenant_id" }, { label: "Client ID", placeholder: "App Client ID", key: "client_id", sensitive: true }, { label: "Client Secret", placeholder: "App Client Secret", key: "client_secret", sensitive: true }],
  "slack-bot": [{ label: "Bot Token", placeholder: "xoxb-...", key: "bot_token", sensitive: true }],
  "teams-bot": [{ label: "App ID", placeholder: "Teams App ID", key: "app_id" }, { label: "App Password", placeholder: "Teams App Password", key: "app_password", sensitive: true }],
  "chrome-ext": [],
  "ios-app": [],
  "android-app": [],
  "email-digest": [{ label: "Recipient Emails", placeholder: "hr@company.com, ceo@company.com", key: "recipients" }, { label: "Frequency", placeholder: "daily or weekly", key: "frequency" }],
  "calendar-sync": [{ label: "Calendar ID", placeholder: "primary or id@group.calendar.google.com", key: "calendar_id" }],
  "widget-embed": [],
};

// ─── Data arrays ──────────────────────────────────────────────────────────────

const CONNECTOR_CATEGORIES = ["All", "Communication", "Payroll", "Recruiting", "Productivity", "Identity"] as const;
type CC = (typeof CONNECTOR_CATEGORIES)[number];

interface Connector { id: string; name: string; category: Exclude<CC, "All">; description: string; color: string; initials: string; popular?: boolean; new?: boolean }
interface Skill { id: string; name: string; category: string; description: string; icon: React.ReactNode; badge?: "popular" | "new" | "beta"; placeholder: string }
interface Plugin { id: string; name: string; type: string; description: string; color: string; initials: string; badge?: "popular" | "new"; downloadLink?: string }

const CONNECTORS: Connector[] = [
  { id: "slack", name: "Slack", category: "Communication", description: "Send leave alerts, payroll notifications, and onboarding reminders to your Slack channels.", color: "bg-[#4A154B]", initials: "Sl", popular: true },
  { id: "teams", name: "Microsoft Teams", category: "Communication", description: "Deliver HR updates and approval requests directly in Microsoft Teams.", color: "bg-[#5558AF]", initials: "Mt", popular: true },
  { id: "zoom", name: "Zoom", category: "Communication", description: "Auto-schedule interviews and onboarding calls via Zoom.", color: "bg-[#2D8CFF]", initials: "Zm" },
  { id: "google-meet", name: "Google Meet", category: "Communication", description: "Create Meet links automatically for performance reviews and interviews.", color: "bg-white border border-slate-200", initials: "Gm" },
  { id: "quickbooks", name: "QuickBooks", category: "Payroll", description: "Push payroll totals and employee records directly to QuickBooks Online.", color: "bg-[#2CA01C]", initials: "Qb", popular: true },
  { id: "xero", name: "Xero", category: "Payroll", description: "Sync payroll runs and employee expenses with your Xero account.", color: "bg-[#13B5EA]", initials: "Xe" },
  { id: "sage", name: "Sage", category: "Payroll", description: "Connect Sage for real-time payroll processing and journal entries.", color: "bg-[#00B050]", initials: "Sg" },
  { id: "stripe", name: "Stripe", category: "Payroll", description: "Process contractor payments and international transfers via Stripe.", color: "bg-[#635BFF]", initials: "St", new: true },
  { id: "linkedin", name: "LinkedIn Jobs", category: "Recruiting", description: "Post open roles to LinkedIn and import applicants automatically.", color: "bg-[#0A66C2]", initials: "Li", popular: true },
  { id: "greenhouse", name: "Greenhouse", category: "Recruiting", description: "Import candidates from Greenhouse ATS into your Atlas HR pipeline.", color: "bg-[#24A148]", initials: "Gh" },
  { id: "indeed", name: "Indeed", category: "Recruiting", description: "Sync job postings and sponsored listings with Indeed.", color: "bg-[#003A9B]", initials: "In" },
  { id: "workable", name: "Workable", category: "Recruiting", description: "Connect Workable to centralise applicant tracking and interviews.", color: "bg-[#5F4FF6]", initials: "Wk", new: true },
  { id: "google-workspace", name: "Google Workspace", category: "Productivity", description: "Sync employee directories, calendars, and documents with Google.", color: "bg-white border border-slate-200", initials: "Gw", popular: true },
  { id: "microsoft-365", name: "Microsoft 365", category: "Productivity", description: "Integrate with Outlook, OneDrive, and SharePoint for document management.", color: "bg-[#D83B01]", initials: "M3" },
  { id: "notion", name: "Notion", category: "Productivity", description: "Push HR policies, handbooks, and onboarding guides to Notion.", color: "bg-gray-900", initials: "No" },
  { id: "jira", name: "Jira", category: "Productivity", description: "Create onboarding and offboarding tickets in Jira automatically.", color: "bg-[#0052CC]", initials: "Ji" },
  { id: "okta", name: "Okta", category: "Identity", description: "Provision and deprovision employees via Okta SSO and SCIM.", color: "bg-[#007DC1]", initials: "Ok", popular: true },
  { id: "google-sso", name: "Google SSO", category: "Identity", description: "Allow your team to sign in to Atlas HR with their Google accounts.", color: "bg-white border border-slate-200", initials: "Gs" },
  { id: "azure-ad", name: "Azure Active Directory", category: "Identity", description: "Sync users and groups from Microsoft Azure AD via SCIM.", color: "bg-[#0072C6]", initials: "Az" },
];

function JobI() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>; }
function PplI() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function ChrtI() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>; }
function ShldI() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>; }
function MnyI() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function BkI() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>; }
function CalI() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function SrchI() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>; }
function ClpI() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>; }
function UsrPI() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>; }
function MailI() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>; }
function MtgI() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>; }
function MgrI() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }

const SKILLS: Skill[] = [
  { id: "jd-writer", name: "Job Description Writer", category: "Recruiting", description: "Generate structured, bias-free job descriptions from a brief role summary.", icon: <JobI />, badge: "popular", placeholder: "E.g. Senior Product Manager, fintech startup, leading a team of 4, remote-first. 5+ years experience required." },
  { id: "interview-gen", name: "Interview Question Generator", category: "Recruiting", description: "Build structured interview banks with competency-based questions and scoring rubrics.", icon: <AtlasAiMark className="h-6 w-6" />, badge: "popular", placeholder: "E.g. Software Engineer (backend), mid-level, focus on system design and Python." },
  { id: "review-assist", name: "Performance Review Assistant", category: "Performance", description: "Draft balanced performance narratives from ratings and notes.", icon: <ChrtI />, badge: "popular", placeholder: "E.g. Employee: Sarah Chen, Role: UX Designer, Rating: 4/5. Notes: Delivered redesign on time, strong collaboration, needs to improve documentation." },
  { id: "leave-advisor", name: "Leave Policy Advisor", category: "Compliance", description: "Analyse your leave policy against local labour law and surface gaps or risks.", icon: <CalI />, placeholder: "E.g. We're a UK-based company of 50 employees. What are our statutory leave obligations and what should our policy include?" },
  { id: "offer-drafter", name: "Offer Letter Drafter", category: "Recruiting", description: "Create compliant, personalised offer letters in seconds.", icon: <JobI />, placeholder: "E.g. Candidate: James Okafor, Role: Head of Finance, Start: 1 June 2026, Salary: £85,000/year, 25 days holiday, 6-month probation." },
  { id: "handbook-builder", name: "Employee Handbook Builder", category: "Policies", description: "Generate complete policy sections tailored to your company size and location.", icon: <BkI />, badge: "new", placeholder: "E.g. Write a remote work policy for a 30-person UK tech startup. Include eligibility, equipment, expectations, and security requirements." },
  { id: "salary-analyst", name: "Salary Benchmarking Analyst", category: "Compensation", description: "Compare pay bands against market data and get recommended adjustment ranges.", icon: <MnyI />, placeholder: "E.g. Data Analyst, mid-level (3 years exp), London, current salary £45,000. What is the market range?" },
  { id: "contract-analyzer", name: "Contract Analyzer", category: "Compliance", description: "Paste any employment contract and get a plain-English summary of key clauses and red flags.", icon: <ShldI />, placeholder: "Paste the employment contract text here and I will analyse the key terms, flag unusual clauses, and summarise in plain English." },
  { id: "onboarding-plan", name: "Onboarding Plan Generator", category: "Onboarding", description: "Create a tailored 30-60-90 day onboarding plan for any role in under a minute.", icon: <UsrPI />, badge: "new", placeholder: "E.g. Marketing Manager, senior-level, joining a 60-person SaaS company. Reports to CMO. Managing 2 direct reports from day 1." },
  { id: "exit-analyzer", name: "Exit Interview Analyzer", category: "Insights", description: "Surface themes and retention risk signals from exit interview responses.", icon: <SrchI />, placeholder: "Paste one or more exit interview responses here and I will identify patterns, risks, and recommend retention actions." },
  { id: "pip-writer", name: "Performance Improvement Plan Writer", category: "Performance", description: "Draft legally sound PIPs with clear objectives, timelines, and consequence statements.", icon: <ClpI />, placeholder: "E.g. Employee: Tom Bradley, Role: Account Manager, Issue: Missed quota for 3 consecutive quarters. Duration: 60-day PIP." },
  { id: "cv-screener", name: "CV Screening Assistant", category: "Recruiting", description: "Rank candidates against a job description and get a structured shortlist with reasoning.", icon: <PplI />, placeholder: "Paste the job description first, then each candidate's CV separated by '---'. I will rank and assess each one." },
  { id: "email-assistant", name: "HR Email Assistant", category: "Communications", description: "Draft, rewrite, or summarise HR emails — tone-adjusted and professional.", icon: <MailI />, badge: "new", placeholder: "E.g. Draft an email to a candidate offering them the Marketing Manager role, warm tone, asking them to confirm by Friday." },
  { id: "meeting-assistant", name: "Meeting Notes Assistant", category: "Communications", description: "Turn rough meeting notes into clean minutes with decisions and action items.", icon: <MtgI />, badge: "new", placeholder: "Paste your rough meeting notes and I will produce structured minutes, decisions, and a clear action-item list with owners." },
  { id: "manager-assistant", name: "Manager Assistant", category: "Management", description: "Coach managers through people situations — 1:1s, feedback, tough conversations, team planning.", icon: <MgrI />, badge: "new", placeholder: "E.g. One of my team keeps missing deadlines. How do I raise it constructively in our next 1:1?" },
  { id: "analytics-assistant", name: "HR Analytics Assistant", category: "Insights", description: "Interpret HR metrics and turn them into a plain-English summary with recommended actions.", icon: <ChrtI />, badge: "new", placeholder: "E.g. Headcount 48, 6 new hires this quarter, 9 pending leave requests, attrition up 4%. What does this tell me and what should I do?" },
];

const PLUGINS: Plugin[] = [
  { id: "slack-bot", name: "Slack Bot", type: "Messaging", description: "Let employees request leave, check balances, and get HR answers directly in Slack.", color: "bg-[#4A154B]", initials: "Sl", badge: "popular" },
  { id: "teams-bot", name: "Teams Bot", type: "Messaging", description: "Surface leave approvals, payroll alerts, and onboarding tasks inside Microsoft Teams.", color: "bg-[#5558AF]", initials: "Mt", badge: "popular" },
  { id: "chrome-ext", name: "Chrome Extension", type: "Browser", description: "Access employee profiles, approve requests, and log time entries without leaving your tab.", color: "bg-white border border-slate-200", initials: "Ch", badge: "new", downloadLink: "https://chrome.google.com/webstore" },
  { id: "ios-app", name: "Mobile App (iOS)", type: "Mobile", description: "Full Atlas HR experience on iPhone — approve leave, run payroll, and view your org chart.", color: "bg-black", initials: "iO", badge: "popular", downloadLink: "https://apps.apple.com" },
  { id: "android-app", name: "Mobile App (Android)", type: "Mobile", description: "Full Atlas HR experience on Android — approve leave, run payroll, and view your org chart.", color: "bg-[#3DDC84]", initials: "An", downloadLink: "https://play.google.com/store" },
  { id: "email-digest", name: "Email Digest", type: "Notifications", description: "Receive a daily or weekly summary of pending approvals, expiring contracts, and milestones.", color: "bg-sky-500", initials: "Em" },
  { id: "calendar-sync", name: "Calendar Sync", type: "Productivity", description: "Automatically block leave, public holidays, and HR events in Google Calendar and Outlook.", color: "bg-red-500", initials: "Ca", badge: "popular" },
  { id: "widget-embed", name: "Widget Embed", type: "Web", description: "Embed an HR self-service portal — leave requests, payslips, org chart — into any intranet.", color: "bg-indigo-500", initials: "We", badge: "new" },
];

// ─── Colour maps ──────────────────────────────────────────────────────────────

const SKILL_COLORS: Record<string, string> = {
  Recruiting: "bg-pink-50 text-pink-700 border-pink-200",
  Performance: "bg-violet-50 text-violet-700 border-violet-200",
  Compliance: "bg-red-50 text-red-700 border-red-200",
  Policies: "bg-blue-50 text-blue-700 border-blue-200",
  Compensation: "bg-amber-50 text-amber-700 border-amber-200",
  Onboarding: "bg-teal-50 text-teal-700 border-teal-200",
  Insights: "bg-sky-50 text-sky-700 border-sky-200",
  Communications: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Management: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const SKILL_ICON_COLORS: Record<string, string> = {
  Recruiting: "bg-pink-100 text-pink-600",
  Performance: "bg-violet-100 text-violet-600",
  Compliance: "bg-red-100 text-red-600",
  Policies: "bg-blue-100 text-blue-600",
  Compensation: "bg-amber-100 text-amber-600",
  Onboarding: "bg-teal-100 text-teal-600",
  Insights: "bg-sky-100 text-sky-600",
  Communications: "bg-indigo-100 text-indigo-600",
  Management: "bg-emerald-100 text-emerald-600",
};
const PLUGIN_TYPE_COLORS: Record<string, string> = {
  Messaging: "bg-purple-100 text-purple-700",
  Browser: "bg-yellow-100 text-yellow-700",
  Mobile: "bg-gray-100 text-gray-700",
  Notifications: "bg-sky-100 text-sky-700",
  Productivity: "bg-red-100 text-red-700",
  Web: "bg-indigo-100 text-indigo-700",
};

// ─── Root component ───────────────────────────────────────────────────────────

type Tab = "connectors" | "skills" | "plugins";

interface Props {
  isAdmin: boolean;
  connectedIds: string[];
  installedIds: string[];
  enabledSkillIds: string[];
}

export function IntegrationsClient({ isAdmin, connectedIds, installedIds, enabledSkillIds }: Props) {
  const [tab, setTab] = useState<Tab>("connectors");
  const [connected, setConnected] = useState<Set<string>>(new Set(connectedIds));
  const [installed, setInstalled] = useState<Set<string>>(new Set(installedIds));
  const [enabled, setEnabled] = useState<Set<string>>(new Set(enabledSkillIds));
  const [configTarget, setConfigTarget] = useState<{ item: Connector | Plugin; type: "connector" | "plugin" } | null>(null);
  const [skillTarget, setSkillTarget] = useState<Skill | null>(null);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Integrations & Extensions</h1>
            <p className="text-blue-300 text-sm mt-0.5">Connect your tools, extend Atlas HR with AI skills, and install workflow plugins.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-8 border-b border-navy-200">
        {([
          { id: "connectors", label: "Connectors", count: CONNECTORS.length },
          { id: "skills", label: "AI Skills", count: SKILLS.length },
          { id: "plugins", label: "Plugins", count: PLUGINS.length },
        ] as { id: Tab; label: string; count: number }[]).map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${tab === t.id ? "border-blue-600 text-blue-700" : "border-transparent text-navy-500 hover:text-navy-700"}`}>
            {t.label}
            <span className={`font-mono text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-blue-100 text-blue-700" : "bg-navy-100 text-navy-500"}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "connectors" && (
        <ConnectorsTab connected={connected} isAdmin={isAdmin}
          onConfigure={(item) => setConfigTarget({ item, type: "connector" })} />
      )}
      {tab === "skills" && (
        <SkillsTab enabled={enabled} setEnabled={setEnabled} isAdmin={isAdmin}
          onUse={(s) => setSkillTarget(s)} />
      )}
      {tab === "plugins" && (
        <PluginsTab installed={installed} isAdmin={isAdmin}
          onConfigure={(item) => setConfigTarget({ item, type: "plugin" })} />
      )}

      {configTarget && (
        <ConfigModal
          item={configTarget.item as any}
          type={configTarget.type}
          isConnected={configTarget.type === "connector" ? connected.has(configTarget.item.id) : installed.has(configTarget.item.id)}
          onClose={() => setConfigTarget(null)}
          onConnected={(id) => {
            if (configTarget.type === "connector") setConnected((p) => new Set([...p, id]));
            else setInstalled((p) => new Set([...p, id]));
            setConfigTarget(null);
          }}
          onDisconnected={(id) => {
            if (configTarget.type === "connector") setConnected((p) => { const n = new Set(p); n.delete(id); return n; });
            else setInstalled((p) => { const n = new Set(p); n.delete(id); return n; });
            setConfigTarget(null);
          }}
        />
      )}
      {skillTarget && <SkillChatModal skill={skillTarget} onClose={() => setSkillTarget(null)} />}
    </div>
  );
}

// ─── Connectors tab ───────────────────────────────────────────────────────────

function ConnectorsTab({ connected, isAdmin, onConfigure }: { connected: Set<string>; isAdmin: boolean; onConfigure: (c: Connector) => void }) {
  const [activeCategory, setActiveCategory] = useState<CC>("All");
  const [search, setSearch] = useState("");

  const filtered = CONNECTORS.filter((i) => {
    const q = search.toLowerCase();
    return (activeCategory === "All" || i.category === activeCategory) &&
      (!q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
        <div className="grid grid-cols-4 gap-3 flex-1">
          {[{ label: "Available", value: CONNECTORS.length }, { label: "Connected", value: connected.size }, { label: "Categories", value: CONNECTOR_CATEGORIES.length - 1 }, { label: "Popular", value: CONNECTORS.filter((i) => i.popular).length }].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-navy-200 p-3">
              <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="font-mono text-xl font-bold text-navy-900">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="relative shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" aria-label="Search connectors" className="pl-9 pr-4 h-9 w-56 rounded-xl border border-navy-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
        </div>
      </div>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {CONNECTOR_CATEGORIES.map((cat) => (
          <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === cat ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-navy-200 text-navy-600 hover:bg-navy-50"}`}>
            {cat}
          </button>
        ))}
      </div>
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const isConn = connected.has(c.id);
            return (
              <div key={c.id} className={`bg-white rounded-2xl border p-5 flex flex-col transition-all ${isConn ? "border-blue-200 shadow-sm" : "border-navy-200 hover:border-navy-300 hover:shadow-sm"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${c.color} flex items-center justify-center shrink-0`}>
                      {BRAND_LOGOS[c.id] ?? <span className="text-white font-bold text-sm">{c.initials}</span>}
                    </div>
                    <div><h3 className="font-semibold text-navy-900 text-sm leading-tight">{c.name}</h3><span className="text-xs text-navy-400">{c.category}</span></div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {c.popular && <span className="text-xs bg-navy-100 text-navy-500 px-2 py-0.5 rounded-full font-medium">Popular</span>}
                    {c.new && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">New</span>}
                    {isConn && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Connected</span>}
                  </div>
                </div>
                <p className="text-xs text-navy-500 leading-relaxed flex-1 mb-4">{c.description}</p>
                <button type="button" onClick={() => onConfigure(c)} disabled={!isAdmin} title={!isAdmin ? "Admin access required" : undefined}
                  className={`w-full text-sm font-semibold py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isConn ? "bg-navy-50 text-navy-700 hover:bg-navy-100 border border-navy-200" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                  {isConn ? "Reconfigure" : "Connect"}
                </button>
              </div>
            );
          })}
        </div>
      ) : <EmptyState message="No integrations found" sub="Try a different search or category." />}
    </>
  );
}

// ─── Skills tab ───────────────────────────────────────────────────────────────

function SkillsTab({ enabled, setEnabled, isAdmin, onUse }: { enabled: Set<string>; setEnabled: React.Dispatch<React.SetStateAction<Set<string>>>; isAdmin: boolean; onUse: (s: Skill) => void }) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = SKILLS.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  function handleToggle(skill: Skill) {
    const isEn = enabled.has(skill.id);
    setPendingId(skill.id);
    startTransition(async () => {
      const result = await toggleSkill(skill.id, !isEn);
      if (!result?.error) setEnabled((p) => { const n = new Set(p); if (isEn) n.delete(skill.id); else n.add(skill.id); return n; });
      setPendingId(null);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-navy-500">AI skills powered by Claude — draft, analyse, and automate HR tasks instantly.</p>
          {enabled.size > 0 && <p className="text-xs text-blue-600 font-semibold mt-0.5">{enabled.size} skill{enabled.size !== 1 ? "s" : ""} enabled — click <span className="underline underline-offset-2">Use</span> to invoke Claude</p>}
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search skills…" aria-label="Search skills" className="pl-9 pr-4 h-9 w-52 rounded-xl border border-navy-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
        </div>
      </div>
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((skill) => {
            const isEn = enabled.has(skill.id);
            const catColor = SKILL_COLORS[skill.category] ?? "bg-navy-50 text-navy-600 border-navy-200";
            const iconColor = SKILL_ICON_COLORS[skill.category] ?? "bg-navy-100 text-navy-600";
            const loading = pendingId === skill.id && isPending;
            return (
              <div key={skill.id} className={`bg-white rounded-2xl border p-5 flex flex-col transition-all ${isEn ? "border-blue-200 shadow-sm" : "border-navy-200 hover:border-navy-300 hover:shadow-sm"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>{skill.icon}</div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${catColor}`}>{skill.category}</span>
                    {skill.badge === "popular" && <span className="text-xs bg-navy-100 text-navy-500 px-2 py-0.5 rounded-full font-medium">Popular</span>}
                    {skill.badge === "new" && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">New</span>}
                  </div>
                </div>
                <h3 className="font-semibold text-navy-900 text-sm leading-snug mb-2">{skill.name}</h3>
                <p className="text-xs text-navy-500 leading-relaxed flex-1 mb-3">{skill.description}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleToggle(skill)} disabled={!isAdmin || loading} title={!isAdmin ? "Admin access required" : undefined}
                    className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isEn ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-navy-50 text-navy-700 hover:bg-navy-100 border border-navy-200"}`}>
                    {loading ? "…" : isEn ? "✓ Enabled" : "Enable skill"}
                  </button>
                  {isEn && (
                    <button type="button" onClick={() => onUse(skill)} title="Invoke Claude for this skill"
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-violet-700 transition-all shrink-0 flex items-center gap-1.5">
                      <AtlasAiMark className="h-4 w-4" />
                      Use
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : <EmptyState message="No skills found" sub="Try a different search term." />}
    </>
  );
}

// ─── Plugins tab ──────────────────────────────────────────────────────────────

function PluginsTab({ installed, isAdmin, onConfigure }: { installed: Set<string>; isAdmin: boolean; onConfigure: (p: Plugin) => void }) {
  const [search, setSearch] = useState("");
  const filtered = PLUGINS.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
  });
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-navy-500">Workflow plugins that extend Atlas HR into the tools your team already uses.{installed.size > 0 && <span className="ml-2 text-blue-600 font-semibold">{installed.size} installed</span>}</p>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plugins…" aria-label="Search plugins" className="pl-9 pr-4 h-9 w-52 rounded-xl border border-navy-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
        </div>
      </div>
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const isInst = installed.has(p.id);
            const typeColor = PLUGIN_TYPE_COLORS[p.type] ?? "bg-navy-100 text-navy-600";
            return (
              <div key={p.id} className={`bg-white rounded-2xl border p-5 flex flex-col transition-all ${isInst ? "border-blue-200 shadow-sm" : "border-navy-200 hover:border-navy-300 hover:shadow-sm"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${p.color} flex items-center justify-center shrink-0`}>{BRAND_LOGOS[p.id] ?? <span className="text-white font-bold text-sm">{p.initials}</span>}</div>
                    <div><h3 className="font-semibold text-navy-900 text-sm leading-tight">{p.name}</h3><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>{p.type}</span></div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {p.badge === "popular" && <span className="text-xs bg-navy-100 text-navy-500 px-2 py-0.5 rounded-full font-medium">Popular</span>}
                    {p.badge === "new" && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">New</span>}
                    {isInst && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Installed</span>}
                  </div>
                </div>
                <p className="text-xs text-navy-500 leading-relaxed flex-1 mb-4">{p.description}</p>
                <button type="button" onClick={() => onConfigure(p)} disabled={!isAdmin} title={!isAdmin ? "Admin access required" : undefined}
                  className={`w-full text-sm font-semibold py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isInst ? "bg-navy-50 text-navy-700 hover:bg-navy-100 border border-navy-200" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                  {isInst ? "Reconfigure" : "Install"}
                </button>
              </div>
            );
          })}
        </div>
      ) : <EmptyState message="No plugins found" sub="Try a different search term." />}
    </>
  );
}

// ─── Config modal ─────────────────────────────────────────────────────────────

function ConfigModal({ item, type, isConnected, onClose, onConnected, onDisconnected }: {
  item: { id: string; name: string; color: string; initials: string; description: string; downloadLink?: string };
  type: "connector" | "plugin";
  isConnected: boolean;
  onClose: () => void;
  onConnected: (id: string) => void;
  onDisconnected: (id: string) => void;
}) {
  const fields = CFIELDS[item.id] ?? [];
  const isDownload = !!(item as Plugin).downloadLink && fields.length === 0;
  const isEmbed = item.id === "widget-embed";
  const [values, setValues] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const embedCode = `<iframe\n  src="https://atlas-hr.app/embed/widget?org=YOUR_ORG_ID"\n  width="100%" height="640"\n  frameborder="0"\n  allow="clipboard-write"\n  style="border-radius:12px;border:1px solid #e2e8f0;">\n</iframe>`;

  function handleSave() {
    setErr(null);
    if (!isDownload && !isEmbed) {
      const missing = fields.find((f) => !values[f.key]?.trim());
      if (missing) { setErr(`${missing.label} is required.`); return; }
    }
    startTransition(async () => {
      const res = await saveConnectorConfig(item.id, type, isDownload || isEmbed ? {} : values);
      if (res?.error) setErr(res.error); else onConnected(item.id);
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      const res = await disconnectIntegration(item.id);
      if (res?.error) setErr(res.error); else onDisconnected(item.id);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className={`h-10 w-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
            {BRAND_LOGOS[item.id] ?? <span className="text-white font-bold text-sm">{item.initials}</span>}
          </div>
          <div>
            <h2 className="text-base font-bold text-navy-900">{item.name}</h2>
            <p className="text-xs text-navy-500">{isConnected ? "Currently connected" : "Not connected"}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="ml-auto text-navy-400 hover:text-navy-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {isDownload ? (
          <div className="space-y-4">
            <p className="text-sm text-navy-600">{item.description}</p>
            <a href={(item as Plugin).downloadLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download / Install
            </a>
            {!isConnected && (
              <button type="button" onClick={handleSave} disabled={isPending}
                className="w-full bg-navy-50 text-navy-700 border border-navy-200 text-sm font-semibold py-2 rounded-xl hover:bg-navy-100 transition-colors disabled:opacity-50">
                {isPending ? "Saving…" : "Mark as installed"}
              </button>
            )}
          </div>
        ) : isEmbed ? (
          <div className="space-y-4">
            <div className="bg-navy-900 rounded-xl p-4 overflow-x-auto">
              <pre className="text-xs text-navy-100 font-mono whitespace-pre">{embedCode}</pre>
            </div>
            <button type="button" onClick={() => { void navigator.clipboard.writeText(embedCode); }}
              className="w-full bg-navy-50 text-navy-700 border border-navy-200 text-sm font-semibold py-2 rounded-xl hover:bg-navy-100 transition-colors">
              Copy embed code
            </button>
            {!isConnected && (
              <button type="button" onClick={handleSave} disabled={isPending}
                className="w-full bg-blue-600 text-white text-sm font-semibold py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                {isPending ? "Saving…" : "Mark as installed"}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5" htmlFor={`cfg-${f.key}`}>{f.label}</label>
                <input id={`cfg-${f.key}`} type={f.sensitive ? "password" : "text"} value={values[f.key] ?? ""} onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
              </div>
            ))}
            {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
            <button type="button" onClick={handleSave} disabled={isPending}
              className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isPending ? "Saving…" : isConnected ? "Update configuration" : "Connect"}
            </button>
            {isConnected && (
              <button type="button" onClick={handleDisconnect} disabled={isPending}
                className="w-full bg-red-50 text-red-600 border border-red-200 text-sm font-semibold py-2 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50">
                Disconnect
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skill chat modal ─────────────────────────────────────────────────────────

function SkillChatModal({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (output && outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  async function generate() {
    if (!prompt.trim() || generating) return;
    setOutput(""); setErr(null); setGenerating(true);
    try {
      const res = await fetch("/api/skills/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: skill.id, prompt: prompt.trim() }),
      });
      if (!res.ok) { setErr((await res.text()) || "Failed to generate output."); return; }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setOutput(acc);
      }
    } catch { setErr("Network error. Please try again."); }
    finally { setGenerating(false); }
  }

  const iconColor = SKILL_ICON_COLORS[skill.category] ?? "bg-navy-100 text-navy-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!generating ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col z-10 max-h-[90vh]">
        <div className="flex items-center gap-3 p-5 border-b border-navy-100 shrink-0">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>{skill.icon}</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-navy-900 truncate">{skill.name}</h2>
            <p className="text-xs text-navy-500 truncate">{skill.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">
              <AtlasAiMark className="h-3.5 w-3.5" />Powered by Claude
            </span>
            <button type="button" onClick={onClose} aria-label="Close" disabled={generating} className="text-navy-400 hover:text-navy-700 disabled:opacity-40">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-5 border-b border-navy-100 shrink-0">
          <label className="block text-xs font-semibold text-navy-700 mb-2" htmlFor="skill-prompt">Your input</label>
          <textarea id="skill-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={skill.placeholder} rows={3} disabled={generating}
            className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none disabled:opacity-50" />
          <button type="button" onClick={() => void generate()} disabled={!prompt.trim() || generating}
            className="mt-2 w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:from-blue-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {generating ? (
              <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Claude is generating…</>
            ) : (
              <><AtlasAiMark className="h-4 w-4" />Generate with Claude</>
            )}
          </button>
        </div>

        {(output || err) ? (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
              <p className="text-xs font-semibold text-navy-600">Output</p>
              {output && !generating && (
                <button type="button" onClick={() => { void navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-navy-500 hover:text-navy-800 transition-colors">
                  {copied ? <><svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg><span className="text-green-600">Copied!</span></> : <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>}
                </button>
              )}
            </div>
            <div ref={outputRef} className="flex-1 overflow-y-auto px-5 pb-5">
              {err ? <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p> : (
                <div className="text-sm text-navy-700 leading-relaxed whitespace-pre-wrap">
                  {output}{generating && <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-text-bottom" />}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center mx-auto mb-3">
                <AtlasAiMark className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-navy-500">Enter your details above and click <span className="font-semibold text-navy-700">Generate with Claude</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-navy-200">
      <div className="h-14 w-14 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto mb-4">
        <svg className="h-7 w-7 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
      </div>
      <p className="text-base font-semibold text-navy-900 mb-1">{message}</p>
      <p className="text-sm text-navy-500">{sub}</p>
    </div>
  );
}
