import { INITIAL_DATA } from './data.js';
import { api } from './api.js';

let currentLanguage = 'en';
let currentView = 'home';

// Clear any legacy dummy cache if present
try {
  const cachedApps = JSON.parse(localStorage.getItem('prajaseva_apps') || '[]');
  if (cachedApps.some(a => a.id === 'AP-2026-89421' || a.id === 'AP-2026-94812' || a.id === 'APFEES20268841')) {
    localStorage.removeItem('prajaseva_apps');
  }
  const cachedGrvs = JSON.parse(localStorage.getItem('prajaseva_grievances') || '[]');
  if (cachedGrvs.some(g => g.id === 'GRV-2026-8921' || g.id === 'GRV-2026-7412' || g.id === '00615620894')) {
    localStorage.removeItem('prajaseva_grievances');
  }
} catch (e) {}

// Load stored profile or fallback to empty profile
const savedProfile = JSON.parse(localStorage.getItem('prajaseva_profile'));

let store = {
  isLoggedIn: localStorage.getItem('prajaseva_logged_in') === 'true',
  profile: savedProfile || { ...INITIAL_DATA.profile },
  applications: JSON.parse(localStorage.getItem('prajaseva_apps') || '[]'),
  grievances: JSON.parse(localStorage.getItem('prajaseva_grievances') || '[]'),
  currentFormStep: 1
};

// Helper to refresh both Feather and Lucide icons safely
window.refreshIcons = function() {
  if (window.feather) {
    try { window.feather.replace(); } catch (e) {}
  }
  if (window.lucide) {
    try { window.lucide.createIcons(); } catch (e) {}
  }
};

// Initialize Application & Connect to Backend
document.addEventListener('DOMContentLoaded', async () => {
  renderHeaderAuth();
  renderServicesGrid();
  renderDepartmentsGrid();
  renderSchemesCatalog();
  renderProfileView();
  
  setTimeout(() => window.refreshIcons(), 50);

  // Initialize and auto-detect backend (Python FastAPI or Node.js)
  await initBackendConnection();
});

async function initBackendConnection() {
  await api.detectBackend();

  // Sync profile from backend if available
  try {
    const remoteProfile = await api.getProfile();
    if (remoteProfile && remoteProfile.name) {
      store.profile = remoteProfile;
      renderHeaderAuth();
      renderProfileView();
    }
  } catch (e) {}

  // Sync applications and grievances from backend (even if empty, ensure 0)
  try {
    const remoteApps = await api.getApplications();
    if (Array.isArray(remoteApps)) {
      store.applications = remoteApps;
      localStorage.setItem('prajaseva_apps', JSON.stringify(remoteApps));
      renderProfileView();
    }
  } catch (e) {}

  try {
    const remoteGrvs = await api.getGrievances();
    if (Array.isArray(remoteGrvs)) {
      store.grievances = remoteGrvs;
      localStorage.setItem('prajaseva_grievances', JSON.stringify(remoteGrvs));
      renderProfileView();
    }
  } catch (e) {}
}

// Render Dynamic Header Auth Section (Citizen Logo + Data + Name & Email)
function renderHeaderAuth() {
  const container = document.getElementById('header-auth-container');
  if (!container) return;

  if (store.isLoggedIn) {
    const name = store.profile?.name || store.currentUser?.name || "Citizen Account";
    const email = store.profile?.email || store.currentUser?.email || "citizen@ap.gov.in";
    const avatar = store.profile?.avatar || "/citizen_avatar.png";

    container.innerHTML = `
      <div class="citizen-badge-chip" onclick="navigateTo('profile')" title="Logged in as ${name} (${email})">
        <img src="${avatar}" alt="Citizen Avatar" class="citizen-chip-avatar" />
        <div class="citizen-chip-meta">
          <span class="citizen-chip-name">${name}</span>
          <span class="citizen-chip-email">${email}</span>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-primary" onclick="openModal('login-modal')" style="padding: 0.45rem 1.1rem; font-size: 0.875rem;">
        <i data-feather="log-in" data-lucide="log-in"></i> Citizen Login
      </button>
    `;
  }

  renderQuickMenu();
  window.refreshIcons();
}

