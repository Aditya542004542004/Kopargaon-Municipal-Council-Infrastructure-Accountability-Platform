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
      category: project.category || 'Road Works', // 👈 ADD THIS
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
      // In src/App.jsx inside normalizeDetail (around line 32):
flags: m.flags ? m.flags.map((f) => ({
  id: f.id,
  text: f.text,
  photoUrl: f.photo_url || f.photoUrl || null, // 👈 CAPTURES BOTH photo_url AND photoUrl
  flaggedAt: f.flagged_at || f.flaggedAt,
  status: f.status || 'pending',
  resolutionNote: f.resolution_note || f.resolutionNote,
  resolvedAt: f.resolved_at || f.resolvedAt,
  geoStatus: f.geo_status || f.geoStatus,
  geoDistanceKm: f.geo_distance_km ?? f.geoDistanceKm ?? null
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
  const [showProvisionModal, setShowProvisionModal] = useState(false);
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
      {/* FULL-WIDTH UNIFIED TOP HEADER */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="w-full max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4 px-6 lg:px-10 py-3.5">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700">
                Kopargaon Municipal Council
              </p>
              <h1 className="font-display text-lg font-bold text-slate-900 leading-tight">
                Infrastructure Accountability Platform
              </h1>
            </div>

            {/* Main Nav Tabs */}
            <nav className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-6 my-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    view === item.key
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">{user.name}</p>
              <p className="text-[10px] uppercase font-semibold text-teal-700">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* FULL-WIDTH MAIN CONTENT AREA */}
      <main className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-6">
        {loadError && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-700">
            {loadError}
          </div>
        )}

        {view === 'dashboard' && <Dashboard projects={projects} onSelect={openProject} />}
        {view === 'demands' && <CommunityDemands role={user.role} />}

        {/* Authority Action Bar */}
        {view === 'dashboard' && user.role === 'authority' && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!showNewProject ? (
              <button
                onClick={() => setShowNewProject(true)}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
              >
                + New project passport
              </button>
            ) : (
              <NewProjectForm onCreate={handleCreateProject} onClose={() => setShowNewProject(false)} />
            )}

            <button
              onClick={() => setShowProvisionModal(true)}
              className="rounded-xl border border-teal-700 text-teal-700 hover:bg-teal-50 px-4 py-2 text-xs font-bold transition shadow-xs"
            >
              👤 Provision Official Accounts (Contractor / Engineer)
            </button>
          </div>
        )}

        {/* User Provisioning Modal */}
        {showProvisionModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <UserProvisioningModal onClose={() => setShowProvisionModal(false)} />
          </div>
        )}

        {/* Project Passport Detail View */}
        {view === 'project' && detail && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => setView('dashboard')} className="text-xs font-bold text-slate-500 hover:text-slate-900">
                ← Back to All Projects
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

            <div className="flex gap-2 border-b border-slate-200">
              {['overview', 'discussion'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setProjectTab(tab)}
                  className={`px-4 pb-2.5 text-xs font-bold capitalize transition ${
                    projectTab === tab
                      ? 'border-b-2 border-teal-700 text-teal-700'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {tab === 'overview' ? 'Overview' : 'Discussion'}
                </button>
              ))}
            </div>

           {/* Inside src/App.jsx for overview tab */}
{projectTab === 'overview' && (
  <div ref={printRef} className="space-y-6">
    {/* 1. Integrated 3-Column Top Executive Strip */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-5">
        <PassportHeader project={detail.project} />
      </div>
      <div className="lg:col-span-4">
        <TrustIndexPanel score={detail.trustIndex.score} breakdown={detail.trustIndex.breakdown} />
      </div>
      <div className="lg:col-span-3">
        <BudgetProgress 
          project={detail.project} 
          spentPercent={detail.budget.spentPercent} 
          physicalPercent={detail.budget.physicalPercent} 
          spentAmount={detail.budget.totalSpent} 
        />
      </div>
    </div>

    {/* 2. Milestone Timeline (2-Column Masonry Flow) */}
    <div>
      <h2 className="font-display mb-3 text-base font-bold text-slate-900 flex items-center justify-between">
        <span>Milestone Timeline ({detail.milestones.length})</span>
        <span className="text-xs text-slate-400 font-normal">Click any photo for Fullscreen Lightbox</span>
      </h2>

      <div className="columns-1 lg:columns-2 gap-4 space-y-4">
        {detail.milestones.length === 0 && (
          <p className="text-xs text-slate-400 py-4 text-center bg-white rounded-xl border">
            No milestones submitted yet.
          </p>
        )}
        
        {detail.milestones.map((milestoneItem) => (
          <div key={milestoneItem.id} className="break-inside-avoid mb-4">
            <MilestoneCard 
              milestone={milestoneItem} 
              role={user.role} 
              onVerify={handleVerify} 
              onReject={handleReject} 
              onFlag={handleFlag} 
              onResolveFlag={handleResolveFlag} 
            />
          </div>
        ))}
      </div>

      {/* 🟢 SINGLE Contractor Milestone Form (Rendered ONCE) */}
      {user.role === 'contractor' && (
        <div className="mt-6">
          {(detail.project.contractorId === user.id || detail.project.contractor_id === user.id) ? (
            <NewMilestoneForm onSubmit={handleSubmitMilestone} />
          ) : (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-semibold text-amber-900">
              🔒 Milestone submission restricted: Assigned to contractor "{detail.project.contractor}".
            </div>
          )}
        </div>
      )}
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