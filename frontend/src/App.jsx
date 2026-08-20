import { useState, useEffect, useCallback, useRef } from 'react';
import { api, getStoredUser, setToken, setStoredUser } from './api/client';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CommunityDemands from './components/CommunityDemands';
import Discussion from './components/Discussion';
import PassportHeader from './components/PassportHeader';
import TrustIndexPanel from './components/TrustIndexPanel';
import BudgetProgress from './components/BudgetProgress';
import MilestoneCard from './components/MilestoneCard';
import NewMilestoneForm from './components/NewMilestoneForm';
import NewProjectForm from './components/NewProjectForm';
import AuditTrail from './components/AuditTrail';
import ExportPdfButton from './components/ExportPdfButton';
import WhatsAppShareButton from './components/WhatsAppShareButton';
import UserProvisioningModal from './components/UserProvisioningModal';

function normalizeDetail(raw) {
  const { project, milestones, trustIndex, budget } = raw;
  return {
    project: {
      id: project.id,
      name: project.name,
      ward: project.ward,
      department: project.department,
      budgetTotal: project.budget_total,
      budgetSpent: budget.totalSpent || project.budget_spent || 0,
      contractor: project.contractor_name,
      contractorId: project.contractor_id,
      startDate: project.start_date,
      endDate: project.end_date,
    },
    milestones: (milestones || []).map((m) => ({
      id: m.id,
      title: m.title,
      progressPercent: m.progress_percent,
      budgetSpent: m.budget_spent,
      note: m.note,
      photoUrl: m.photo_url,
      submittedAt: m.submitted_at,
      status: m.status,
      engineerComment: m.engineer_comment,
      verifiedAt: m.verified_at,
      geoStatus: m.geo_status,
      geoDistanceKm: m.geo_distance_km,
      contentStatus: m.content_status,
      detectedLabels: m.detected_labels,
      autoFlagged: m.auto_flagged,
      flags: m.flags ? m.flags.map((f) => ({
        id: f.id,
        text: f.text,
        photoUrl: f.photo_url,
        flaggedAt: f.flagged_at,
        status: f.status || 'pending',
        resolutionNote: f.resolution_note,
        resolvedAt: f.resolved_at,
        geoStatus: f.geo_status,
        geoDistanceKm: f.geo_distance_km
      })) : [],
    })),
    trustIndex,
    budget,
  };
}

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'demands', label: 'Community Demands' },
];

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [view, setView] = useState('dashboard');
  const [projectTab, setProjectTab] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false); // 👈 FIXED: Declared state here
  const [auditKey, setAuditKey] = useState(0);
  const [loadError, setLoadError] = useState('');

  const printRef = useRef(null);

  const loadProjects = useCallback(async () => {
    try {
      setProjects(await api.listProjects());
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  const loadDetail = useCallback(async (id) => {
    if (!id) return;
    try {
      setDetail(normalizeDetail(await api.getProject(id)));
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    if (user) loadProjects();
  }, [user, loadProjects]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  function openProject(id) {
    setSelectedId(id);
    setProjectTab('overview');
    setView('project');
  }

  function handleLogout() {
    setToken(null);
    setStoredUser(null);
    setUser(null);
    setProjects([]);
    setSelectedId(null);
    setDetail(null);
    setView('dashboard');
  }

  async function refresh() {
    await Promise.all([loadDetail(selectedId), loadProjects()]);
    setAuditKey((k) => k + 1);
  }

  async function handleCreateProject(newProjectId) {
    setShowNewProject(false);
    await loadProjects();
    openProject(newProjectId);
  }

  async function handleSubmitMilestone({ title, progressPercent, budgetSpent, note, photoFile, isFraudDemo }) {
    await api.submitMilestone(selectedId, { title, progressPercent, budgetSpent, note, photoFile, isFraudDemo });
    await refresh();
  }

  async function handleVerify(milestoneId, comment) {
    await api.verifyMilestone(milestoneId, comment);
    await refresh();
  }

  async function handleReject(milestoneId, comment) {
    await api.rejectMilestone(milestoneId, comment);
    await refresh();
  }

  async function handleFlag(milestoneId, text, photoFile) {
    await api.flagMilestone(milestoneId, { text, photoFile });
    await refresh();
  }

  async function handleResolveFlag(flagId, action, comment) {
    await api.resolveFlag(flagId, { action, comment });
    await refresh();
  }

  if (!user) return <Login onLoggedIn={setUser} />;

  return (
    <div className="min-h-screen bg-[var(--light-bg)] pb-16">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--secondary)]">
              Kopargaon Municipal Council
            </p>
            <h1 className="font-display text-xl font-semibold text-[var(--text-dark)]">
              Infrastructure Accountability Platform
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-[var(--text-dark)]">{user.name}</p>
              <p className="text-xs capitalize text-[var(--muted)]">{user.role}</p>
            </div>
            <button onClick={handleLogout} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--card-bg)]">
              Log out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-6">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                view === item.key
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--text-dark)]'
              }`}
            >
              {item.label}
            </button>
          ))}
          {view === 'project' && detail && (
            <span className="border-b-2 border-[var(--primary)] px-3 py-2.5 text-sm font-semibold text-[var(--primary)]">
              {detail.project.name}
            </span>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {loadError && (
          <div className="mb-4 rounded-lg bg-[var(--red)]/10 px-4 py-3 text-sm text-[var(--red)]">{loadError}</div>
        )}

        {view === 'dashboard' && <Dashboard projects={projects} onSelect={openProject} />}
        {view === 'demands' && <CommunityDemands role={user.role} />}

        {/* Authority Action Bar */}
        {view === 'dashboard' && user.role === 'authority' && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!showNewProject ? (
              <button
                onClick={() => setShowNewProject(true)}
                className="rounded-lg bg-[var(--dark-bg)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                + New project passport
              </button>
            ) : (
              <NewProjectForm onCreate={handleCreateProject} onClose={() => setShowNewProject(false)} />
            )}

            <button
              onClick={() => setShowProvisionModal(true)}
              className="rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-2 text-sm font-semibold transition"
            >
              👤 Provision Official Accounts (Contractor / Engineer)
            </button>
          </div>
        )}

        {/* User Provisioning Modal */}
        {showProvisionModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <UserProvisioningModal onClose={() => setShowProvisionModal(false)} />
          </div>
        )}

        {view === 'project' && detail && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => setView('dashboard')} className="text-sm text-[var(--muted)] hover:text-[var(--text-dark)]">
                ← All projects
              </button>

              <div className="flex items-center gap-2">
                <WhatsAppShareButton 
                  project={detail.project} 
                  trustIndexScore={detail.trustIndex.score}
                  physicalPercent={detail.budget.physicalPercent}
                  spentPercent={detail.budget.spentPercent}
                />
                <ExportPdfButton targetRef={printRef} projectName={detail.project.name} />
              </div>
            </div>

            <div className="flex gap-1 border-b border-[var(--border)]">
              {['overview', 'discussion'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setProjectTab(tab)}
                  className={`px-3 pb-2 text-sm font-semibold capitalize ${
                    projectTab === tab ? 'border-b-2 border-[var(--secondary)] text-[var(--text-dark)]' : 'text-[var(--muted)]'
                  }`}
                >
                  {tab === 'overview' ? 'Overview' : 'Discussion'}
                </button>
              ))}
            </div>

            {projectTab === 'overview' && (
              <div ref={printRef} className="space-y-6 p-4 bg-white rounded-2xl border border-[var(--border)] shadow-sm">
                <PassportHeader project={detail.project} />
                <div className="grid gap-6 sm:grid-cols-2">
                  <TrustIndexPanel score={detail.trustIndex.score} breakdown={detail.trustIndex.breakdown} />
                  <BudgetProgress 
                    project={detail.project} 
                    spentPercent={detail.budget.spentPercent} 
                    physicalPercent={detail.budget.physicalPercent} 
                    spentAmount={detail.budget.totalSpent} 
                  />
                </div>
                <div>
                  <h2 className="font-display mb-3 text-lg font-semibold text-[var(--text-dark)]">Milestone Timeline</h2>
                  <div className="space-y-4">
                    {detail.milestones.length === 0 && <p className="text-sm text-[var(--muted)]">No milestones submitted yet.</p>}
                    {detail.milestones.map((milestoneItem) => (
                      <MilestoneCard 
                        key={milestoneItem.id} 
                        milestone={milestoneItem} 
                        role={user.role} 
                        onVerify={handleVerify} 
                        onReject={handleReject} 
                        onFlag={handleFlag} 
                        onResolveFlag={handleResolveFlag} 
                      />
                    ))}
                   {/* In src/App.jsx around line 228: Replace NewMilestoneForm render with this */}
{user.role === 'contractor' && (
  detail.project.contractorId === user.id || 
  detail.project.contractor_id === user.id
) ? (
  <NewMilestoneForm onSubmit={handleSubmitMilestone} />
) : (
  user.role === 'contractor' && (
    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-semibold text-amber-900 flex items-center gap-2">
      🔒 Milestone submission restricted: This project is assigned to "{detail.project.contractor}".
    </div>
  )
)}
                  </div>
                </div>
                <AuditTrail projectId={selectedId} refreshKey={auditKey} />
              </div>
            )}

            {projectTab === 'discussion' && <Discussion projectId={selectedId} />}
          </div>
        )}
      </main>
    </div>
  );
}