// 3 Horizontal Lines Quick Menu Drawer Handlers
window.toggleQuickMenu = function() {
  const drawer = document.getElementById('quick-menu-drawer');
  const overlay = document.getElementById('quick-menu-overlay');
  if (drawer && overlay) {
    const isOpen = drawer.classList.contains('active');
    if (isOpen) {
      window.closeQuickMenu();
    } else {
      window.renderQuickMenu();
      drawer.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
};

window.closeQuickMenu = function() {
  const drawer = document.getElementById('quick-menu-drawer');
  const overlay = document.getElementById('quick-menu-overlay');
  if (drawer) drawer.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
};

window.quickNav = function(viewId) {
  window.closeQuickMenu();
  window.navigateTo(viewId);
};

window.renderQuickMenu = function() {
  const accountBox = document.getElementById('drawer-account-info');
  const footerBox = document.getElementById('drawer-auth-footer');
  if (!accountBox || !footerBox) return;

  if (store.isLoggedIn) {
    const name = store.profile?.name || store.currentUser?.name || "Citizen Account";
    const email = store.profile?.email || store.currentUser?.email || "citizen@ap.gov.in";
    const district = store.profile?.district || "Andhra Pradesh";
    const avatar = store.profile?.avatar || "/citizen_avatar.png";

    accountBox.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <img src="${avatar}" alt="Avatar" style="width:44px; height:44px; border-radius:50%; border:2px solid #0284c7; background:#fff; object-fit:cover;" />
        <div style="flex:1; overflow:hidden;">
          <div style="font-weight:700; color:var(--primary-navy); font-size:0.95rem; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${name}</div>
          <div style="font-size:0.75rem; color:#0369a1; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${email}</div>
          <span class="badge badge-success" style="font-size:0.7rem; padding:0.15rem 0.5rem; margin-top:0.25rem;">${district}</span>
        </div>
      </div>
    `;

    footerBox.innerHTML = `
      <button class="btn-primary" style="width:100%; justify-content:center; background:#dc2626; color:white; border:none; padding:0.75rem;" onclick="performLogout(); closeQuickMenu();">
        <i data-feather="log-out" data-lucide="log-out"></i> Logout from Portal
      </button>
    `;
  } else {
    accountBox.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <div style="width:40px; height:40px; border-radius:50%; background:#e2e8f0; display:flex; align-items:center; justify-content:center; color:var(--primary-navy); font-size:1.2rem;">
          👤
        </div>
        <div>
          <div style="font-weight:700; color:var(--primary-navy); font-size:0.9rem;">Citizen Guest</div>
          <small style="color:var(--text-muted); font-size:0.75rem;">Sign in to access personalized services</small>
        </div>
      </div>
    `;

    footerBox.innerHTML = `
      <button class="btn-primary" style="width:100%; justify-content:center; padding:0.75rem;" onclick="closeQuickMenu(); openModal('login-modal');">
        <i data-feather="log-in" data-lucide="log-in"></i> Citizen Login / Register
      </button>
    `;
  }

  window.refreshIcons();
};

// Router Engine
window.navigateTo = function(viewId) {
  // If navigating to profile and not logged in -> open login modal
  if (viewId === 'profile' && !store.isLoggedIn) {
    openModal('login-modal');
    return;
  }

  const views = [
    'home', 'services', 'service-certificates', 'schemes',
    'scheme-fee-reimbursement', 'scheme-aarogyasri', 'scheme-rythu-bharosa',
    'departments', 'dept-revenue', 'dept-education', 'dept-health',
    'dept-municipal', 'dept-agriculture', 'dept-transport', 'dept-housing',
    'apply-scheme', 'track-application', 'raise-grievance',
    'grievance-status', 'profile'
  ];

  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.style.display = (v === viewId) ? 'block' : 'none';
  });

  currentView = viewId;

  // Update nav menu highlighting
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    const target = link.getAttribute('data-target');
    if (target === viewId || (viewId.startsWith('dept') && target === 'departments') || (viewId.startsWith('scheme') && target === 'schemes')) {
      link.classList.add('active');
    }
  });

  if (viewId === 'profile') {
    renderProfileView();
  }

  if (viewId === 'apply-scheme') {
    prefillApplicationForm();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (viewId === 'scheme-fee-reimbursement') {
    switchSchemeTab('overview');
  }

  setTimeout(() => window.refreshIcons(), 60);
};

// Citizen Login / Logout Handlers
window.performCitizenLogin = async function() {
  const credInput = document.getElementById('login-credential');
  const pwdInput = document.getElementById('login-password');
  const cred = credInput?.value.trim();
  const pwd = pwdInput?.value.trim();

  if (!cred) {
    alert('Please enter your Registered Mobile, Email, or Aadhaar number.');
    if (credInput) credInput.focus();
    return;
  }

  const res = await api.login(cred, pwd || 'Citizen@123');
  store.isLoggedIn = true;
  localStorage.setItem('prajaseva_logged_in', 'true');
  
  if (res) {
    if (res.user) {
      store.currentUser = res.user;
      localStorage.setItem('prajaseva_user', JSON.stringify(res.user));
    }
    if (res.profile && res.profile.name) {
      store.profile = { ...store.profile, ...res.profile };
    } else if (res.user && res.user.name) {
      store.profile = {
        ...store.profile,
        name: res.user.name,
        email: res.user.email,
        phone: res.user.phone || (cred.length === 10 ? cred : store.profile.phone)
      };
    }
    localStorage.setItem('prajaseva_profile', JSON.stringify(store.profile));
  }
  
  closeModal('login-modal');
  renderHeaderAuth();
  navigateTo('profile');
};

window.performLogout = function() {
  store.isLoggedIn = false;
  localStorage.removeItem('prajaseva_logged_in');
  localStorage.removeItem('prajaseva_jwt');
  localStorage.removeItem('prajaseva_user');
  renderHeaderAuth();
  navigateTo('home');
};

