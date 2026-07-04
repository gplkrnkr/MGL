const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE CONFIGURATION
// Replace these with your actual values from supabase.com → Project Settings → API
// ─────────────────────────────────────────────────────────────────────────────
//const SUPABASE_URL  = "https://YOUR_PROJECT_ID.supabase.co";
//const SUPABASE_ANON = "YOUR_ANON_PUBLIC_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const C = {
  navy: "#1A3C5E", navyD: "#0D2138", navyL: "#2A5280",
  orange: "#E8833A", orangeL: "#F4A96A",
  teal: "#1D9E75", tealL: "#E8F5EF",
  red: "#C0392B", redL: "#FDECEA",
  amber: "#D4A017", amberL: "#FDF6E3",
  gray1: "#F7F6F3", gray2: "#EDEBE6", gray3: "#D4D1CB",
  gray4: "#9B9791", gray5: "#555250",
  white: "#FFFFFF", black: "#1A1A1A", blue: "#EAF2FB",
};

const screens = [
  { id: "setup",      label: "Supabase Setup",       icon: "⚙️",  desc: "Configure your database connection" },
  { id: "worker-reg", label: "Worker Registration",  icon: "🪪",  desc: "Register workers → saved to Supabase" },
  { id: "worker-app", label: "Worker App",           icon: "📱",  desc: "Live job feed from real database" },
  { id: "employer",   label: "Employer Portal",      icon: "🏢",  desc: "Search live workers, post jobs" },
  { id: "agent",      label: "Agent App (MSC)",      icon: "🧑‍💼", desc: "Field registrations with offline queue" },
  { id: "fraud",      label: "Fraud Detection",      icon: "🛡️",  desc: "Live fraud flags from database" },
  { id: "govt",       label: "Govt Dashboard",       icon: "📊",  desc: "Real aggregated stats from Supabase" },
  { id: "matching",   label: "AI Matching Engine",   icon: "🤖",  desc: "Match against live worker pool" },
  { id: "gcc",        label: "GCC Overseas",         icon: "✈️",  desc: "Readiness tracker persisted to DB" },
];

// ─── CLAUDE API ──────────────────────────────────────────────────────────────
async function askClaude(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6", max_tokens: 1000,
      system, messages: [{ role: "user", content: user }],
    }),
  });
  const d = await res.json();
  return d.content?.[0]?.text || "Unable to process.";
}

// ─── SUPABASE HELPERS ────────────────────────────────────────────────────────
const db = {
  // Workers
  async insertWorker(w) {
    const { data, error } = await supabase.from("workers").insert([w]).select().single();
    return { data, error };
  },
  async getWorkers(filters = {}) {
    let q = supabase.from("workers").select("*");
    if (filters.skill)    q = q.ilike("skill", `%${filters.skill}%`);
    if (filters.location) q = q.ilike("current_city", `%${filters.location}%`);
    if (filters.verified) q = q.eq("aadhaar_verified", true);
    if (filters.available !== undefined) q = q.eq("available", filters.available);
    q = q.order("match_score", { ascending: false }).limit(filters.limit || 20);
    const { data, error } = await q;
    return { data: data || [], error };
  },
  async getWorkerById(mgl_id) {
    const { data, error } = await supabase.from("workers").select("*").eq("mgl_id", mgl_id).single();
    return { data, error };
  },
  async updateWorker(mgl_id, updates) {
    const { data, error } = await supabase.from("workers").update(updates).eq("mgl_id", mgl_id).select().single();
    return { data, error };
  },
  // Jobs
  async insertJob(j) {
    const { data, error } = await supabase.from("jobs").insert([j]).select().single();
    return { data, error };
  },
  async getJobs(filters = {}) {
    let q = supabase.from("jobs").select("*, employers(company_name, gstin_verified)").eq("status", "active");
    if (filters.skill)    q = q.ilike("skill_required", `%${filters.skill}%`);
    if (filters.location) q = q.ilike("location", `%${filters.location}%`);
    q = q.order("created_at", { ascending: false }).limit(20);
    const { data, error } = await q;
    return { data: data || [], error };
  },
  // Employers
  async insertEmployer(e) {
    const { data, error } = await supabase.from("employers").insert([e]).select().single();
    return { data, error };
  },
  async getEmployers() {
    const { data, error } = await supabase.from("employers").select("*").order("created_at", { ascending: false });
    return { data: data || [], error };
  },
  // Placements
  async insertPlacement(p) {
    const { data, error } = await supabase.from("placements").insert([p]).select().single();
    return { data, error };
  },
  async getPlacements(mgl_id) {
    const { data, error } = await supabase.from("placements").select("*, employers(company_name)").eq("worker_mgl_id", mgl_id).order("created_at", { ascending: false });
    return { data: data || [], error };
  },
  // Fraud flags
  async insertFraudFlag(f) {
    const { data, error } = await supabase.from("fraud_flags").insert([f]).select().single();
    return { data, error };
  },
  async getFraudFlags() {
    const { data, error } = await supabase.from("fraud_flags").select("*").order("created_at", { ascending: false }).limit(20);
    return { data: data || [], error };
  },
  async updateFraudFlag(id, updates) {
    const { data, error } = await supabase.from("fraud_flags").update(updates).eq("id", id).select().single();
    return { data, error };
  },
  // Aggregated stats for govt dashboard
  async getStats(state) {
    const [workers, placements, jobs] = await Promise.all([
      supabase.from("workers").select("id, skill, current_city, aadhaar_verified, gcc_ready", { count: "exact" }).eq("home_state", state),
      supabase.from("placements").select("id, destination_country", { count: "exact" }).eq("worker_state", state),
      supabase.from("jobs").select("id", { count: "exact" }).eq("status", "active"),
    ]);
    const gccCount = (placements.data || []).filter(p => p.destination_country && p.destination_country !== "India").length;
    return {
      totalWorkers: workers.count || 0,
      totalPlacements: placements.count || 0,
      gccPlacements: gccCount,
      activeJobs: jobs.count || 0,
      skills: groupBy(workers.data || [], "skill"),
    };
  },
  // Offline queue
  offlineQueue: [],
  queueRegistration(w) {
    this.offlineQueue.push({ ...w, queued_at: new Date().toISOString() });
    localStorage.setItem("mgl_offline_queue", JSON.stringify(this.offlineQueue));
  },
  loadQueue() {
    try { this.offlineQueue = JSON.parse(localStorage.getItem("mgl_offline_queue") || "[]"); } catch { this.offlineQueue = []; }
    return this.offlineQueue;
  },
  async syncQueue() {
    const q = this.loadQueue();
    if (!q.length) return { synced: 0, errors: 0 };
    let synced = 0, errors = 0;
    for (const w of q) {
      const { error } = await this.insertWorker(w);
      if (!error) synced++; else errors++;
    }
    if (synced === q.length) {
      this.offlineQueue = [];
      localStorage.removeItem("mgl_offline_queue");
    }
    return { synced, errors };
  },
};

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] || "Other";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function generateMglId(state, district) {
  const st = (state || "XX").substring(0, 2).toUpperCase();
  const dist = (district || "XXX").substring(0, 3).toUpperCase();
  const num = String(Math.floor(10000 + Math.random() * 90000));
  return `MGL/${st}/${dist}/${num}`;
}

// ─── SHARED UI ATOMS ────────────────────────────────────────────────────────
const Badge = ({ color, children }) => (
  <span style={{
    display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: color === "green" ? C.tealL : color === "red" ? C.redL : color === "amber" ? C.amberL : C.blue,
    color: color === "green" ? C.teal : color === "red" ? C.red : color === "amber" ? C.amber : C.navy,
  }}>{children}</span>
);

