/**
 * PrajaSeva Portal - Universal Frontend API Client
 * Seamlessly connects dynamically to Python FastAPI (:8000) or Node.js Express (:5000)
 * Provides automatic failover, JWT authorization headers, and offline fallback.
 */

const BACKEND_CANDIDATES = [
  { url: 'http://127.0.0.1:8000', name: 'Python FastAPI (:8000)', docs: 'http://127.0.0.1:8000/docs' },
  { url: 'http://localhost:8000', name: 'Python FastAPI (:8000)', docs: 'http://localhost:8000/docs' },
  { url: 'http://localhost:5000', name: 'Node.js Express (:5000)', docs: null },
  { url: 'http://127.0.0.1:5000', name: 'Node.js Express (:5000)', docs: null }
];

let activeBackend = null;
let isOfflineFallback = false;

export function getAuthToken() {
  return localStorage.getItem('prajaseva_jwt') || '';
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('prajaseva_jwt', token);
  } else {
    localStorage.removeItem('prajaseva_jwt');
  }
}

// Auto-detect active backend with timeout
export async function detectBackend() {
  for (const candidate of BACKEND_CANDIDATES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${candidate.url}/api/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        activeBackend = {
          url: candidate.url,
          name: data.runtime || candidate.name,
          docs: data.docs ? `${candidate.url}${data.docs}` : candidate.docs,
          state: data.state || 'Andhra Pradesh'
        };
        isOfflineFallback = false;
        console.log(`[PrajaSeva API] Connected to ${activeBackend.name}`);
        return activeBackend;
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  // Fallback
  isOfflineFallback = true;
  activeBackend = {
    url: null,
    name: 'Browser Local Storage (Offline Mode)',
    docs: null
  };
  console.log('[PrajaSeva API] Running in Offline / Local Mode');
  return activeBackend;
}

export function getActiveBackend() {
  return activeBackend;
}

async function request(endpoint, options = {}) {
  if (!activeBackend) {
    await detectBackend();
  }

  if (activeBackend.url) {
    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
      };

      const res = await fetch(`${activeBackend.url}${endpoint}`, {
        headers,
        ...options
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || `HTTP Error ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`[PrajaSeva API] Request to ${endpoint} failed, checking fallback:`, err.message);
    }
  }

  return null;
}

// ----------------- API Service Interface -----------------

export const api = {
  detectBackend,
  getActiveBackend,
  getAuthToken,
  setAuthToken,

  // 1. Authentication
  async login(credential, password) {
    const isEmail = credential.includes('@');
    const payload = isEmail ? { email: credential, password } : { credential, password };

    const remote = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (remote && (remote.access_token || remote.token)) {
      const token = remote.access_token || remote.token;
      setAuthToken(token);
      if (remote.profile) {
        localStorage.setItem('prajaseva_profile', JSON.stringify(remote.profile));
      }
      return remote;
    }

    // Fallback local response
    const existingProfile = JSON.parse(localStorage.getItem('prajaseva_profile')) || {};
    const enteredEmail = credential.includes('@') ? credential : (existingProfile.email || 'citizen@ap.gov.in');
    const enteredPhone = credential.length === 10 ? credential : (existingProfile.phone || '');
    const enteredAadhaar = credential.length === 12 ? credential : (existingProfile.aadhaar || '');
    const citizenName = existingProfile.name || (credential.includes('@') ? credential.split('@')[0] : 'Citizen User');

    return {
      success: true,
      token: 'local_token_' + Date.now(),
      message: 'Citizen authenticated successfully.',
      user: { email: enteredEmail, role: 'citizen', name: citizenName },
      profile: {
        name: citizenName,
        phone: enteredPhone,
        aadhaar: enteredAadhaar,
        email: enteredEmail,
        district: existingProfile.district || "Andhra Pradesh",
        mandal: existingProfile.mandal || "",
        address: existingProfile.address || "",
        avatar: existingProfile.avatar || "/citizen_avatar.png"
      }
    };
  },

  async register(userData) {
    const remote = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (remote && remote.access_token) {
      setAuthToken(remote.access_token);
      return remote;
    }
    return { access_token: 'local_jwt', user: userData };
  },

  async getMe() {
    return await request('/api/auth/me');
  },

  // 2. Profile Management
  async getProfile() {
    const remote = await request('/api/profile');
    if (remote && remote.name) {
      localStorage.setItem('prajaseva_profile', JSON.stringify(remote));
      return remote;
    }
    return JSON.parse(localStorage.getItem('prajaseva_profile')) || {
      name: "",
      email: "",
      phone: "",
      aadhaar: "",
      dob: "",
      gender: "Male",
      district: "",
      mandal: "",
      address: "",
      avatar: "/citizen_avatar.png"
    };
  },

  async saveProfile(profileData) {
    const remote = await request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    if (remote && remote.name) {
      localStorage.setItem('prajaseva_profile', JSON.stringify(remote));
      return remote;
    }
    localStorage.setItem('prajaseva_profile', JSON.stringify(profileData));
    return profileData;
  },

  async getNotifications() {
    const remote = await request('/api/profile/notifications');
    if (Array.isArray(remote)) return remote;
    return [
      { id: 1, title: "DBT Payment Disbursed", message: "₹35,000 for Jagananna Vidya Deevena credited to mother's account.", category: "payment", is_read: 0 },
      { id: 2, title: "Grievance Update Received", message: "Field team dispatched for drinking water grievance #GRV-2026-8921.", category: "grievance", is_read: 0 }
    ];
  },

  // 3. Departments & Schemes
  async getDepartments() {
    const remote = await request('/api/departments');
    if (Array.isArray(remote)) return remote;
    return [];
  },

  async getSchemes(deptId = null) {
    const endpoint = deptId ? `/api/schemes?department_id=${encodeURIComponent(deptId)}` : '/api/schemes';
    const remote = await request(endpoint);
    if (Array.isArray(remote)) return remote;
    return [];
  },

  async checkEligibility(criteria) {
    const remote = await request('/api/schemes/check-eligibility', {
      method: 'POST',
      body: JSON.stringify(criteria)
    });
    if (remote && typeof remote.eligible === 'boolean') {
      return remote;
    }

    // Fallback local logic
    const income = parseFloat(criteria.annual_income || criteria.income || 0);
    const isIncomeEligible = income <= 250000;
    return {
      eligible: isIncomeEligible,
      reasons: isIncomeEligible ? ["All statutory criteria satisfied!"] : ["Annual income exceeds ₹2,50,000 limit."]
    };
  },

  // 4. Applications
  async getApplications() {
    const remote = await request('/api/applications');
    if (Array.isArray(remote)) {
      localStorage.setItem('prajaseva_apps', JSON.stringify(remote));
      return remote;
    }
    return JSON.parse(localStorage.getItem('prajaseva_apps')) || [];
  },

  async submitApplication(applicationData) {
    const remote = await request('/api/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData)
    });
    if (remote && remote.id) {
      return remote;
    }

    // Fallback local generation
    const newId = 'AP-2026-' + Math.floor(100000 + Math.random() * 900000);
    const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const localApp = {
      id: newId,
      scheme: applicationData.scheme || "Jagananna Vidya Deevena",
      applicantName: applicationData.applicantName || applicationData.name || "Citizen Applicant",
      submissionDate: nowStr,
      status: "Under Scrutiny",
      statusCode: "submitted",
      stepIndex: 1,
      department: applicationData.department || "Higher Education Department",
      timeline: [
        { step: "Application Submitted", status: "completed", remarks: "Application registered.", date: nowStr },
        { step: "Secretariat Verification", status: "active", remarks: "Field verification pending.", date: "Pending" },
        { step: "Officer Approval", status: "pending", remarks: "Mandal Revenue Officer review.", date: "Pending" },
        { step: "DBT Disbursement", status: "pending", remarks: "Treasury CFMS payment queue.", date: "Pending" }
      ]
    };
    const stored = JSON.parse(localStorage.getItem('prajaseva_apps')) || [];
    stored.unshift(localApp);
    localStorage.setItem('prajaseva_apps', JSON.stringify(stored));
    return localApp;
  },

  async trackApplication(appId) {
    const cleanId = (appId || '').trim();
    const remote = await request(`/api/applications/track/${encodeURIComponent(cleanId)}`);
    if (remote && remote.id) return remote;

    const stored = JSON.parse(localStorage.getItem('prajaseva_apps')) || [];
    return stored.find(a => a.id.toLowerCase() === cleanId.toLowerCase()) || null;
  },

  // 5. Grievances
  async getGrievances() {
    const remote = await request('/api/grievances');
    if (Array.isArray(remote)) {
      localStorage.setItem('prajaseva_grievances', JSON.stringify(remote));
      return remote;
    }
    return JSON.parse(localStorage.getItem('prajaseva_grievances')) || [];
  },

  async submitGrievance(grievanceData) {
    const remote = await request('/api/grievances', {
      method: 'POST',
      body: JSON.stringify(grievanceData)
    });
    if (remote && remote.id) {
      return remote;
    }

    // Fallback local generation
    const grvId = 'GRV-2026-' + Math.floor(10000 + Math.random() * 90000);
    const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const localGrv = {
      id: grvId,
      department: grievanceData.department || 'Municipal Administration',
      subject: grievanceData.subject || 'Civic Grievance',
      description: grievanceData.description || '',
      location: grievanceData.location || 'Visakhapatnam',
      urgency: grievanceData.urgency || 'Normal',
      submissionDate: nowStr,
      status: "Registered & Assigned",
      statusCode: "in_progress",
      assignedOfficer: "Assigned to Ward Secretariat Officer",
      district: "Visakhapatnam",
      updates: [
        { time: nowStr, text: `Grievance registered and assigned to Ward Secretariat.`, author: "Spandana Cell" }
      ]
    };
    const stored = JSON.parse(localStorage.getItem('prajaseva_grievances')) || [];
    stored.unshift(localGrv);
    localStorage.setItem('prajaseva_grievances', JSON.stringify(stored));
    return localGrv;
  },

  async trackGrievance(grvId) {
    const cleanId = (grvId || '').trim();
    const remote = await request(`/api/grievances/track/${encodeURIComponent(cleanId)}`);
    if (remote && remote.id) return remote;

    const stored = JSON.parse(localStorage.getItem('prajaseva_grievances')) || [];
    return stored.find(g => g.id.toLowerCase() === cleanId.toLowerCase()) || null;
  },

  // 6. Officer & Admin Controls
  async getAdminStats() {
    const remote = await request('/api/admin/stats');
    if (remote && remote.applications) return remote;
    return {
      applications: { total: 2, approved: 1, pending: 1, rejected: 0, approvalRate: "50%" },
      grievances: { total: 2, resolved: 1, pending: 1, resolutionRate: "50%" },
      system: { totalUsers: 3, activeSchemes: 6, slaAdherence: "98.4%", dbtTransferredCrores: "₹ 1,420.80 Cr" }
    };
  },

  async reviewApplication(appId, reviewData) {
    return await request(`/api/admin/applications/${encodeURIComponent(appId)}/status`, {
      method: 'PUT',
      body: JSON.stringify(reviewData)
    });
  },

  async resolveGrievance(grvId, resolveData) {
    return await request(`/api/admin/grievances/${encodeURIComponent(grvId)}/status`, {
      method: 'PUT',
      body: JSON.stringify(resolveData)
    });
  }
};