// Render Citizen Profile View (Setup Form vs Configured Dashboard)
function renderProfileView() {
  const container = document.getElementById('profile-view-container');
  if (!container) return;

  const hasProfile = Boolean(store.profile.name && store.profile.name.trim().length > 0);

  if (!hasProfile) {
    // Show Setup Form asking citizen to fill up details!
    container.innerHTML = `
      <div class="main-content-card" style="max-width: 760px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="width: 64px; height: 64px; border-radius: var(--radius-full); background: #e0f2fe; color: var(--primary-navy); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.8rem;">
            <i data-feather="user-plus"></i>
          </div>
          <h3 style="font-family: var(--font-heading); color: var(--primary-navy); font-size: 1.5rem; margin-bottom: 0.5rem;">Fill Up Your Citizen Profile</h3>
          <p style="color: var(--text-muted);">Please provide your citizen details to access government services, track applications, and file grievances.</p>
        </div>

        <form onsubmit="event.preventDefault(); saveInitialProfile();">
          <div class="form-grid">
            <div class="form-group">
              <label>Full Name <span class="required">*</span></label>
              <input type="text" class="form-control" id="setup-prof-name" placeholder="Enter your full name" required />
            </div>
            <div class="form-group">
              <label>Email Address <span class="required">*</span></label>
              <input type="email" class="form-control" id="setup-prof-email" placeholder="Enter your email address" required />
            </div>
            <div class="form-group">
              <label>Mobile Number <span class="required">*</span></label>
              <input type="tel" class="form-control" id="setup-prof-phone" placeholder="Enter 10-digit mobile number" maxlength="10" required />
            </div>
            <div class="form-group">
              <label>12-Digit Aadhaar Number <span class="required">*</span></label>
              <input type="text" class="form-control" id="setup-prof-aadhaar" placeholder="Enter 12-digit Aadhaar number" maxlength="14" required />
            </div>
            <div class="form-group">
              <label>District & Mandal <span class="required">*</span></label>
              <input type="text" class="form-control" id="setup-prof-district" placeholder="e.g. NTR District (Vijayawada)" required />
            </div>
            <div class="form-group">
              <label>Gender <span class="required">*</span></label>
              <select class="form-control" id="setup-prof-gender" required>
                <option value="Male" selected>Male</option>
                <option value="Female">Female</option>
                <option value="Transgender">Transgender</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label>Residential Address <span class="required">*</span></label>
              <textarea class="form-control" id="setup-prof-address" rows="3" placeholder="Enter complete residential address" required></textarea>
            </div>
          </div>

          <div class="form-actions-row">
            <button class="btn-primary" type="submit" style="width: 100%; justify-content: center; padding: 0.85rem; font-size: 1rem;">
              <i data-feather="check-circle"></i> Save & Create Profile
            </button>
          </div>
        </form>
      </div>
    `;
  } else {
    // Show Full Configured Citizen Profile Dashboard
    const totalApps = store.applications.length;
    const approvedApps = store.applications.filter(a => (a.statusCode || a.status || '').toLowerCase() === 'approved').length;
    const pendingApps = store.applications.filter(a => (a.statusCode || a.status || '').toLowerCase() !== 'approved').length;
    const totalGrvs = store.grievances.length;

    container.innerHTML = `
      <div class="profile-dashboard">
        <div class="profile-sidebar">
          <img src="${store.profile.avatar || '/citizen_avatar.png'}" alt="Citizen Photo" class="profile-avatar-lg" />
          <h3 class="profile-name">${store.profile.name}</h3>
          <p class="profile-sub">${store.profile.email}</p>

          <div class="profile-nav-menu">
            <div class="profile-nav-item active" onclick="switchProfileTab('applications', this)">
              <i data-feather="file-text"></i> My Applications <span class="badge badge-info" style="margin-left:auto; font-size:0.75rem;">${totalApps}</span>
            </div>
            <div class="profile-nav-item" onclick="switchProfileTab('grievances', this)">
              <i data-feather="message-circle"></i> My Grievances <span class="badge badge-warning" style="margin-left:auto; font-size:0.75rem;">${totalGrvs}</span>
            </div>
            <div class="profile-nav-item" onclick="switchProfileTab('notifications', this)">
              <i data-feather="bell"></i> Notifications
            </div>
            <div class="profile-nav-item" style="color: var(--danger-red);" onclick="performLogout()">
              <i data-feather="log-out"></i> Logout
            </div>
          </div>
        </div>

        <div class="main-content-card">
          <!-- Live Real-Time Counters Strip -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.85rem; margin-bottom: 1.5rem;">
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:0.9rem; border-radius:10px; text-align:center;">
              <div style="font-size:1.8rem; font-weight:800; color:#166534;" id="stat-total-apps">${totalApps}</div>
              <div style="font-size:0.8rem; color:#15803d; font-weight:600;">Total Applications</div>
            </div>
            <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:0.9rem; border-radius:10px; text-align:center;">
              <div style="font-size:1.8rem; font-weight:800; color:#1e40af;" id="stat-pending-apps">${pendingApps}</div>
              <div style="font-size:0.8rem; color:#1d4ed8; font-weight:600;">Under Scrutiny</div>
            </div>
            <div style="background:#fefce8; border:1px solid #fef08a; padding:0.9rem; border-radius:10px; text-align:center;">
              <div style="font-size:1.8rem; font-weight:800; color:#854d0e;" id="stat-approved-apps">${approvedApps}</div>
              <div style="font-size:0.8rem; color:#a16207; font-weight:600;">Approved / Sanctioned</div>
            </div>
            <div style="background:#fdf2f8; border:1px solid #fbcfe8; padding:0.9rem; border-radius:10px; text-align:center;">
              <div style="font-size:1.8rem; font-weight:800; color:#9d174d;" id="stat-total-grvs">${totalGrvs}</div>
              <div style="font-size:0.8rem; color:#be185d; font-weight:600;">Grievances Lodged</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="font-family: var(--font-heading); color: var(--primary-navy);" id="profile-tab-title">My Profile & Submissions</h3>
            <button class="btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem;" onclick="openEditProfileModal()">
              <i data-feather="edit"></i> Edit Profile
            </button>
          </div>

          <div style="background-color: var(--bg-page); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 2rem; border: 1px solid var(--border-light);">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.9rem;">
              <div><strong>Name:</strong> <span>${store.profile.name}</span></div>
              <div><strong>Email:</strong> <span>${store.profile.email}</span></div>
              <div><strong>Phone:</strong> <span>${store.profile.phone}</span></div>
              <div><strong>Aadhaar Number:</strong> <span>${store.profile.aadhaar}</span></div>
              <div><strong>District / Mandal:</strong> <span>${store.profile.district}</span></div>
              <div style="grid-column: span 2;"><strong>Address:</strong> <span>${store.profile.address}</span></div>
            </div>
          </div>

          <div id="profile-tab-content">
            <!-- Rendered dynamically -->
          </div>
        </div>
      </div>
    `;
    renderProfileTab('applications');
  }

  if (window.feather) window.feather.replace();
}