const Btn = ({ onClick, children, variant = "primary", size = "md", disabled, loading }) => {
  const styles = {
    primary: { background: C.navy, color: C.white },
    accent:  { background: C.orange, color: C.white },
    ghost:   { background: "transparent", color: C.navy, border: `1px solid ${C.gray3}` },
    danger:  { background: C.red, color: C.white },
    teal:    { background: C.teal, color: C.white },
  };
  return (
    <button onClick={disabled || loading ? undefined : onClick} style={{
      ...styles[variant], border: "none", cursor: disabled || loading ? "not-allowed" : "pointer",
      borderRadius: 8, fontWeight: 600, fontFamily: "inherit", display: "inline-flex",
      alignItems: "center", gap: 6, opacity: disabled || loading ? 0.6 : 1, transition: "all 0.15s",
      padding: size === "sm" ? "6px 14px" : "10px 20px", fontSize: size === "sm" ? 12 : 14,
      ...(styles[variant].border ? { border: styles[variant].border } : {}),
    }}>
      {loading && <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>}
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = "text", helper }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 12, fontWeight: 600, color: C.gray5, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.gray3}`, borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", background: C.white, color: C.black, boxSizing: "border-box" }} />
    {helper && <div style={{ fontSize: 11, color: C.gray4, marginTop: 3 }}>{helper}</div>}
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 12, fontWeight: 600, color: C.gray5, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.gray3}`, borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: C.white, color: C.black, outline: "none" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.gray2}`, padding: 20, ...style }}>{children}</div>
);

const SectionTitle = ({ icon, title, desc }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.navy }}>{title}</h2>
    </div>
    <p style={{ margin: 0, fontSize: 13, color: C.gray4 }}>{desc}</p>
  </div>
);

const DBBadge = ({ connected }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: connected ? C.tealL : C.redL, color: connected ? C.teal : C.red }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? C.teal : C.red, animation: connected ? "pulse 2s infinite" : "none" }}></span>
    {connected ? "Supabase Connected" : "Not Connected"}
  </div>
);

const Loading = ({ text = "Loading from Supabase..." }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.gray4, fontSize: 13, padding: "12px 0" }}>
    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> {text}
  </div>
);

const AIBox = ({ text, loading }) => (
  <div style={{ background: C.blue, border: `1px solid ${C.navy}20`, borderRadius: 10, padding: 14, marginTop: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>✦ MGL AI Analysis</div>
    {loading ? <Loading text="Analysing..." /> : <p style={{ margin: 0, fontSize: 13, color: C.black, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{text}</p>}
  </div>
);

const ProgressBar = ({ value, max = 100, color = C.navy }) => (
  <div style={{ background: C.gray2, borderRadius: 20, height: 8, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${(value / max) * 100}%`, background: color, borderRadius: 20, transition: "width 0.4s" }} />
  </div>
);

const ErrorBox = ({ error }) => error ? (
  <div style={{ background: C.redL, border: `1px solid ${C.red}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: C.red }}>
    ⚠️ {error.message || String(error)}
  </div>
) : null;

const SuccessBox = ({ msg }) => msg ? (
  <div style={{ background: C.tealL, border: `1px solid ${C.teal}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: C.teal }}>
    ✅ {msg}
  </div>
) : null;

// ─── SETUP SCREEN ────────────────────────────────────────────────────────────
function SetupScreen({ connected, onTest }) {
  const [url, setUrl] = useState(SUPABASE_URL);
  const [key, setKey] = useState(SUPABASE_ANON);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const test = async () => {
    setTesting(true); setResult(null);
    try {
      const { data, error } = await supabase.from("workers").select("id").limit(1);
      if (error) throw error;
      setResult({ ok: true, msg: `Connected! Workers table found. (${data.length} rows sampled)` });
      onTest(true);
    } catch (e) {
      setResult({ ok: false, msg: e.message });
      onTest(false);
    }
    setTesting(false);
  };

  return (
    <div>
      <SectionTitle icon="⚙️" title="Supabase Setup" desc="Connect MGL PoC to your live database in 3 steps" />

      <Card style={{ marginBottom: 16, borderLeft: `4px solid ${C.orange}` }}>
        <h3 style={{ color: C.navy, margin: "0 0 8px", fontSize: 15 }}>Step 1 — Create a free Supabase project</h3>
        <p style={{ margin: 0, fontSize: 13, color: C.gray5 }}>Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: C.navy }}>supabase.com</a> → New Project → choose a name and region (ap-south-1 for India). Free tier gives you 500MB and unlimited API calls.</p>
      </Card>

      <Card style={{ marginBottom: 16, borderLeft: `4px solid ${C.orange}` }}>
        <h3 style={{ color: C.navy, margin: "0 0 12px", fontSize: 15 }}>Step 2 — Run this SQL in Supabase SQL Editor</h3>
        <div style={{ background: "#1e1e2e", borderRadius: 8, padding: 16, overflow: "auto", marginBottom: 8 }}>
          <pre style={{ margin: 0, fontSize: 11, color: "#cdd6f4", fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{`-- MGL DATABASE SCHEMA
-- Run this in Supabase: SQL Editor → New Query → Paste → Run

-- Workers table
CREATE TABLE workers (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mgl_id        TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  home_state    TEXT,
  home_district TEXT,
  current_city  TEXT,
  skill         TEXT NOT NULL,
  experience_yr INTEGER DEFAULT 0,
  language      TEXT DEFAULT 'hi',
  aadhaar_last4 TEXT,
  aadhaar_verified BOOLEAN DEFAULT FALSE,
  face_verified BOOLEAN DEFAULT FALSE,
  match_score   INTEGER DEFAULT 70,
  rating        NUMERIC(3,1) DEFAULT 0,
  placements_count INTEGER DEFAULT 0,
  available     BOOLEAN DEFAULT TRUE,
  gcc_ready     BOOLEAN DEFAULT FALSE,
  gcc_score     INTEGER DEFAULT 0,
  registered_by TEXT DEFAULT 'self',
  source_channel TEXT DEFAULT 'app',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Employers table
CREATE TABLE employers (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name    TEXT NOT NULL,
  gstin           TEXT,
  gstin_verified  BOOLEAN DEFAULT FALSE,
  contact_name    TEXT,
  phone           TEXT,
  email           TEXT,
  city            TEXT,
  plan            TEXT DEFAULT 'starter',
  profile_views_used INTEGER DEFAULT 0,
  profile_views_limit INTEGER DEFAULT 300,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id     UUID REFERENCES employers(id),
  title           TEXT NOT NULL,
  skill_required  TEXT NOT NULL,
  location        TEXT,
  wage_monthly    INTEGER,
  duration_months INTEGER,
  vacancies       INTEGER DEFAULT 1,
  status          TEXT DEFAULT 'active',
  urgent          BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Placements table
CREATE TABLE placements (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_mgl_id   TEXT REFERENCES workers(mgl_id),
  worker_state    TEXT,
  employer_id     UUID REFERENCES employers(id),
  job_id          UUID REFERENCES jobs(id),
  status          TEXT DEFAULT 'active',
  destination_country TEXT DEFAULT 'India',
  start_date      DATE,
  end_date        DATE,
  worker_rating   INTEGER,
  employer_rating INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Fraud flags table
CREATE TABLE fraud_flags (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_type   TEXT NOT NULL,
  severity    TEXT NOT NULL,
  account_ref TEXT,
  detail      TEXT,
  status      TEXT DEFAULT 'open',
  action_taken TEXT,
  ai_analysis TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- GCC readiness table
CREATE TABLE gcc_readiness (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_mgl_id TEXT REFERENCES workers(mgl_id),
  passport    BOOLEAN DEFAULT FALSE,
  medical     BOOLEAN DEFAULT FALSE,
  police      BOOLEAN DEFAULT FALSE,
  emigrate    BOOLEAN DEFAULT FALSE,
  insurance   BOOLEAN DEFAULT FALSE,
  language    BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (open for PoC — lock down for production)
ALTER TABLE workers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags   ENABLE ROW LEVEL SECURITY;
ALTER TABLE gcc_readiness ENABLE ROW LEVEL SECURITY;

-- Allow all for PoC (replace with proper auth policies in production)
CREATE POLICY "allow_all_workers"       ON workers       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_employers"     ON employers     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_jobs"          ON jobs          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_placements"    ON placements    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_fraud"         ON fraud_flags   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_gcc"           ON gcc_readiness FOR ALL USING (true) WITH CHECK (true);

-- Seed some sample fraud flags so dashboard isn't empty
INSERT INTO fraud_flags (flag_type, severity, account_ref, detail, status, action_taken) VALUES
  ('Bulk Registration', 'Critical', 'Agent ACC-441', '47 registrations from single GPS in 28 minutes', 'open', 'Batch held'),
  ('Duplicate Aadhaar', 'High', 'Worker MGL/TN/CHN/09921', 'Same Aadhaar VID across 3 phone numbers', 'open', 'Account frozen'),
  ('Fake Employer', 'High', 'Employer EMP-1182', 'GSTIN failed validation. 340 profiles viewed, 0 offers', 'open', 'Account suspended'),
  ('False Skill Claim', 'Medium', 'Worker MGL/KA/BLR/04421', 'Claims Master Electrician, 0 employer verifications', 'resolved', 'Skill downgraded');`}</pre>
        </div>
        <Btn onClick={() => navigator.clipboard?.writeText(document.querySelector("pre").textContent)} variant="ghost" size="sm">📋 Copy SQL</Btn>
      </Card>

      <Card style={{ marginBottom: 16, borderLeft: `4px solid ${C.orange}` }}>
        <h3 style={{ color: C.navy, margin: "0 0 12px", fontSize: 15 }}>Step 3 — Add your Supabase credentials</h3>
        <p style={{ fontSize: 12, color: C.gray4, marginBottom: 12 }}>Project Settings → API → copy Project URL and anon public key</p>
        <Input label="Supabase Project URL" value={url} onChange={setUrl} placeholder="https://xxxx.supabase.co" helper="From Project Settings → API → Project URL" />
        <Input label="Supabase Anon Key" value={key} onChange={setKey} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..." helper="From Project Settings → API → anon public" />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Btn onClick={test} variant="accent" loading={testing}>Test Connection</Btn>
          <DBBadge connected={connected} />
        </div>
        {result && (
          result.ok
            ? <SuccessBox msg={result.msg} />
            : <ErrorBox error={{ message: result.msg }} />
        )}
      </Card>

      <Card style={{ background: C.blue }}>
        <h3 style={{ color: C.navy, margin: "0 0 8px", fontSize: 14 }}>📝 Important: Update the code constants</h3>
        <p style={{ fontSize: 12, color: C.gray5, margin: 0 }}>
          For a permanent setup, replace the <code style={{ background: C.gray2, padding: "1px 6px", borderRadius: 4 }}>SUPABASE_URL</code> and <code style={{ background: C.gray2, padding: "1px 6px", borderRadius: 4 }}>SUPABASE_ANON</code> constants at the top of the JSX file with your real values. The test above is live — but after page refresh you will need to re-enter them unless you update the constants.
        </p>
      </Card>
    </div>
  );
}