// Initial Profile Submission Handler
window.saveInitialProfile = async function() {
  const name = document.getElementById('setup-prof-name')?.value.trim();
  const email = document.getElementById('setup-prof-email')?.value.trim();
  const phone = document.getElementById('setup-prof-phone')?.value.trim();
  const aadhaar = document.getElementById('setup-prof-aadhaar')?.value.trim();
  const district = document.getElementById('setup-prof-district')?.value.trim();
  const gender = document.getElementById('setup-prof-gender')?.value || 'Male';
  const address = document.getElementById('setup-prof-address')?.value.trim();

  store.profile = {
    name,
    email,
    phone,
    aadhaar,
    district,
    gender,
    address,
    avatar: '/citizen_avatar.png'
  };

  const saved = await api.saveProfile(store.profile);
  if (saved) store.profile = saved;
  renderHeaderAuth();
  renderProfileView();
};

// Edit Profile Modal Prefill & Handler
window.openEditProfileModal = function() {
  const nameEl = document.getElementById('edit-prof-name');
  const emailEl = document.getElementById('edit-prof-email');
  const phoneEl = document.getElementById('edit-prof-phone');
  const distEl = document.getElementById('edit-prof-district');
  const addrEl = document.getElementById('edit-prof-address');

  if (nameEl) nameEl.value = store.profile.name || '';
  if (emailEl) emailEl.value = store.profile.email || '';
  if (phoneEl) phoneEl.value = store.profile.phone || '';
  if (distEl) distEl.value = store.profile.district || '';
  if (addrEl) addrEl.value = store.profile.address || '';
  
  openModal('edit-profile-modal');
};

window.saveProfileChanges = async function() {
  const name = document.getElementById('edit-prof-name')?.value.trim();
  const email = document.getElementById('edit-prof-email')?.value.trim();
  const phone = document.getElementById('edit-prof-phone')?.value.trim();
  const district = document.getElementById('edit-prof-district')?.value.trim();
  const address = document.getElementById('edit-prof-address')?.value.trim();

  if (name) store.profile.name = name;
  if (email) store.profile.email = email;
  if (phone) store.profile.phone = phone;
  if (district) store.profile.district = district;
  if (address) store.profile.address = address;

  const saved = await api.saveProfile(store.profile);
  if (saved) store.profile = saved;
  closeModal('edit-profile-modal');
  renderHeaderAuth();
  renderProfileView();
};

function prefillApplicationForm() {
  const nameInput = document.getElementById('app-fullname');
  const aadhaarInput = document.getElementById('app-aadhaar');
  const mobileInput = document.getElementById('app-mobile');
  const emailInput = document.getElementById('app-email');

  if (nameInput && store.profile.name) nameInput.value = store.profile.name;
  if (aadhaarInput && store.profile.aadhaar) aadhaarInput.value = store.profile.aadhaar;
  if (mobileInput && store.profile.phone) mobileInput.value = store.profile.phone;
  if (emailInput && store.profile.email) emailInput.value = store.profile.email;
}

// Render Services Catalog Grid (Screen 2)
function renderServicesGrid() {
  const grid = document.getElementById('services-category-grid');
  if (!grid) return;

  grid.innerHTML = INITIAL_DATA.categories.map(cat => `
    <div class="category-card" onclick="navigateTo('${cat.targetView}')">
      <div class="category-card-icon service-logo-box ${cat.logoClass || 'logo-revenue'}">
        <i data-feather="${cat.icon}" data-lucide="${cat.icon}"></i>
      </div>
      <div class="category-card-content">
        <div class="category-card-title">${cat.title}</div>
        <div class="category-card-subtitle">${cat.subtitle}</div>
        <span class="badge badge-info">${cat.count} Available Services</span>
      </div>
      <div class="category-card-arrow">›</div>
    </div>
  `).join('');
}

// Render Department Directory Grid (Screen 4)
function renderDepartmentsGrid() {
  const grid = document.getElementById('departments-grid');
  if (!grid) return;

  const deptLogoClasses = {
    'revenue': 'logo-revenue',
    'education-dept': 'logo-education',
    'health-dept': 'logo-health',
    'municipal': 'logo-municipal',
    'agri-dept': 'logo-agriculture',
    'transport-dept': 'logo-transport',
    'housing-dept': 'logo-housing'
  };

  grid.innerHTML = INITIAL_DATA.departments.map(dept => `
    <div class="category-card" onclick="navigateTo('${dept.targetView}')">
      <div class="category-card-icon service-logo-box ${deptLogoClasses[dept.id] || 'logo-revenue'}">
        <i data-feather="${dept.icon}" data-lucide="${dept.icon}"></i>
      </div>
      <div class="category-card-content">
        <div class="category-card-title">${dept.name}</div>
        <div class="category-card-subtitle">${dept.subtitle}</div>
        <span class="badge badge-info">${dept.servicesCount} Online Services</span>
      </div>
      <div class="category-card-arrow">›</div>
    </div>
  `).join('');
}

// Render Schemes Directory Grid
function renderSchemesCatalog() {
  const grid = document.getElementById('schemes-catalog-grid');
  if (!grid) return;

  const schemeLogos = {
    'fee-reimbursement': 'logo-education',
    'aarogyasri': 'logo-health',
    'rythu-bharosa': 'logo-agriculture'
  };

  grid.innerHTML = INITIAL_DATA.schemesList.map(scheme => `
    <div class="category-card" onclick="navigateTo('${scheme.targetView}')">
      <div class="category-card-icon service-logo-box ${schemeLogos[scheme.id] || 'logo-education'}">
        <i data-feather="${scheme.icon}" data-lucide="${scheme.icon}"></i>
      </div>
      <div class="category-card-content">
        <div class="category-card-title">${scheme.title}</div>
        <div class="category-card-subtitle">${scheme.subtitle}</div>
        <span class="badge badge-success">${scheme.badge}</span>
      </div>
      <div class="category-card-arrow">›</div>
    </div>
  `).join('');
}

// Home Search Handler
window.handleHomeSearch = function() {
  const query = document.getElementById('home-search-input')?.value.trim();
  if (query) {
    window.navigateTo('services');
  }
};

// Scheme Detail Tabs Switcher
window.switchSchemeTab = function(tabKey, element) {
  if (element) {
    document.querySelectorAll('.scheme-tabs-row .tab-item').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
  }

  const contentBox = document.getElementById('scheme-tab-content');
  if (!contentBox) return;

  if (tabKey === 'overview') {
    contentBox.innerHTML = `
      <h3 style="font-family: var(--font-heading); color: var(--primary-navy); margin-bottom: 0.75rem;">About the Scheme</h3>
      <p style="color: var(--text-main); margin-bottom: 1.5rem; line-height: 1.7;">
        The Fee Reimbursement Scheme (Jagananna Vidya Deevena) is designed to provide 100% tuition fee reimbursement for eligible students pursuing ITI, Polytechnic, Degree, B.Tech, MBA, MCA, and Post-Graduate courses across government and private accredited colleges in Andhra Pradesh.
      </p>
      <div class="benefit-cards-grid">
        <div class="benefit-card">
          <div class="benefit-card-icon"><i data-feather="building"></i></div>
          <h4>Education Department</h4>
          <p>Implementing Body</p>
        </div>
        <div class="benefit-card">
          <div class="benefit-card-icon"><i data-feather="users"></i></div>
          <h4>Eligible Students</h4>
          <p>Target Beneficiaries</p>
        </div>
        <div class="benefit-card">
          <div class="benefit-card-icon"><i data-feather="dollar-sign"></i></div>
          <h4>Full Waiver</h4>
          <p>100% Tuition Support</p>
        </div>
      </div>
    `;
  } else if (tabKey === 'eligibility') {
    contentBox.innerHTML = `
      <h3 style="font-family: var(--font-heading); color: var(--primary-navy); margin-bottom: 1rem;">Eligibility Criteria</h3>
      <ul style="padding-left: 1.25rem; line-height: 1.8; color: var(--text-main);">
        <li>Family annual income must be below ₹2,50,000/- for all categories.</li>
        <li>Landholding should be less than 10 Acres (Wet land) or 25 Acres (Dry land).</li>
        <li>Student attendance must be at least 75% per semester.</li>
      </ul>
    `;
  } else if (tabKey === 'documents') {
    contentBox.innerHTML = `
      <h3 style="font-family: var(--font-heading); color: var(--primary-navy); margin-bottom: 1rem;">Required Documents</h3>
      <ul style="padding-left: 1.25rem; line-height: 1.8; color: var(--text-main);">
        <li>Aadhaar Card (Student & Parent)</li>
        <li>Valid Income Certificate issued by Revenue Meeseva / Prajaseva</li>
        <li>Caste Certificate issued by Competent Authority</li>
        <li>SSC / 10th Marks Sheet</li>
      </ul>
    `;
  } else if (tabKey === 'how-to-apply') {
    contentBox.innerHTML = `
      <h3 style="font-family: var(--font-heading); color: var(--primary-navy); margin-bottom: 1rem;">How to Apply</h3>
      <ol style="padding-left: 1.25rem; line-height: 1.8; color: var(--text-main);">
        <li>Click 'Apply Now' button on this portal.</li>
        <li>Fill out Personal Details & Aadhaar verification.</li>
        <li>Enter Educational details & upload documents.</li>
        <li>Submit application & save Reference ID.</li>
      </ol>
    `;
  } else if (tabKey === 'contact') {
    contentBox.innerHTML = `
      <h3 style="font-family: var(--font-heading); color: var(--primary-navy); margin-bottom: 1rem;">Help & Contact Details</h3>
      <p>Higher Education & Social Welfare Department<br/>Toll Free Helpline: 1902 / 1100<br/>Email: feereimbursement-support@ap.gov.in</p>
    `;
  }

  if (window.feather) window.feather.replace();
};