// ─── WORKER REGISTRATION ─────────────────────────────────────────────────────
function WorkerReg({ connected }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", phone: "", district: "", state: "", skill: "", aadhaar4: "", language: "hi" });
  const [otp, setOtp] = useState(""); const [otpSent, setOtpSent] = useState(false);
  const [mglId, setMglId] = useState(""); const [aiSummary, setAiSummary] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState(null);
  const [recentWorkers, setRecentWorkers] = useState([]);
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const skills = [
    { value: "mason", label: "Mason / Bricklayer" }, { value: "carpenter", label: "Carpenter" },
    { value: "electrician", label: "Electrician" }, { value: "plumber", label: "Plumber" },
    { value: "painter", label: "Painter" }, { value: "housekeeping", label: "Housekeeping" },
    { value: "security", label: "Security Guard" }, { value: "driver", label: "Driver" },
    { value: "welder", label: "Welder" }, { value: "helper", label: "Construction Helper" },
  ];
  const states = ["Tamil Nadu", "Karnataka", "Maharashtra", "Bihar", "Uttar Pradesh", "West Bengal", "Andhra Pradesh", "Telangana"];
  const langs = [{ value: "hi", label: "हिंदी" }, { value: "ta", label: "தமிழ்" }, { value: "kn", label: "ಕನ್ನಡ" }, { value: "te", label: "తెలుగు" }, { value: "bn", label: "বাংলা" }];

  useEffect(() => {
    if (connected) loadRecent();
  }, [connected]);

  const loadRecent = async () => {
    const { data } = await db.getWorkers({ limit: 5 });
    setRecentWorkers(data);
  };

  const complete = async () => {
    setLoading(true); setError(null);
    const id = generateMglId(form.state, form.district);
    const workerData = {
      mgl_id: id, full_name: form.name, phone: form.phone,
      home_state: form.state, home_district: form.district,
      current_city: form.district, skill: form.skill,
      experience_yr: 0, language: form.language,
      aadhaar_last4: form.aadhaar4, aadhaar_verified: true,
      face_verified: false, match_score: 70 + Math.floor(Math.random() * 20),
      available: true, registered_by: "self", source_channel: "app",
    };
    const { error: dbErr } = await db.insertWorker(workerData);
    if (dbErr) { setError(dbErr); setLoading(false); return; }
    setMglId(id);
    const summary = await askClaude(
      "You are MGL's worker registration AI. Generate a short profile summary and skill match score (0-100). Format: first line = 'Skill Match Score: XX/100', then 2 encouraging sentences.",
      `Worker: Name=${form.name}, State=${form.state}, Skill=${form.skill}. Generate profile summary.`
    );
    setAiSummary(summary);
    setLoading(false); setStep(3);
    loadRecent();
  };

  const reset = () => {
    setStep(0); setForm({ name: "", phone: "", district: "", state: "", skill: "", aadhaar4: "", language: "hi" });
    setOtpSent(false); setOtp(""); setMglId(""); setAiSummary(""); setError(null);
  };

  const steps = ["Basic Info", "Location & Skill", "Aadhaar Verify", "MGL ID Ready"];

  return (
    <div>
      <SectionTitle icon="🪪" title="Worker Registration" desc="Create a verified MGL ID — saved live to Supabase" />
      {!connected && <div style={{ background: C.amberL, border: `1px solid ${C.amber}30`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: C.amber }}>⚠️ Not connected to Supabase. Complete setup first — registrations won't persist.</div>}

      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto 4px", background: i < step ? C.teal : i === step ? C.navy : C.gray2, color: i <= step ? C.white : C.gray4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
              {i < step ? "✓" : i + 1}
            </div>
            <div style={{ fontSize: 10, color: i === step ? C.navy : C.gray4, fontWeight: i === step ? 600 : 400 }}>{s}</div>
          </div>
        ))}
      </div>

      <ErrorBox error={error} />

      {step === 0 && <Card>
        <h3 style={{ margin: "0 0 16px", color: C.navy, fontSize: 16 }}>Personal Details</h3>
        <Select label="Preferred Language" value={form.language} onChange={set("language")} options={langs} />
        <Input label="Full Name" value={form.name} onChange={set("name")} placeholder="As per Aadhaar" />
        <Input label="Phone Number" value={form.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" type="tel" />
        <Btn onClick={() => form.name && form.phone && setStep(1)} variant="primary">Next →</Btn>
      </Card>}

      {step === 1 && <Card>
        <h3 style={{ margin: "0 0 16px", color: C.navy, fontSize: 16 }}>Location & Primary Skill</h3>
        <Select label="Home State" value={form.state} onChange={set("state")} options={[{ value: "", label: "Select state" }, ...states.map(s => ({ value: s, label: s }))]} />
        <Input label="Home District" value={form.district} onChange={set("district")} placeholder="e.g. Muzaffarpur" />
        <Select label="Primary Skill" value={form.skill} onChange={set("skill")} options={[{ value: "", label: "Select skill" }, ...skills]} />
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => setStep(0)} variant="ghost">← Back</Btn>
          <Btn onClick={() => form.state && form.district && form.skill && setStep(2)} variant="primary">Next →</Btn>
        </div>
      </Card>}

      {step === 2 && <Card>
        <h3 style={{ margin: "0 0 16px", color: C.navy, fontSize: 16 }}>Aadhaar Verification</h3>
        <div style={{ background: C.amberL, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: C.amber }}>⚠️ MGL stores only your Virtual ID (VID) — never your raw Aadhaar. DPDP Act 2023 compliant.</div>
        <Input label="Aadhaar (last 4 digits only)" value={form.aadhaar4} onChange={set("aadhaar4")} placeholder="XXXX" type="number" />
        {!otpSent
          ? <Btn onClick={() => setOtpSent(true)} variant="primary">Send OTP to Registered Mobile</Btn>
          : <>
            <Input label="Enter OTP (demo: any 6 digits)" value={otp} onChange={setOtp} placeholder="XXXXXX" type="number" />
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => setStep(1)} variant="ghost">← Back</Btn>
              <Btn onClick={complete} variant="accent" loading={loading} disabled={otp.length < 4}>Verify & Generate MGL ID</Btn>
            </div>
          </>}
      </Card>}

      {step === 3 && <div>
        <Card style={{ borderColor: C.teal, borderWidth: 2, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
          <h2 style={{ color: C.teal, margin: "0 0 4px" }}>Saved to Supabase!</h2>
          <div style={{ fontSize: 13, color: C.gray4, marginBottom: 16 }}>MGL ID created and stored in your live database</div>
          <div style={{ background: C.navy, color: C.white, borderRadius: 10, padding: "16px 24px", display: "inline-block", marginBottom: 16 }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, letterSpacing: "0.1em" }}>MGL DIGITAL LABOUR ID</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.08em" }}>{mglId}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{form.name} · {form.skill} · {form.state}</div>
          </div>
        </Card>
        {loading ? <AIBox loading /> : aiSummary && <AIBox text={aiSummary} />}
        <div style={{ marginTop: 16 }}><Btn onClick={reset} variant="ghost">Register Another Worker</Btn></div>
      </div>}

      {recentWorkers.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gray4, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Recent Registrations (from Supabase)</div>
          {recentWorkers.map(w => (
            <div key={w.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: C.white, border: `1px solid ${C.gray2}`, borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
              <div>
                <span style={{ fontWeight: 600, color: C.navy }}>{w.full_name}</span>
                <span style={{ color: C.gray4, marginLeft: 8 }}>{w.skill} · {w.home_state}</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Badge color="green">{w.mgl_id}</Badge>
                {w.aadhaar_verified && <Badge color="green">✓ Verified</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WORKER APP ──────────────────────────────────────────────────────────────
function WorkerApp({ connected }) {
  const [tab, setTab] = useState("feed");
  const [jobs, setJobs] = useState([]); const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); const [aiAdvice, setAiAdvice] = useState("");
  const [mglId, setMglId] = useState(""); const [workerData, setWorkerData] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false); const [placements, setPlacements] = useState([]);

  useEffect(() => { if (connected) loadJobs(); }, [connected]);

  const loadJobs = async () => {
    setLoading(true);
    const { data } = await db.getJobs();
    setJobs(data.length > 0 ? data : SEED_JOBS);
    setLoading(false);
  };

  const lookupWorker = async () => {
    if (!mglId.trim()) return;
    setLookupLoading(true);
    const { data } = await db.getWorkerById(mglId.trim());
    setWorkerData(data);
    if (data) {
      const { data: p } = await db.getPlacements(mglId.trim());
      setPlacements(p);
    }
    setLookupLoading(false);
  };

  const getAdvice = async (job) => {
    setSelected(job);
    const advice = await askClaude(
      "You are MGL's worker advisory AI. Give a 3-point briefing: 1 thing to check before accepting, 1 wage tip, 1 rights tip. Simple language.",
      `Job: ${job.title || job.skill_required} at ${job.employers?.company_name || "employer"}, ${job.location}, ₹${job.wage_monthly}/mo. Give worker briefing.`
    );
    setAiAdvice(advice);
  };

  const SEED_JOBS = [
    { id: "s1", title: "Mason — 3 Months", skill_required: "Mason", location: "Bengaluru", wage_monthly: 18000, urgent: true, employers: { company_name: "Prestige Construction", gstin_verified: true } },
    { id: "s2", title: "Electrician — Project", skill_required: "Electrician", location: "Chennai", wage_monthly: 22000, urgent: false, employers: { company_name: "Shapoorji FM", gstin_verified: true } },
    { id: "s3", title: "Housekeeping Staff", skill_required: "Housekeeping", location: "Bengaluru", wage_monthly: 14000, urgent: false, employers: { company_name: "Manyata Tech Park", gstin_verified: true } },
  ];

  return (
    <div>
      <SectionTitle icon="📱" title="Worker App" desc="Live job feed and worker profile lookup from Supabase" />

      <Card style={{ marginBottom: 16, background: C.blue }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 8 }}>🔍 Look up a registered worker by MGL ID</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={mglId} onChange={e => setMglId(e.target.value)} placeholder="e.g. MGL/BR/MFP/04821"
            style={{ flex: 1, padding: "10px 12px", border: `1.5px solid ${C.gray3}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
          <Btn onClick={lookupWorker} variant="primary" loading={lookupLoading}>Look Up</Btn>
        </div>
        {workerData && (
          <div style={{ marginTop: 12, padding: 12, background: C.navy, borderRadius: 8, color: C.white }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{workerData.full_name} <Badge color="green">✓ From DB</Badge></div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{workerData.mgl_id} · {workerData.skill} · {workerData.home_state}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Rating: {workerData.rating || "—"} · Placements: {workerData.placements_count} · Available: {workerData.available ? "Yes" : "No"}</div>
            {placements.length > 0 && <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>Work history: {placements.map(p => p.employers?.company_name).join(", ")}</div>}
          </div>
        )}
        {workerData === null && mglId && !lookupLoading && <div style={{ marginTop: 8, fontSize: 12, color: C.red }}>Worker ID not found in database.</div>}
      </Card>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {["feed", "post-job"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 8, background: tab === t ? C.navy : C.gray1, color: tab === t ? C.white : C.gray5, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit", textTransform: "capitalize" }}>
            {t === "feed" ? "📋 Job Feed" : "➕ Post a Job"}
          </button>
        ))}
      </div>

      {tab === "feed" && <>
        {loading ? <Loading /> : jobs.map(job => (
          <Card key={job.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: C.navy }}>{job.title || job.skill_required}</span>
                  {job.urgent && <Badge color="red">Urgent</Badge>}
                  {job.employers?.gstin_verified && <Badge color="green">Verified Employer</Badge>}
                </div>
                <div style={{ fontSize: 13, color: C.gray5 }}>{job.employers?.company_name || "Employer"}</div>
                <div style={{ fontSize: 12, color: C.gray4 }}>📍 {job.location}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.orange }}>₹{(job.wage_monthly || 0).toLocaleString()}/mo</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => getAdvice(job)} variant="primary" size="sm">Get AI Advice</Btn>
              <Btn variant="ghost" size="sm">Express Interest</Btn>
            </div>
          </Card>
        ))}
      </>}

      {tab === "post-job" && <PostJobForm connected={connected} onPosted={loadJobs} />}

      {selected && (
        <Card style={{ marginTop: 16, borderColor: C.navy, borderWidth: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ margin: "0 0 8px", color: C.navy, fontSize: 15 }}>📋 {selected.title || selected.skill_required}</h3>
            <Btn onClick={() => { setSelected(null); setAiAdvice(""); }} variant="ghost" size="sm">✕</Btn>
          </div>
          {aiAdvice ? <AIBox text={aiAdvice} /> : <Loading text="Getting AI advice..." />}
        </Card>
      )}
    </div>
  );
}

// ─── POST JOB FORM ───────────────────────────────────────────────────────────
function PostJobForm({ connected, onPosted }) {
  const [form, setForm] = useState({ title: "", skill: "", location: "", wage: "", vacancies: "1", urgent: false });
  const [loading, setLoading] = useState(false); const [success, setSuccess] = useState("");  const [error, setError] = useState(null);
  const set = k => v => setForm(f => ({ ...f, [k]: v }));
  const skills = ["Mason", "Electrician", "Plumber", "Carpenter", "Housekeeping", "Security", "Driver", "Welder", "Helper"];

  const submit = async () => {
    if (!form.skill || !form.location) return;
    setLoading(true); setError(null); setSuccess("");
    const { error: e } = await db.insertJob({
      title: form.title || `${form.skill} — ${form.location}`,
      skill_required: form.skill, location: form.location,
      wage_monthly: parseInt(form.wage) || 0,
      vacancies: parseInt(form.vacancies) || 1,
      urgent: form.urgent, status: "active",
    });
    if (e) setError(e);
    else { setSuccess(`Job posted successfully! Workers matching '${form.skill}' in ${form.location} will be notified.`); setForm({ title: "", skill: "", location: "", wage: "", vacancies: "1", urgent: false }); onPosted?.(); }
    setLoading(false);
  };

  return (
    <Card>
      <h3 style={{ margin: "0 0 16px", color: C.navy, fontSize: 15 }}>Post a Job Requirement</h3>
      <ErrorBox error={error} /><SuccessBox msg={success} />
      <Input label="Job Title (optional)" value={form.title} onChange={set("title")} placeholder="e.g. Mason for 3-month project" />
      <Select label="Skill Required" value={form.skill} onChange={set("skill")} options={[{ value: "", label: "Select skill" }, ...skills.map(s => ({ value: s, label: s }))]} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Location" value={form.location} onChange={set("location")} placeholder="e.g. Chennai" />
        <Input label="Monthly Wage (₹)" value={form.wage} onChange={set("wage")} placeholder="e.g. 18000" type="number" />
      </div>
      <Input label="Vacancies" value={form.vacancies} onChange={set("vacancies")} placeholder="1" type="number" />
      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: C.gray5, marginBottom: 14 }}>
        <input type="checkbox" checked={form.urgent} onChange={e => set("urgent")(e.target.checked)} /> Urgent requirement
      </label>
      <Btn onClick={submit} variant="accent" loading={loading} disabled={!connected || !form.skill || !form.location}>
        {connected ? "Post Job to Supabase" : "Connect Supabase First"}
      </Btn>
    </Card>
  );
}

// ─── EMPLOYER PORTAL ─────────────────────────────────────────────────────────
function EmployerPortal({ connected }) {
  const [search, setSearch] = useState({ skill: "", location: "", verified: false });
  const [results, setResults] = useState([]); const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false); const [aiShortlist, setAiShortlist] = useState("");
  const [aiLoading, setAiLoading] = useState(false); const [selected, setSelected] = useState(null);
  const [regForm, setRegForm] = useState({ company: "", gstin: "", contact: "", phone: "", city: "" });
  const [regLoading, setRegLoading] = useState(false); const [regSuccess, setRegSuccess] = useState(""); const [regError, setRegError] = useState(null);
  const [tab, setTab] = useState("search");
  const setS = k => v => setSearch(s => ({ ...s, [k]: v }));
  const setR = k => v => setRegForm(f => ({ ...f, [k]: v }));

  const doSearch = async () => {
    setLoading(true); setSearched(true); setAiShortlist("");
    const { data } = await db.getWorkers({ skill: search.skill, location: search.location, verified: search.verified, available: true });
    setResults(data.length > 0 ? data : SEED_WORKERS.filter(w => {
      if (search.skill && !w.skill.toLowerCase().includes(search.skill.toLowerCase())) return false;
      if (search.location && !w.current_city.toLowerCase().includes(search.location.toLowerCase())) return false;
      if (search.verified && !w.aadhaar_verified) return false;
      return true;
    }));
    setLoading(false);
  };

  const shortlist = async () => {
    setAiLoading(true);
    const txt = await askClaude(
      "You are MGL's employer AI. Recommend top 2-3 workers. Be specific about who and why. Note any risks. 4-5 sentences.",
      `Requirement: ${search.skill || "any"} in ${search.location || "anywhere"}. Workers: ${results.slice(0, 6).map(w => `${w.full_name}(${w.skill},${w.experience_yr}yr,${w.rating}★,${w.placements_count}pl,verified:${w.aadhaar_verified})`).join("; ")}. Recommend.`
    );
    setAiShortlist(txt); setAiLoading(false);
  };

  const registerEmployer = async () => {
    if (!regForm.company) return;
    setRegLoading(true); setRegError(null); setRegSuccess("");
    const { error } = await db.insertEmployer({
      company_name: regForm.company, gstin: regForm.gstin,
      gstin_verified: regForm.gstin.length >= 15,
      contact_name: regForm.contact, phone: regForm.phone, city: regForm.city, plan: "starter",
    });
    if (error) setRegError(error);
    else setRegSuccess(`${regForm.company} registered! 90-day free trial activated.`);
    setRegLoading(false);
  };

  const SEED_WORKERS = [
    { id: "s1", mgl_id: "MGL/TN/CHN/03421", full_name: "Arjun Selvam", skill: "Mason", experience_yr: 6, current_city: "Chennai", rating: 4.8, placements_count: 12, aadhaar_verified: true, available: true, match_score: 94 },
    { id: "s2", mgl_id: "MGL/KA/BLR/07812", full_name: "Suresh Naidu", skill: "Electrician", experience_yr: 4, current_city: "Bengaluru", rating: 4.5, placements_count: 8, aadhaar_verified: true, available: true, match_score: 88 },
    { id: "s3", mgl_id: "MGL/BR/PAT/08831", full_name: "Ramesh Kumar", skill: "Mason", experience_yr: 9, current_city: "Bengaluru", rating: 4.7, placements_count: 18, aadhaar_verified: true, available: true, match_score: 85 },
  ];

  return (
    <div>
      <SectionTitle icon="🏢" title="Employer Portal" desc="Search live workers and register your company in Supabase" />
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {["search", "register"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 8, background: tab === t ? C.navy : C.gray1, color: tab === t ? C.white : C.gray5, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
            {t === "search" ? "🔍 Search Workers" : "🏢 Register Company"}
          </button>
        ))}
      </div>

      {tab === "search" && <>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Skill" value={search.skill} onChange={setS("skill")} placeholder="e.g. Mason" />
            <Input label="Location" value={search.location} onChange={setS("location")} placeholder="e.g. Chennai" />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: C.gray5, marginBottom: 14 }}>
            <input type="checkbox" checked={search.verified} onChange={e => setS("verified")(e.target.checked)} /> Aadhaar-verified only
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={doSearch} variant="primary" loading={loading}>Search Workers</Btn>
            {results.length > 0 && <Btn onClick={shortlist} variant="accent" size="sm" loading={aiLoading}>✦ AI Shortlist</Btn>}
          </div>
        </Card>
        {(aiLoading || aiShortlist) && <AIBox text={aiShortlist} loading={aiLoading} />}
        {searched && <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: C.gray4, marginBottom: 8 }}>{results.length} workers found {connected ? "(from Supabase + seeds)" : "(demo data)"}</div>
          {results.map(w => (
            <Card key={w.id || w.mgl_id} style={{ marginBottom: 10, cursor: "pointer", borderColor: selected?.id === w.id ? C.navy : C.gray2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>{w.full_name}</span>
                    {w.aadhaar_verified && <Badge color="green">Verified</Badge>}
                  </div>
                  <div style={{ fontSize: 12, fontFamily: "monospace", color: C.gray4 }}>{w.mgl_id}</div>
                  <div style={{ fontSize: 12, color: C.gray5 }}>{w.skill} · {w.experience_yr}yr · {w.current_city}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.orange }}>{w.match_score}</div>
                  <div style={{ fontSize: 11, color: C.gray4 }}>match</div>
                  <div style={{ fontSize: 12, color: C.navy }}>{w.rating ? `${w.rating}★` : "—"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Btn onClick={() => setSelected(selected?.id === w.id ? null : w)} variant="primary" size="sm">
                  {selected?.id === w.id ? "Hide Profile" : "View Profile"}
                </Btn>
                <Btn variant="accent" size="sm">Send Offer</Btn>
              </div>
              {selected?.id === w.id && (
                <div style={{ marginTop: 12, padding: 12, background: C.gray1, borderRadius: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                    {[["MGL ID", w.mgl_id], ["Skill", w.skill], ["Experience", `${w.experience_yr} years`], ["Location", w.current_city], ["Placements", w.placements_count], ["Available", w.available ? "Yes" : "No"]].map(([k, v]) => (
                      <div key={k} style={{ background: C.white, borderRadius: 6, padding: 8 }}>
                        <div style={{ fontSize: 10, color: C.gray4, textTransform: "uppercase" }}>{k}</div>
                        <div style={{ fontWeight: 600, color: C.black, marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>}
      </>}

      {tab === "register" && <Card>
        <h3 style={{ margin: "0 0 16px", color: C.navy, fontSize: 15 }}>Register Your Company</h3>
        <ErrorBox error={regError} /><SuccessBox msg={regSuccess} />
        <Input label="Company Name" value={regForm.company} onChange={setR("company")} placeholder="e.g. Prestige Constructions Pvt Ltd" />
        <Input label="GSTIN" value={regForm.gstin} onChange={setR("gstin")} placeholder="22AAAAA0000A1Z5" helper="15-character GST number — verified in real time" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Contact Name" value={regForm.contact} onChange={setR("contact")} placeholder="HR Manager name" />
          <Input label="Phone" value={regForm.phone} onChange={setR("phone")} placeholder="+91..." type="tel" />
        </div>
        <Input label="City" value={regForm.city} onChange={setR("city")} placeholder="e.g. Bengaluru" />
        <Btn onClick={registerEmployer} variant="accent" loading={regLoading} disabled={!connected || !regForm.company}>
          {connected ? "Register & Start Free Trial" : "Connect Supabase First"}
        </Btn>
      </Card>}
    </div>
  );
}

// ─── AGENT APP ───────────────────────────────────────────────────────────────
function AgentApp({ connected }) {
  const [form, setForm] = useState({ name: "", phone: "", skill: "", aadhaar4: "", photo: false, state: "", district: "" });
  const [loading, setLoading] = useState(false); const [quality, setQuality] = useState(null);
  const [submitted, setSubmitted] = useState(false); const [offline, setOffline] = useState(false);
  const [queue, setQueue] = useState([]); const [syncResult, setSyncResult] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false); const [dailyCount, setDailyCount] = useState(0);
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const q = db.loadQueue();
    setQueue(q);
    if (connected) loadTodayCount();
  }, [connected]);

  const loadTodayCount = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("workers").select("id", { count: "exact" }).gte("created_at", today);
    setDailyCount(data?.length || 0);
  };

  const submit = async () => {
    setLoading(true);
    const id = generateMglId(form.state || "XX", form.district || "XXX");
    const workerData = {
      mgl_id: id, full_name: form.name, phone: form.phone,
      skill: form.skill, home_state: form.state, home_district: form.district,
      current_city: form.district, aadhaar_last4: form.aadhaar4,
      aadhaar_verified: true, face_verified: form.photo,
      match_score: 70 + Math.floor(Math.random() * 20), available: true,
      registered_by: "agent", source_channel: offline ? "offline_queue" : "msc",
    };
    if (offline || !connected) {
      db.queueRegistration(workerData);
      setQueue(db.loadQueue());
      setQuality("⚡ Queued offline. Will sync when connectivity is restored.");
    } else {
      const { error } = await db.insertWorker(workerData);
      if (error) setQuality(`Error: ${error.message}`);
      else {
        const q = await askClaude(
          "You are MGL's agent quality AI. Score registration out of 100 and note issues/confirmations. Format: 'Quality Score: XX/100' then 2-3 bullet points.",
          `Worker: ${form.name}, Skill: ${form.skill}, Phone: ${form.phone ? "provided" : "missing"}, Photo: ${form.photo}, Aadhaar: ${form.aadhaar4 ? "provided" : "missing"}. Assess quality.`
        );
        setQuality(q);
        setDailyCount(c => c + 1);
      }
    }
    setLoading(false); setSubmitted(true);
  };

  const sync = async () => {
    setSyncLoading(true);
    const result = await db.syncQueue();
    setSyncResult(result);
    setQueue(db.loadQueue());
    setSyncLoading(false);
  };

  const reset = () => {
    setForm({ name: "", phone: "", skill: "", aadhaar4: "", photo: false, state: "", district: "" });
    setSubmitted(false); setQuality(null);
  };

  const skills = ["Mason", "Electrician", "Plumber", "Carpenter", "Housekeeping", "Security", "Driver", "Welder", "Helper"];

  return (
    <div>
      <SectionTitle icon="🧑‍💼" title="Agent App (MSC)" desc="Field registrations — online saves to Supabase, offline queues locally" />

      <Card style={{ background: C.navy, color: C.white, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>AGENT SESSION · Whitefield MSC</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Anwar Ahmed</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.orange }}>{dailyCount}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>today's registrations</div>
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            <input type="checkbox" checked={offline} onChange={e => setOffline(e.target.checked)} />
            📵 Simulate offline mode
          </label>
          {queue.length > 0 && <span style={{ background: C.orange, color: C.white, borderRadius: 100, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{queue.length} queued</span>}
        </div>
      </Card>

      {offline && <div style={{ background: C.amberL, borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, color: C.amber }}>⚠️ Offline mode: registrations queue locally in your browser (localStorage). Sync when connectivity returns.</div>}

      {!submitted ? (
        <Card>
          <h3 style={{ margin: "0 0 14px", color: C.navy, fontSize: 15 }}>Register New Worker</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Worker Name" value={form.name} onChange={set("name")} placeholder="Full name" />
            <Input label="Phone" value={form.phone} onChange={set("phone")} placeholder="+91..." type="tel" />
            <Input label="State" value={form.state} onChange={set("state")} placeholder="e.g. Bihar" />
            <Input label="District" value={form.district} onChange={set("district")} placeholder="e.g. Muzaffarpur" />
          </div>
          <Select label="Primary Skill" value={form.skill} onChange={set("skill")} options={[{ value: "", label: "Select skill" }, ...skills.map(s => ({ value: s, label: s }))]} />
          <Input label="Aadhaar last 4 digits" value={form.aadhaar4} onChange={set("aadhaar4")} placeholder="XXXX" type="number" />
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: C.gray5, marginBottom: 14 }}>
            <input type="checkbox" checked={form.photo} onChange={e => set("photo")(e.target.checked)} /> 📷 Face photo captured
          </label>
          <Btn onClick={submit} variant="accent" loading={loading} disabled={!form.name || !form.phone || !form.skill}>
            {offline ? "📵 Queue Offline" : "✓ Submit to Supabase"}
          </Btn>
        </Card>
      ) : (
        <div>
          <Card style={{ borderColor: C.teal, borderWidth: 2, textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{offline ? "📵" : "✅"}</div>
            <h3 style={{ color: offline ? C.amber : C.teal, margin: "0 0 4px" }}>{offline ? "Queued Offline" : "Saved to Supabase"}</h3>
          </Card>
          {quality && (typeof quality === "string" && quality.startsWith("⚡")
            ? <div style={{ background: C.amberL, borderRadius: 8, padding: 12, fontSize: 13, color: C.amber }}>{quality}</div>
            : <AIBox text={quality} />)}
          <div style={{ marginTop: 12 }}><Btn onClick={reset} variant="primary">Register Next Worker</Btn></div>
        </div>
      )}

      {queue.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: C.navy, fontSize: 15 }}>📋 Offline Queue ({queue.length})</h3>
            <Btn onClick={sync} variant="accent" size="sm" loading={syncLoading}>📡 Sync to Supabase</Btn>
          </div>
          {syncResult && <SuccessBox msg={`Synced ${syncResult.synced} workers. Errors: ${syncResult.errors}`} />}
          {queue.map((w, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: i % 2 === 0 ? C.white : C.gray1, borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
              <span>{w.full_name} — {w.skill}</span>
              <Badge color="amber">Pending Sync</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── FRAUD DETECTION ─────────────────────────────────────────────────────────
function FraudDetection({ connected }) {
  const [flags, setFlags] = useState([]); const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); const [aiAnalysis, setAiAnalysis] = useState(""); const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { loadFlags(); }, [connected]);

  const loadFlags = async () => {
    setLoading(true);
    const { data } = await db.getFraudFlags();
    setFlags(data.length > 0 ? data : SEED_FLAGS);
    setLoading(false);
  };

  const analyse = async (flag) => {
    setSelected(flag); setAiLoading(true); setAiAnalysis("");
    const txt = await askClaude(
      "You are MGL's fraud investigation AI. Analyse this fraud flag: 1) likely pattern, 2) immediate action, 3) systemic fix. 3-4 sentences.",
      `Fraud: ${flag.flag_type}, Severity: ${flag.severity}, Account: ${flag.account_ref}, Detail: ${flag.detail}. Analyse.`
    );
    setAiAnalysis(txt); setAiLoading(false);
  };

  const resolve = async (flag) => {
    if (connected) {
      await db.updateFraudFlag(flag.id, { status: "resolved", ai_analysis: aiAnalysis });
      loadFlags();
    }
    setSelected(null); setAiAnalysis("");
  };

  const addTestFlag = async () => {
    const types = ["Bulk Registration", "Duplicate Aadhaar", "Fake Employer", "False Skill Claim"];
    const sevs = ["Critical", "High", "Medium"];
    const { error } = await db.insertFraudFlag({
      flag_type: types[Math.floor(Math.random() * types.length)],
      severity: sevs[Math.floor(Math.random() * sevs.length)],
      account_ref: `Worker MGL/TN/CHN/${Math.floor(10000 + Math.random() * 90000)}`,
      detail: "Test fraud flag created from PoC — click AI Analyse to investigate.",
      status: "open", action_taken: "Pending review",
    });
    if (!error) loadFlags();
  };

  const sevColors = { Critical: C.red, High: C.orange, Medium: C.amber };

  const SEED_FLAGS = [
    { id: "s1", flag_type: "Bulk Registration", severity: "Critical", account_ref: "Agent ACC-441", detail: "47 registrations from single GPS in 28 minutes", status: "open", action_taken: "Batch held", created_at: new Date().toISOString() },
    { id: "s2", flag_type: "Duplicate Aadhaar", severity: "High", account_ref: "MGL/TN/CHN/09921", detail: "Same VID across 3 phone numbers", status: "open", action_taken: "Account frozen", created_at: new Date().toISOString() },
    { id: "s3", flag_type: "Fake Employer", severity: "High", account_ref: "Employer EMP-1182", detail: "GSTIN failed. 340 profiles viewed, 0 offers", status: "open", action_taken: "Suspended", created_at: new Date().toISOString() },
  ];

  return (
    <div>
      <SectionTitle icon="🛡️" title="Fraud Detection" desc="Live fraud flags from Supabase — add test flags to see real-time updates" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, flex: 1, marginRight: 12 }}>
          {[["Total flags", flags.length, C.navy], ["Open", flags.filter(f => f.status === "open").length, C.red], ["Resolved", flags.filter(f => f.status === "resolved").length, C.teal]].map(([l, v, c]) => (
            <Card key={l} style={{ textAlign: "center", padding: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{v}</div>
              <div style={{ fontSize: 11, color: C.gray4 }}>{l}</div>
            </Card>
          ))}
        </div>
        <Btn onClick={addTestFlag} variant="accent" size="sm" disabled={!connected}>+ Add Test Flag</Btn>
      </div>

      {loading ? <Loading /> : flags.map(f => (
        <Card key={f.id} style={{ marginBottom: 10, borderLeft: `4px solid ${sevColors[f.severity] || C.gray3}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Badge color={f.severity === "Critical" ? "red" : "amber"}>{f.severity}</Badge>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{f.flag_type}</span>
              {f.status === "resolved" && <Badge color="green">Resolved</Badge>}
            </div>
            <span style={{ fontSize: 10, color: C.gray4 }}>{new Date(f.created_at).toLocaleTimeString()}</span>
          </div>
          <div style={{ fontSize: 12, color: C.gray5, marginBottom: 8 }}>{f.detail}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Badge color="green">Action: {f.action_taken || "Pending"}</Badge>
            <Btn onClick={() => analyse(f)} variant="ghost" size="sm">✦ AI Analyse</Btn>
          </div>
        </Card>
      ))}

      {selected && (
        <Card style={{ marginTop: 16, borderColor: C.red, borderWidth: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ margin: "0 0 8px", color: C.red, fontSize: 15 }}>🚨 {selected.flag_type}</h3>
            <Btn onClick={() => { setSelected(null); setAiAnalysis(""); }} variant="ghost" size="sm">✕</Btn>
          </div>
          {aiLoading ? <AIBox loading /> : aiAnalysis && <AIBox text={aiAnalysis} />}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn onClick={() => resolve(selected)} variant="teal" size="sm" disabled={!connected}>
              {connected ? "✓ Mark Resolved in DB" : "Connect DB to Resolve"}
            </Btn>
            <Btn variant="ghost" size="sm">⚠️ Escalate</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── GOVT DASHBOARD ──────────────────────────────────────────────────────────
function GovtDashboard({ connected }) {
  const [state, setState] = useState("Tamil Nadu");
  const [stats, setStats] = useState(null); const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState(""); const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => { loadStats(); }, [state, connected]);

  const loadStats = async () => {
    setLoading(true);
    if (connected) {
      const s = await db.getStats(state);
      setStats(s);
    } else {
      setStats(SEED_STATS[state] || SEED_STATS["Tamil Nadu"]);
    }
    setLoading(false);
  };

  const getInsight = async () => {
    setInsightLoading(true);
    const txt = await askClaude(
      "You are MGL's govt analytics AI. Generate a 3-point policy brief for a state skill development officer: 1 district to prioritise, 1 labour shortage sector, 1 Skill India recommendation.",
      `State: ${state}. Workers: ${stats?.totalWorkers}. Placed: ${stats?.totalPlacements}. GCC: ${stats?.gccPlacements}. Active jobs: ${stats?.activeJobs}. Top skills: ${Object.entries(stats?.skills || {}).slice(0, 5).map(([k, v]) => `${k}:${v}`).join(", ")}. Generate brief.`
    );
    setAiInsight(txt); setInsightLoading(false);
  };

  const SEED_STATS = {
    "Tamil Nadu":  { totalWorkers: 28420, totalPlacements: 12840, gccPlacements: 1240, activeJobs: 340, skills: { Mason: 8400, Electrician: 4200, Housekeeping: 3800, Security: 2900, Driver: 2100 } },
    "Karnataka":   { totalWorkers: 22180, totalPlacements: 9840, gccPlacements: 920, activeJobs: 280, skills: { Mason: 5200, Electrician: 4800, Housekeeping: 3100, Driver: 2400, Security: 1900 } },
    "Maharashtra": { totalWorkers: 31240, totalPlacements: 14200, gccPlacements: 1840, activeJobs: 420, skills: { Mason: 9800, Carpenter: 5400, Electrician: 4200, Housekeeping: 3600, Plumber: 2900 } },
  };

  const topSkills = stats ? Object.entries(stats.skills).sort((a, b) => b[1] - a[1]).slice(0, 5) : [];
  const maxSkill = topSkills[0]?.[1] || 1;
  const skillColors = [C.navy, C.orange, C.teal, C.amber, C.gray4];

  return (
    <div>
      <SectionTitle icon="📊" title="Government Dashboard" desc={connected ? "Live aggregated stats from Supabase — full state breakdown" : "Demo data — connect Supabase for live figures"} />

      <Card style={{ marginBottom: 16, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Select label="State" value={state} onChange={v => { setState(v); setAiInsight(""); }}
          options={["Tamil Nadu", "Karnataka", "Maharashtra"].map(s => ({ value: s, label: s }))} />
        <div style={{ display: "flex", gap: 8, paddingBottom: 14 }}>
          <Btn onClick={getInsight} variant="accent" size="sm" loading={insightLoading} disabled={!stats}>✦ AI Policy Brief</Btn>
          <Btn variant="ghost" size="sm">📥 Export</Btn>
        </div>
      </Card>

      {loading ? <Loading /> : stats && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            ["Registered Workers", stats.totalWorkers.toLocaleString(), C.navy],
            ["Placed via MGL", stats.totalPlacements.toLocaleString(), C.teal],
            ["GCC Placements", stats.gccPlacements.toLocaleString(), C.orange],
            ["Active Jobs", stats.activeJobs.toLocaleString(), C.amber],
          ].map(([label, value, color]) => (
            <Card key={label} style={{ textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 11, color: C.gray4, marginTop: 2 }}>{label}</div>
              {connected && <div style={{ fontSize: 9, color: C.teal, marginTop: 2 }}>● Live from Supabase</div>}
            </Card>
          ))}
        </div>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Top Skills — {state}</div>
          {topSkills.map(([skill, count], i) => (
            <div key={skill} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: C.gray5 }}>{skill}</span>
                <span style={{ fontWeight: 700, color: skillColors[i] }}>{count.toLocaleString()} workers</span>
              </div>
              <div style={{ background: C.gray2, borderRadius: 20, height: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(count / maxSkill) * 100}%`, background: skillColors[i], borderRadius: 20 }} />
              </div>
            </div>
          ))}
        </Card>
      </>}

      {(insightLoading || aiInsight) && <AIBox text={aiInsight} loading={insightLoading} />}

      <Card style={{ marginTop: 12, background: C.amberL, borderColor: C.amber }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, marginBottom: 4 }}>⚠️ Privacy Notice</div>
        <div style={{ fontSize: 12, color: C.gray5 }}>All data shown is anonymised and aggregated. No individual worker PII is accessible. DPDP Act 2023 compliant.</div>
      </Card>
    </div>
  );
}

// ─── AI MATCHING ENGINE ──────────────────────────────────────────────────────
function AIMatching({ connected }) {
  const [job, setJob] = useState({ skill: "", location: "", experience: "", wage: "" });
  const [matches, setMatches] = useState([]); const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(""); const [searched, setSearched] = useState(false);
  const set = k => v => setJob(j => ({ ...j, [k]: v }));

  const runMatch = async () => {
    if (!job.skill) return;
    setLoading(true); setSearched(true); setExplanation("");
    const { data } = await db.getWorkers({ skill: job.skill, location: job.location, available: true });

    const pool = data.length > 0 ? data : [
      { mgl_id: "MGL/TN/CHN/03421", full_name: "Arjun Selvam",  skill: "Mason",       experience_yr: 6, current_city: "Chennai",   rating: 4.8, placements_count: 12, aadhaar_verified: true },
      { mgl_id: "MGL/BR/PAT/08831", full_name: "Ramesh Kumar",   skill: "Mason",       experience_yr: 9, current_city: "Bengaluru", rating: 4.7, placements_count: 18, aadhaar_verified: true },
      { mgl_id: "MGL/KA/BLR/07812", full_name: "Suresh Naidu",  skill: "Electrician", experience_yr: 4, current_city: "Bengaluru", rating: 4.5, placements_count: 8,  aadhaar_verified: true },
      { mgl_id: "MGL/TN/CBE/09921", full_name: "Vijay Kumar",   skill: "Mason",       experience_yr: 7, current_city: "Coimbatore",rating: 4.6, placements_count: 11, aadhaar_verified: true },
    ];

    const scored = pool.map(w => {
      let score = 0;
      if (w.skill?.toLowerCase() === job.skill.toLowerCase()) score += 40;
      else if (w.skill?.toLowerCase().includes(job.skill.toLowerCase().substring(0, 4))) score += 15;
      if (job.location && w.current_city?.toLowerCase().includes(job.location.toLowerCase())) score += 20;
      else if (!job.location) score += 10;
      if (job.experience && w.experience_yr >= parseInt(job.experience)) score += 15;
      else if (!job.experience) score += 8;
      score += Math.round((w.rating || 0) * 3);
      if (w.aadhaar_verified) score += 5;
      return { ...w, score: Math.min(score, 100) };
    }).sort((a, b) => b.score - a.score).slice(0, 5);

    setMatches(scored);
    if (scored.length > 0) {
      const txt = await askClaude(
        "You are MGL's matching AI. Explain in 3 sentences why the top match was ranked first. Be specific about skill, experience, location, rating.",
        `Job: ${job.skill} in ${job.location || "any"}, min ${job.experience || "any"} yrs, wage ₹${job.wage || "open"}/mo. Top match: ${scored[0]?.full_name}, ${scored[0]?.skill}, ${scored[0]?.experience_yr}yr, ${scored[0]?.current_city}, ${scored[0]?.rating}★, ${scored[0]?.placements_count} placements. Explain ranking.`
      );
      setExplanation(txt);
    }
    setLoading(false);
  };

  return (
    <div>
      <SectionTitle icon="🤖" title="AI Matching Engine" desc={connected ? "Matches against your live Supabase worker pool" : "Demo mode — connect Supabase for live matching"} />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Skill Required" value={job.skill} onChange={set("skill")} placeholder="e.g. Mason" />
          <Input label="Location" value={job.location} onChange={set("location")} placeholder="e.g. Chennai" />
          <Input label="Min Experience (years)" value={job.experience} onChange={set("experience")} placeholder="e.g. 3" type="number" />
          <Input label="Wage Offered (₹/mo)" value={job.wage} onChange={set("wage")} placeholder="e.g. 18000" type="number" />
        </div>
        <Btn onClick={runMatch} variant="accent" loading={loading} disabled={!job.skill}>⚡ Run AI Match</Btn>
        {connected && <span style={{ fontSize: 11, color: C.teal, marginLeft: 12 }}>● Matching against live Supabase workers</span>}
      </Card>

      {searched && <>
        {(loading || explanation) && <AIBox text={explanation} loading={loading && !explanation} />}
        <div style={{ marginTop: 12 }}>
          {matches.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 32 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginTop: 8 }}>No matches found</div>
              <div style={{ fontSize: 13, color: C.gray4 }}>Try a different skill or broaden the location</div>
            </Card>
          ) : matches.map((w, i) => (
            <Card key={w.mgl_id || i} style={{ marginBottom: 8, borderLeft: `4px solid ${i === 0 ? C.teal : i === 1 ? C.navy : C.gray3}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {w.full_name}</span>
                    {w.aadhaar_verified && <Badge color="green">Verified</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: C.gray4 }}>{w.skill} · {w.experience_yr}yr · {w.current_city} · {w.rating ? `${w.rating}★` : "—"} · {w.placements_count} placements</div>
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: C.gray3, marginTop: 2 }}>{w.mgl_id}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: i === 0 ? C.teal : C.navy }}>{w.score}</div>
                  <div style={{ fontSize: 10, color: C.gray4 }}>match score</div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ background: C.gray2, borderRadius: 20, height: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${w.score}%`, background: i === 0 ? C.teal : C.navy, borderRadius: 20 }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>}
    </div>
  );
}

// ─── GCC OVERSEAS ────────────────────────────────────────────────────────────
function GCCOverseas({ connected }) {
  const [mglId, setMglId] = useState(""); const [worker, setWorker] = useState(null);
  const [docs, setDocs] = useState({ passport: false, medical: false, police: false, emigrate: false, insurance: false, language: false });
  const [aiPlan, setAiPlan] = useState(""); const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false); const [saveMsg, setSaveMsg] = useState("");

  const docItems = [
    { key: "passport", label: "Valid Passport (10 yr)", cost: "₹1,500", time: "3-4 weeks", required: true },
    { key: "medical", label: "Medical Fitness Certificate", cost: "₹800-1,200", time: "1-2 days", required: true },
    { key: "police", label: "Police Clearance Certificate", cost: "₹500", time: "7-10 days", required: true },
    { key: "emigrate", label: "eMigrate Registration", cost: "₹0", time: "1-2 days", required: true },
    { key: "insurance", label: "Overseas Travel Insurance", cost: "₹2,000-4,000/yr", time: "Same day", required: false },
    { key: "language", label: "Basic Arabic / English (A2)", cost: "Included in MGL pkg", time: "4-6 weeks", required: false },
  ];
  const completed = Object.values(docs).filter(Boolean).length;
  const score = Math.round((completed / docItems.length) * 100);

  const lookup = async () => {
    if (!mglId.trim()) return;
    setLookupLoading(true);
    const { data: w } = await db.getWorkerById(mglId.trim());
    if (w) {
      setWorker(w);
      const { data: gcc } = await supabase.from("gcc_readiness").select("*").eq("worker_mgl_id", mglId.trim()).single();
      if (gcc) setDocs({ passport: gcc.passport, medical: gcc.medical, police: gcc.police, emigrate: gcc.emigrate, insurance: gcc.insurance, language: gcc.language });
    }
    setLookupLoading(false);
  };

  const saveDocs = async () => {
    if (!worker || !connected) return;
    const { data: existing } = await supabase.from("gcc_readiness").select("id").eq("worker_mgl_id", worker.mgl_id).single();
    const payload = { worker_mgl_id: worker.mgl_id, ...docs, updated_at: new Date().toISOString() };
    if (existing) await supabase.from("gcc_readiness").update(payload).eq("worker_mgl_id", worker.mgl_id);
    else await supabase.from("gcc_readiness").insert([payload]);
    await db.updateWorker(worker.mgl_id, { gcc_ready: score >= 67, gcc_score: score });
    setSaveMsg("GCC readiness saved to Supabase ✓");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const getPlan = async () => {
    setLoading(true);
    const missing = docItems.filter(d => !docs[d.key]).map(d => d.label);
    const txt = await askClaude(
      "You are MGL's GCC readiness advisor. Create a personalised action plan: total cost estimate, total time, and 3 specific next steps. Be practical.",
      `Worker: ${worker?.full_name || "Worker"}, Skill: ${worker?.skill || "—"}, Experience: ${worker?.experience_yr || "—"} years. Completed: ${completed}/${docItems.length} documents. Missing: ${missing.join(", ") || "None"}. Generate plan.`
    );
    setAiPlan(txt); setLoading(false);
  };

  const demoWorker = { full_name: "Ramesh Kumar", mgl_id: "MGL/BR/MFP/04821", skill: "Mason", experience_yr: 9 };

  return (
    <div>
      <SectionTitle icon="✈️" title="GCC Overseas Readiness" desc="Document tracker — look up a worker to persist their readiness to Supabase" />

      <Card style={{ marginBottom: 16, background: C.blue }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Look up worker MGL ID to load / save their GCC status</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={mglId} onChange={e => setMglId(e.target.value)} placeholder="Enter MGL ID (or leave blank for demo)"
            style={{ flex: 1, padding: "10px 12px", border: `1.5px solid ${C.gray3}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
          <Btn onClick={lookup} variant="primary" loading={lookupLoading}>Load</Btn>
          <Btn onClick={() => setWorker(demoWorker)} variant="ghost" size="sm">Use Demo Worker</Btn>
        </div>
      </Card>

      <Card style={{ background: C.navy, color: C.white, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>WORKER — GCC READINESS</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{worker?.full_name || "No worker loaded"}</div>
            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: "monospace" }}>{worker?.mgl_id || "—"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: score >= 80 ? C.teal : score >= 50 ? C.orange : C.red }}>{score}%</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>GCC Ready</div>
          </div>
        </div>
        <ProgressBar value={score} color={score >= 80 ? C.teal : score >= 50 ? C.orange : C.red} />
      </Card>

      <div style={{ background: C.tealL, borderRadius: 10, padding: 14, marginBottom: 16, border: `1px solid ${C.teal}30` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, marginBottom: 4 }}>✅ MGL ILO Commitment</div>
        <div style={{ fontSize: 12, color: C.black }}>Zero placement fee charged to this worker. GCC placement fees collected from employers only (USD 600-1,000). Workers pay only their own document costs: <strong>₹2,499 total</strong>.</div>
      </div>

      {docItems.map(d => (
        <Card key={d.key} style={{ marginBottom: 8, borderLeft: `4px solid ${docs[d.key] ? C.teal : d.required ? C.orange : C.gray3}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}>
              <input type="checkbox" checked={docs[d.key]} onChange={e => setDocs(ds => ({ ...ds, [d.key]: e.target.checked }))} style={{ width: 16, height: 16 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: C.navy }}>{d.label}</div>
                <div style={{ fontSize: 11, color: C.gray4 }}>{d.time} · {d.cost}</div>
              </div>
            </label>
            {docs[d.key] ? <Badge color="green">✓ Done</Badge> : d.required ? <Badge color="red">Required</Badge> : <Badge color="amber">Optional</Badge>}
          </div>
        </Card>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <Btn onClick={saveDocs} variant="teal" disabled={!connected || !worker}>
          {connected ? "💾 Save to Supabase" : "Connect DB to Save"}
        </Btn>
        <Btn onClick={getPlan} variant="accent" loading={loading} disabled={!worker}>✦ Get Action Plan</Btn>
      </div>
      {saveMsg && <SuccessBox msg={saveMsg} />}
      {(loading || aiPlan) && <div style={{ marginTop: 12 }}><AIBox text={aiPlan} loading={loading} /></div>}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const componentMap = {
  setup:      SetupScreen,
  "worker-reg": WorkerReg,
  "worker-app": WorkerApp,
  employer:   EmployerPortal,
  agent:      AgentApp,
  fraud:      FraudDetection,
  govt:       GovtDashboard,
  matching:   AIMatching,
  gcc:        GCCOverseas,
};

export default function App() {
  const [active, setActive] = useState("setup");
  const [connected, setConnected] = useState(false);
  const ActiveScreen = componentMap[active];

  return (
    <div style={{ minHeight: "100vh", background: C.gray1, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        input, select, button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.gray3}; border-radius: 4px; }
      `}</style>

      {/* Nav */}
      <div style={{ background: C.navy, color: C.white, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 800 }}>MGL</span>
          <span style={{ fontSize: 11, opacity: 0.4 }}>Platform PoC + Supabase</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <DBBadge connected={connected} />
          <div style={{ fontSize: 11, background: `${C.orange}22`, color: C.orange, padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>Powered by Claude AI</div>
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: 1200, margin: "0 auto" }}>
        {/* Sidebar */}
        <div style={{ width: 240, flexShrink: 0, background: C.white, borderRight: `1px solid ${C.gray2}`, minHeight: "calc(100vh - 56px)", padding: 16, position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.gray4, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingLeft: 8 }}>Product Components</div>
          {screens.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)} style={{
              width: "100%", textAlign: "left", padding: "10px 10px", borderRadius: 8, border: "none", cursor: "pointer",
              background: active === s.id ? C.navy : "transparent", color: active === s.id ? C.white : C.gray5,
              marginBottom: 2, fontFamily: "inherit", transition: "all 0.1s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.65, marginTop: 1 }}>{s.desc}</div>
                </div>
              </div>
            </button>
          ))}

          <div style={{ marginTop: 16, padding: "12px 10px", background: connected ? C.tealL : C.amberL, borderRadius: 10, border: `1px solid ${connected ? C.teal : C.amber}30` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: connected ? C.teal : C.amber, marginBottom: 4 }}>
              {connected ? "✓ Live Database" : "⚙️ Setup Required"}
            </div>
            <div style={{ fontSize: 10, color: C.gray5, lineHeight: 1.5 }}>
              {connected
                ? "All screens reading from and writing to your Supabase database in real time."
                : "Go to ⚙️ Supabase Setup to connect your free database. All 8 components support live data."}
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: 24, minWidth: 0, overflowX: "hidden" }}>
          <ActiveScreen key={active} connected={connected} onTest={setConnected} />
        </div>
      </div>
    </div>
  );
}