// Stepper Navigation
window.goToStep = function(stepNum) {
  store.currentFormStep = stepNum;

  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`form-step-${i}`);
    const nodeEl = document.getElementById(`step-node-${i}`);
    if (stepEl) stepEl.style.display = (i === stepNum) ? 'block' : 'none';
    if (nodeEl) {
      nodeEl.classList.remove('active', 'completed');
      if (i < stepNum) nodeEl.classList.add('completed');
      if (i === stepNum) nodeEl.classList.add('active');
    }
  }

  const progressBar = document.getElementById('step-progress-bar');
  if (progressBar) {
    const percentages = { 1: '0%', 2: '33%', 3: '66%', 4: '100%' };
    progressBar.style.width = percentages[stepNum] || '0%';
  }

  if (stepNum === 4) {
    const pName = document.getElementById('prev-name');
    const pAadhaar = document.getElementById('prev-aadhaar');
    const pMobile = document.getElementById('prev-mobile');
    const pCollege = document.getElementById('prev-college');
    const pCourse = document.getElementById('prev-course');
    const pIncome = document.getElementById('prev-income');

    if (pName) pName.innerText = document.getElementById('app-fullname')?.value || store.profile.name || '-';
    if (pAadhaar) pAadhaar.innerText = document.getElementById('app-aadhaar')?.value || store.profile.aadhaar || '-';
    if (pMobile) pMobile.innerText = document.getElementById('app-mobile')?.value || store.profile.phone || '-';
    if (pCollege) pCollege.innerText = document.getElementById('app-college')?.value || '-';
    if (pCourse) pCourse.innerText = document.getElementById('app-course')?.value || '-';
    if (pIncome) pIncome.innerText = document.getElementById('app-income')?.value || '-';
  }

  window.refreshIcons();
};

window.updateFileLabel = function(inputId, labelId) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  if (input && input.files && input.files[0]) {
    label.innerText = `✓ Selected: ${input.files[0].name}`;
    label.style.color = '#15803d';
  }
};

window.submitFeeApplication = async function() {
  const fullname = document.getElementById('app-fullname')?.value || store.profile.name || 'Citizen Applicant';
  const aadhaar = document.getElementById('app-aadhaar')?.value || store.profile.aadhaar || '';
  const mobile = document.getElementById('app-mobile')?.value || store.profile.phone || '';
  const email = document.getElementById('app-email')?.value || store.profile.email || '';
  const college = document.getElementById('app-college')?.value || '';
  const course = document.getElementById('app-course')?.value || '';
  const income = document.getElementById('app-income')?.value || '';

  const appData = {
    scheme: "Fee Reimbursement",
    applicantName: fullname,
    aadhaar,
    mobile,
    email,
    college,
    course,
    income,
    department: "Education Department"
  };

  const savedApp = await api.submitApplication(appData);
  const newAppId = savedApp.id;

  store.applications.unshift(savedApp);
  localStorage.setItem('prajaseva_apps', JSON.stringify(store.applications));

  // Update profile counters immediately
  renderProfileView();

  const genId = document.getElementById('generated-app-id');
  if (genId) genId.innerText = newAppId;
  openModal('submission-success-modal');

  const trackInput = document.getElementById('track-app-input');
  if (trackInput) trackInput.value = newAppId;
  renderApplicationTracker(newAppId, savedApp);
};

// Track Application Logic
window.performApplicationTracking = async function() {
  const inputId = document.getElementById('track-app-input')?.value.trim();
  if (inputId) {
    const remoteRecord = await api.trackApplication(inputId);
    renderApplicationTracker(inputId, remoteRecord);
  }
};

function renderApplicationTracker(appId, customRecord) {
  const card = document.getElementById('track-result-card');
  if (!card) return;

  const record = customRecord || store.applications.find(a => a.id.toLowerCase() === appId.toLowerCase());
  
  if (!record) {
    card.style.display = 'block';
    document.getElementById('result-scheme-name').innerText = "Application Status";
    document.getElementById('result-app-id').innerHTML = `Application Number: <strong>${appId}</strong>`;
    document.getElementById('result-status-badge').innerText = "Submitted";
    
    const timelineContainer = document.getElementById('application-timeline-nodes');
    if (timelineContainer) {
      timelineContainer.innerHTML = `
        <div class="timeline-step-item done"><div class="timeline-circle">✓</div><div class="timeline-step-title">Submitted</div><div class="timeline-step-date">Today</div></div>
        <div class="timeline-step-item active"><div class="timeline-circle">2</div><div class="timeline-step-title">Verification</div><div class="timeline-step-date">In Progress</div></div>
        <div class="timeline-step-item"><div class="timeline-circle">3</div><div class="timeline-step-title">Officer Review</div><div class="timeline-step-date">Pending</div></div>
        <div class="timeline-step-item"><div class="timeline-circle">4</div><div class="timeline-step-title">Disbursement</div><div class="timeline-step-date">Pending</div></div>
      `;
    }
    return;
  }

  card.style.display = 'block';
  document.getElementById('result-scheme-name').innerText = record.scheme;
  document.getElementById('result-app-id').innerHTML = `Application Number: <strong>${record.id}</strong> (${record.department || 'Education'})`;
  document.getElementById('result-status-badge').innerText = record.status;

  const timelineContainer = document.getElementById('application-timeline-nodes');
  if (timelineContainer && record.timeline) {
    timelineContainer.innerHTML = record.timeline.map((item, idx) => {
      const isDone = item.done || item.status === 'completed';
      const isActive = item.status === 'active' || idx === (record.stepIndex || 1) - 1;
      const statusClass = isDone ? 'done' : (isActive ? 'active' : '');
      const icon = isDone ? '✓' : (idx + 1);

      return `
        <div class="timeline-step-item ${statusClass}">
          <div class="timeline-circle">${icon}</div>
          <div class="timeline-step-title">${item.title || item.step}</div>
          <div class="timeline-step-date">${item.date || item.timestamp || 'Pending'}</div>
        </div>
      `;
    }).join('');
  }
}

// Submit Grievance
window.submitGrievance = async function() {
  const dept = document.getElementById('grv-dept')?.value || 'Municipal Administration';
  const subj = document.getElementById('grv-subject')?.value || 'Civic Support Request';
  const desc = document.getElementById('grv-description')?.value || '';
  const loc = document.getElementById('grv-location')?.value || '';
  const urgency = document.getElementById('grv-urgency')?.value || 'Normal';

  const grvData = {
    department: dept,
    subject: subj,
    description: desc,
    location: loc,
    urgency
  };

  const savedGrv = await api.submitGrievance(grvData);
  const grvId = savedGrv.id;

  store.grievances.unshift(savedGrv);
  localStorage.setItem('prajaseva_grievances', JSON.stringify(store.grievances));

  // Update profile counters immediately
  renderProfileView();

  renderGrievanceStatus(grvId, savedGrv);
  window.navigateTo('grievance-status');
};

function renderGrievanceStatus(grvId, customRecord) {
  const grv = customRecord || store.grievances.find(g => g.id === grvId) || store.grievances[0];
  
  const dId = document.getElementById('grv-display-id');
  const dDept = document.getElementById('grv-display-dept');
  const dSubj = document.getElementById('grv-display-subj');
  const dDate = document.getElementById('grv-display-date');
  const dBadge = document.getElementById('grv-display-badge');
  const dOfficer = document.getElementById('grv-display-officer');

  if (!grv) {
    if (dId) dId.innerText = '-';
    if (dDept) dDept.innerText = 'No Grievance Active';
    if (dSubj) dSubj.innerText = 'No registered grievances found in your account.';
    if (dDate) dDate.innerText = '-';
    if (dBadge) dBadge.innerText = 'Zero Records';
    if (dOfficer) dOfficer.innerText = '-';

    const stepperContainer = document.getElementById('grievance-stepper-nodes');
    if (stepperContainer) {
      stepperContainer.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:1.5rem;">No active grievance timeline. Submit an issue below to start live tracking.</p>';
    }
    const updatesContainer = document.getElementById('grievance-updates-log');
    if (updatesContainer) {
      updatesContainer.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:1rem;">No officer action updates yet.</p>';
    }
    return;
  }

  if (dId) dId.innerText = grv.id;
  if (dDept) dDept.innerText = grv.department;
  if (dSubj) dSubj.innerText = grv.subject;
  if (dDate) dDate.innerText = grv.submissionDate;
  if (dBadge) dBadge.innerText = grv.status;
  if (dOfficer) dOfficer.innerText = grv.assignedOfficer || "Assigned to Ward Secretariat Officer";

  const stepperContainer = document.getElementById('grievance-stepper-nodes');
  if (stepperContainer && grv.timeline) {
    stepperContainer.innerHTML = grv.timeline.map((item) => {
      const statusClass = (item.done || item.status === 'completed') ? 'done' : '';
      const icon = (item.done || item.status === 'completed') ? '✓' : '•';
      return `
        <div class="timeline-step-item ${statusClass}">
          <div class="timeline-circle">${icon}</div>
          <div class="timeline-step-title">${item.title || item.step}</div>
          <div class="timeline-step-date">${item.date || 'Pending'}</div>
        </div>
      `;
    }).join('');
  } else if (stepperContainer) {
    stepperContainer.innerHTML = `
      <div class="timeline-step-item done"><div class="timeline-circle">✓</div><div class="timeline-step-title">Registered</div><div class="timeline-step-date">${grv.submissionDate}</div></div>
      <div class="timeline-step-item active"><div class="timeline-circle">2</div><div class="timeline-step-title">Ward Inquiry</div><div class="timeline-step-date">In Progress</div></div>
      <div class="timeline-step-item"><div class="timeline-circle">3</div><div class="timeline-step-title">Officer Action</div><div class="timeline-step-date">SLA: 7 Days</div></div>
      <div class="timeline-step-item"><div class="timeline-circle">4</div><div class="timeline-step-title">Redressed</div><div class="timeline-step-date">Pending</div></div>
    `;
  }

  const updatesContainer = document.getElementById('grievance-updates-log');
  if (updatesContainer && grv.updates && grv.updates.length > 0) {
    updatesContainer.innerHTML = grv.updates.map(u => `
      <div class="update-item">
        <div class="update-date">${u.date || u.time || 'Today'}</div>
        <div class="update-text">${u.text} ${u.author ? `<br><small style="color:var(--text-muted);">- ${u.author}</small>` : ''}</div>
      </div>
    `).join('');
  } else if (updatesContainer) {
    updatesContainer.innerHTML = '<p style="color:var(--text-muted); padding:0.5rem 0;">Ticket logged into Spandana public grievance system. Assigned to nodal ward officer.</p>';
  }
  
  window.refreshIcons();
}

// Profile Dashboard Sub-Tabs
window.switchProfileTab = function(tabName, element) {
  if (element) {
    document.querySelectorAll('.profile-nav-item').forEach(i => i.classList.remove('active'));
    element.classList.add('active');
  }

  renderProfileTab(tabName);
};

function renderProfileTab(tabName) {
  const title = document.getElementById('profile-tab-title');
  const container = document.getElementById('profile-tab-content');
  if (!container) return;

  if (tabName === 'applications') {
    if (title) title.innerText = `My Submitted Applications (${store.applications.length})`;
    if (store.applications.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1.5rem; background: var(--bg-page); border-radius: var(--radius-md); border: 2px dashed var(--border-light);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📋</div>
          <h4 style="color: var(--primary-navy); font-weight: 700; margin-bottom: 0.35rem; font-size: 1.15rem;">0 Applications Submitted</h4>
          <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 440px; margin: 0 auto 1.5rem; line-height: 1.6;">
            You currently have zero submitted applications. Apply for a welfare scheme or certificate below and the counter will track your submissions in real time.
          </p>
          <button class="btn-primary" style="margin: 0 auto;" onclick="navigateTo('scheme-fee-reimbursement')">
            <i data-feather="plus-circle" data-lucide="plus-circle"></i> Apply for a Service or Scheme
          </button>
        </div>
      `;
      if (window.feather) window.feather.replace();
      return;
    }
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${store.applications.map(app => `
          <div style="background-color: var(--bg-page); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <h4 style="font-family: var(--font-heading); color: var(--primary-navy);">${app.scheme}</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted);">App ID: <strong>${app.id}</strong> | Submitted: ${app.submissionDate || app.submission_date || 'Today'}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span class="badge ${app.statusCode === 'approved' ? 'badge-success' : 'badge-info'}">${app.status}</span>
              <button class="btn-primary" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;" onclick="document.getElementById('track-app-input').value='${app.id}'; performApplicationTracking(); navigateTo('track-application');">
                Track
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (tabName === 'grievances') {
    if (title) title.innerText = `My Registered Grievances (${store.grievances.length})`;
    if (store.grievances.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1.5rem; background: var(--bg-page); border-radius: var(--radius-md); border: 2px dashed var(--border-light);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⚖️</div>
          <h4 style="color: var(--primary-navy); font-weight: 700; margin-bottom: 0.35rem; font-size: 1.15rem;">0 Grievances Registered</h4>
          <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 440px; margin: 0 auto 1.5rem; line-height: 1.6;">
            No civic grievances or issues have been lodged under your citizen account. When you submit an issue, it will be tracked here.
          </p>
          <button class="btn-primary" style="margin: 0 auto;" onclick="navigateTo('raise-grievance')">
            <i data-feather="plus-circle" data-lucide="plus-circle"></i> Lodge Citizen Grievance
          </button>
        </div>
      `;
      if (window.feather) window.feather.replace();
      return;
    }
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${store.grievances.map(g => `
          <div style="background-color: var(--bg-page); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <h4 style="font-family: var(--font-heading); color: var(--primary-navy);">${g.subject}</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Ticket ID: <strong>${g.id}</strong> | ${g.department}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span class="badge ${g.statusCode === 'resolved' ? 'badge-success' : 'badge-warning'}">${g.status}</span>
              <button class="btn-primary" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;" onclick="renderGrievanceStatus('${g.id}'); navigateTo('grievance-status');">
                View Status
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (tabName === 'notifications') {
    if (title) title.innerText = 'Notifications & Alerts';
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <div style="padding: 0.85rem; background: #e0f2fe; border-radius: var(--radius-md); font-size: 0.9rem;">
          📢 <strong>Prajaseva Welcome Alert:</strong> Citizen account initialized. Live counters active and ready for your submissions.
        </div>
      </div>
    `;
  }
}

// Modal Handlers
window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
};

window.checkEligibilityResult = async function() {
  const cat = document.getElementById('elig-category')?.value || 'BC';
  const inc = document.getElementById('elig-income')?.value || '150000';
  const att = document.getElementById('elig-attendance')?.value || '80';

  const res = await api.checkEligibility({
    category: cat,
    income: parseFloat(inc),
    attendance: parseFloat(att)
  });

  const resBox = document.getElementById('elig-result');
  if (resBox) {
    resBox.style.display = 'block';
    if (res.eligible) {
      resBox.style.background = '#dcfce7';
      resBox.style.borderColor = '#bbf7d0';
      resBox.style.color = '#166534';
      resBox.innerHTML = `
        <h4 style="font-weight: 700; margin-bottom: 0.25rem;">✓ Eligible for Scheme</h4>
        <p style="font-size: 0.9rem; margin-bottom: 0.75rem;">${res.reasons.join(' ')}</p>
        <button class="btn-primary" style="font-size: 0.85rem; padding: 0.5rem 1rem;" onclick="closeModal('eligibility-modal'); navigateTo('apply-scheme');">Proceed to Apply ›</button>
      `;
    } else {
      resBox.style.background = '#fee2e2';
      resBox.style.borderColor = '#fecaca';
      resBox.style.color = '#991b1b';
      resBox.innerHTML = `
        <h4 style="font-weight: 700; margin-bottom: 0.25rem;">✕ Not Eligible</h4>
        <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">${res.reasons.join('<br/>')}</p>
      `;
    }
  }
};

// Language Toggle
window.toggleLanguage = function() {
  currentLanguage = (currentLanguage === 'en') ? 'te' : 'en';
  document.getElementById('current-lang-text').innerText = (currentLanguage === 'en') ? 'English' : 'తెలుగు';
};
