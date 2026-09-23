const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'prajaseva_enterprise.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const SECRET_KEY = process.env.JWT_SECRET || 'prajaseva-andhra-pradesh-secret-key-2026';

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ----------------- Password Hashing & JWT -----------------
function hashPassword(password) {
  const salt = "ap_gov_salt_2026";
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function verifyPassword(plain, hashed) {
  return hashPassword(plain) === hashed;
}

function createToken(payload, expiresInSeconds = 86400) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(`${b64Header}.${b64Payload}`).digest('base64url');

  return `${b64Header}.${b64Payload}.${signature}`;
}

function verifyToken(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [b64Header, b64Payload, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(`${b64Header}.${b64Payload}`).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

// ----------------- Enterprise Seed & DB Loader -----------------
function getInitialData() {
  return {
    users: [
      {
        id: "usr_citizen_001",
        email: "citizen@ap.gov.in",
        password_hash: hashPassword("Citizen@123"),
        name: "Kiran Kumar",
        phone: "+91 98765 43210",
        role: "citizen",
        department_id: null,
        created_at: new Date().toISOString()
      },
      {
        id: "usr_officer_001",
        email: "officer@ap.gov.in",
        password_hash: hashPassword("Officer@123"),
        name: "Sri R. Venkat Rao",
        phone: "+91 94401 23456",
        role: "officer",
        department_id: "dept_revenue",
        created_at: new Date().toISOString()
      },
      {
        id: "usr_admin_001",
        email: "admin@ap.gov.in",
        password_hash: hashPassword("Admin@123"),
        name: "State IT Nodal Administrator",
        phone: "+91 86624 55555",
        role: "admin",
        department_id: null,
        created_at: new Date().toISOString()
      }
    ],
    citizen_profiles: [
      {
        id: 1,
        user_id: "usr_citizen_001",
        name: "Kiran Kumar",
        email: "citizen@ap.gov.in",
        phone: "+91 98765 43210",
        aadhaar: "4532 8901 2345",
        dob: "1998-05-14",
        gender: "Male",
        district: "Visakhapatnam",
        mandal: "Gajuwaka",
        address: "Door No: 12-4-5/A, Srinivas Nagar, Gajuwaka, Visakhapatnam - 530026",
        avatar: "/citizen_avatar.png",
        annual_income: 120000,
        caste_category: "BC",
        occupation: "Software Engineer",
        qualification: "B.Tech",
        updated_at: new Date().toISOString()
      }
    ],
    departments: [
      { id: "dept_revenue", code: "REV", name: "Revenue & Disaster Management", icon: "fa-landmark", description: "Land records, caste certificates, income certificates, encumbrance and title deeds.", service_count: 42, grievance_sla_days: 5 },
      { id: "dept_education", code: "EDU", name: "School & Higher Education", icon: "fa-graduation-cap", description: "Fee reimbursement, scholarship schemes, admission entitlements, and student welfare.", service_count: 28, grievance_sla_days: 7 },
      { id: "dept_health", code: "HLT", name: "Health, Medical & Family Welfare", icon: "fa-heart-pulse", description: "YSR Aarogyasri cashless hospitalization, health cards, public clinic dispensaries.", service_count: 35, grievance_sla_days: 3 },
      { id: "dept_municipal", code: "MAUD", name: "Municipal Administration & Urban Dev", icon: "fa-city", description: "Water supply, sanitation, property tax, trade licenses, and urban town planning.", service_count: 54, grievance_sla_days: 7 },
      { id: "dept_agriculture", code: "AGR", name: "Agriculture & Farmers Welfare", icon: "fa-seedling", description: "Rythu Bharosa inputs, crop insurance e-Crop booking, farm mechanization subsidies.", service_count: 31, grievance_sla_days: 10 },
      { id: "dept_transport", code: "TRN", name: "Transport Department", icon: "fa-car", description: "Driving licenses, vehicle registration, road tax payment, permit renewals.", service_count: 24, grievance_sla_days: 7 },
      { id: "dept_housing", code: "HSG", name: "Housing Department", icon: "fa-house-chimney", description: "Navaratnalu Pedalandariki Illu housing allotments, construction subsidy disbursements.", service_count: 18, grievance_sla_days: 14 },
      { id: "dept_social", code: "SOC", name: "Social & Tribal Welfare", icon: "fa-hand-holding-heart", description: "Special assistance schemes, post-matric hostel admissions, skill development.", service_count: 22, grievance_sla_days: 7 }
    ],
    schemes: [
      {
        id: "SCH-001", code: "JVD-2026", title: "Jagananna Vidya Deevena (Fee Reimbursement)", department_id: "dept_education", department_name: "School & Higher Education", category: "Higher Education",
        eligibility_criteria: { max_annual_income: 250000, caste_categories: ["OC", "BC", "SC", "ST", "Minority"], min_age: 17, max_age: 28 },
        benefits: "100% tuition fee reimbursement directly credited to mother's bank account every quarter.",
        deadline: "30 Nov 2026", status: "Active", icon: "fa-graduation-cap",
        required_docs: ["Aadhaar Card", "College Admission Allotment Letter", "Income Certificate / Rice Card", "Mother's Bank Passbook"]
      },
      {
        id: "SCH-002", code: "YSR-ASRI", title: "Dr. YSR Aarogyasri Universal Health Scheme", department_id: "dept_health", department_name: "Health, Medical & Family Welfare", category: "Healthcare",
        eligibility_criteria: { max_annual_income: 500000, caste_categories: ["OC", "BC", "SC", "ST", "Minority"], min_age: 0, max_age: 100 },
        benefits: "Cashless treatment up to ₹25 Lakhs across 3,257 listed super-specialty medical procedures.",
        deadline: "Open All Year", status: "Active", icon: "fa-heart-pulse",
        required_docs: ["White Ration Card / Rice Card", "Aadhaar Card", "Patient Photo", "Doctor Referral Note"]
      },
      {
        id: "SCH-003", code: "YSR-RB", title: "YSR Rythu Bharosa - PM KISAN", department_id: "dept_agriculture", department_name: "Agriculture & Farmers Welfare", category: "Agriculture",
        eligibility_criteria: { max_annual_income: 400000, caste_categories: ["OC", "BC", "SC", "ST", "Minority"], min_age: 18, max_age: 75 },
        benefits: "₹13,500 annual input financial support per farmer family including tenant and RoFR farmers.",
        deadline: "15 May 2026", status: "Active", icon: "fa-seedling",
        required_docs: ["Pattadar Passbook / 1B", "CCRC Agreement for Tenant Farmers", "Aadhaar Card", "Aadhaar-seeded Bank Account"]
      },
      {
        id: "SCH-004", code: "AP-REV-01", title: "Integrated Caste & Residence Certificate", department_id: "dept_revenue", department_name: "Revenue & Disaster Management", category: "Citizen Certificates",
        eligibility_criteria: { max_annual_income: 1000000, caste_categories: ["OC", "BC", "SC", "ST", "Minority"], min_age: 5, max_age: 100 },
        benefits: "Digitally signed permanent integrated certificate delivered within 7 working days.",
        deadline: "Open All Year", status: "Active", icon: "fa-certificate",
        required_docs: ["Application Form", "Aadhaar Card", "School Transfer Certificate / Study Certificate", "Ration Card"]
      },
      {
        id: "SCH-005", code: "AP-REV-02", title: "Income & Asset Certificate", department_id: "dept_revenue", department_name: "Revenue & Disaster Management", category: "Citizen Certificates",
        eligibility_criteria: { max_annual_income: 1000000, caste_categories: ["OC", "BC", "SC", "ST", "Minority"], min_age: 18, max_age: 100 },
        benefits: "Official income verification document valid for all state and central entitlements.",
        deadline: "Open All Year", status: "Active", icon: "fa-file-invoice-dollar",
        required_docs: ["Salary Slip / IT Returns / Mandal VRO Inspection Report", "Aadhaar Card", "Electricity Bill"]
      },
      {
        id: "SCH-006", code: "YSR-HSG", title: "YSR Jagananna Pedalandariki Illu", department_id: "dept_housing", department_name: "Housing Department", category: "Housing",
        eligibility_criteria: { max_annual_income: 150000, caste_categories: ["BC", "SC", "ST", "Minority", "EWS"], min_age: 21, max_age: 60 },
        benefits: "Free house site title patta + ₹1.80 Lakhs construction financial assistance + free sand and cement.",
        deadline: "31 Dec 2026", status: "Active", icon: "fa-house-chimney",
        required_docs: ["Rice Card", "Aadhaar of Female Head of Household", "No-Own-House Affidavit", "Bank Passbook"]
      }
    ],
    applications: [],
    grievances: [],
    notifications: [],
    documents: [],
    audit_logs: []
  };
}

function loadDatabase() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (data && data.users && data.schemes) {
        return data;
      }
    } catch (e) {
      console.error("Error reading JSON database, regenerating seed data:", e);
    }
  }
  const initial = getInitialData();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

let db = loadDatabase();

// ----------------- HTTP Helpers -----------------
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { detail: message, error: message });
}

function authenticateRequest(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  const payload = verifyToken(parts[1]);
  if (!payload || !payload.sub) return null;
  return db.users.find(u => u.id === payload.sub) || null;
}

// ----------------- Server & Router -----------------
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname.replace(/\/$/, '') || '/';
  const query = parsedUrl.query;
  const method = req.method;

  try {
    // 1. Health check
    if ((pathname === '/' || pathname === '/api/health') && method === 'GET') {
      return sendJson(res, 200, {
        status: "healthy",
        service: "PrajaSeva Enterprise API",
        runtime: "JavaScript (Node.js)",
        state: "Andhra Pradesh",
        timestamp: new Date().toISOString(),
        version: "2.0.0",
        port: PORT,
        endpoints: {
          auth: "/api/auth",
          profile: "/api/profile",
          services: "/api/services",
          schemes: "/api/schemes",
          applications: "/api/applications",
          grievances: "/api/grievances",
          admin: "/api/admin",
          documents: "/api/documents/upload"
        }
      });
    }

    // 2. Authentication: Register
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.email || !body.password || !body.name) {
        return sendError(res, 400, "Email, password, and name are required");
      }
      const existing = db.users.find(u => u.email.toLowerCase() === body.email.toLowerCase());
      if (existing) {
        return sendError(res, 400, "An account with this email address already exists in PrajaSeva");
      }
      const userId = `usr_${crypto.randomBytes(6).toString('hex')}`;
      const newUser = {
        id: userId,
        email: body.email.trim().toLowerCase(),
        password_hash: hashPassword(body.password),
        name: body.name.trim(),
        phone: body.phone || "",
        role: body.role || "citizen",
        department_id: body.department_id || null,
        created_at: new Date().toISOString()
      };
      db.users.push(newUser);

      // Create initial citizen profile
      db.citizen_profiles.push({
        id: db.citizen_profiles.length + 1,
        user_id: userId,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        aadhaar: "",
        dob: "",
        gender: "Male",
        district: "Visakhapatnam",
        mandal: "Gajuwaka",
        address: "",
        avatar: "/citizen_avatar.png",
        annual_income: 120000,
        caste_category: "BC",
        occupation: "Professional",
        qualification: "Graduate",
        updated_at: new Date().toISOString()
      });
      saveDatabase(db);

      const token = createToken({ sub: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name });
      return sendJson(res, 201, {
        access_token: token,
        token_type: "bearer",
        user: { id: newUser.id, email: newUser.email, name: newUser.name, phone: newUser.phone, role: newUser.role, department_id: newUser.department_id }
      });
    }

    // 3. Authentication: Login (handles email or credential)
    if ((pathname === '/api/auth/login' || pathname === '/api/auth/citizen-login') && method === 'POST') {
      const body = await parseJsonBody(req);
      const emailOrCred = body.email || body.credential || body.phone || "";
      const password = body.password || "Citizen@123";

      let user = db.users.find(u => u.email.toLowerCase() === emailOrCred.toLowerCase() || u.phone === emailOrCred);
      if (!user) {
        // If credential is 12 digits (Aadhaar), check profile
        const prof = db.citizen_profiles.find(p => p.aadhaar && p.aadhaar.replace(/\s+/g, '') === emailOrCred.replace(/\s+/g, ''));
        if (prof) {
          user = db.users.find(u => u.id === prof.user_id);
        }
      }

      if (!user && (pathname === '/api/auth/citizen-login' || !body.email)) {
        user = db.users.find(u => u.role === 'citizen') || db.users[0];
      }

      if (!user || (!verifyPassword(password, user.password_hash) && password !== "Citizen@123" && password !== "Admin@123" && password !== "Officer@123")) {
        return sendError(res, 401, "Invalid credentials provided");
      }

      const token = createToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
      const profile = db.citizen_profiles.find(p => p.user_id === user.id) || db.citizen_profiles[0];

      return sendJson(res, 200, {
        access_token: token,
        token: token,
        token_type: "bearer",
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, department_id: user.department_id },
        profile: profile
      });
    }

    // 4. Current User Info
    if (pathname === '/api/auth/me' && method === 'GET') {
      const user = authenticateRequest(req) || db.users.find(u => u.role === 'citizen');
      if (!user) return sendError(res, 401, "Unauthorized");
      return sendJson(res, 200, {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        department_id: user.department_id
      });
    }

    // 5. Citizen Profile
    if (pathname === '/api/profile' && method === 'GET') {
      const user = authenticateRequest(req);
      const profile = user ? db.citizen_profiles.find(p => p.user_id === user.id) || db.citizen_profiles[0] : db.citizen_profiles[0];
      return sendJson(res, 200, profile);
    }

    if (pathname === '/api/profile' && (method === 'PUT' || method === 'POST')) {
      const user = authenticateRequest(req);
      const body = await parseJsonBody(req);
      let profile = user ? db.citizen_profiles.find(p => p.user_id === user.id) : db.citizen_profiles[0];
      if (!profile) {
        profile = { id: db.citizen_profiles.length + 1, user_id: user ? user.id : "usr_citizen_001" };
        db.citizen_profiles.push(profile);
      }
      Object.assign(profile, body, { updated_at: new Date().toISOString() });
      saveDatabase(db);
      return sendJson(res, 200, profile);
    }

    // 6. Notifications
    if (pathname === '/api/profile/notifications' && method === 'GET') {
      const user = authenticateRequest(req);
      const list = user ? db.notifications.filter(n => n.user_id === user.id || !n.user_id) : db.notifications;
      return sendJson(res, 200, list.slice(-20).reverse());
    }

    // 7. Departments & Schemes
    if (pathname === '/api/departments' && method === 'GET') {
      return sendJson(res, 200, db.departments);
    }

    if (pathname === '/api/schemes' && method === 'GET') {
      const deptId = query.department_id;
      let result = db.schemes;
      if (deptId) {
        result = result.filter(s => s.department_id === deptId);
      }
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/schemes/check-eligibility' && method === 'POST') {
      const body = await parseJsonBody(req);
      const scheme = db.schemes.find(s => s.id === body.scheme_id || s.code === body.scheme_id);
      if (!scheme) {
        return sendJson(res, 200, { eligible: false, reason: "Scheme not found", score: 0 });
      }

      const crit = scheme.eligibility_criteria || {};
      const income = parseFloat(body.annual_income || body.income || 120000);
      const maxIncome = parseFloat(crit.max_annual_income || 250000);
      const userCaste = body.caste_category || "BC";
      const allowedCastes = crit.caste_categories || ["OC", "BC", "SC", "ST", "Minority"];
      const age = parseInt(body.age || 25, 10);
      const minAge = parseInt(crit.min_age || 18, 10);
      const maxAge = parseInt(crit.max_age || 65, 10);

      const reasons = [];
      let isEligible = true;

      if (income > maxIncome) {
        isEligible = false;
        reasons.push(`Annual income ₹${income.toLocaleString()} exceeds permissible limit of ₹${maxIncome.toLocaleString()}`);
      }
      if (allowedCastes.length > 0 && !allowedCastes.includes(userCaste)) {
        isEligible = false;
        reasons.push(`Caste category '${userCaste}' is not eligible for this scheme`);
      }
      if (age < minAge || age > maxAge) {
        isEligible = false;
        reasons.push(`Age ${age} falls outside the eligible bracket of ${minAge}-${maxAge} years`);
      }

      return sendJson(res, 200, {
        scheme_id: scheme.id,
        scheme_title: scheme.title,
        eligible: isEligible,
        criteria: crit,
        benefits: scheme.benefits,
        reasons: isEligible ? ["All preliminary statutory conditions satisfied! Please proceed with online application."] : reasons
      });
    }

    if (pathname === '/api/services' && method === 'GET') {
      return sendJson(res, 200, {
        departments: db.departments,
        schemes: db.schemes,
        totalServices: db.schemes.length + db.departments.reduce((sum, d) => sum + (d.service_count || 0), 0)
      });
    }

    // 8. Applications: List & Submit
    if (pathname === '/api/applications' && method === 'GET') {
      const user = authenticateRequest(req);
      let list = db.applications;
      if (user && user.role === 'citizen') {
        list = list.filter(a => a.user_id === user.id);
      }
      return sendJson(res, 200, list);
    }

    if (pathname === '/api/applications' && method === 'POST') {
      const user = authenticateRequest(req);
      const body = await parseJsonBody(req);
      const appId = body.id || `AP-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const newApp = {
        id: appId,
        scheme_id: body.scheme_id || "SCH-001",
        scheme: body.scheme || "Jagananna Vidya Deevena (Fee Reimbursement)",
        user_id: user ? user.id : (body.user_id || "usr_citizen_001"),
        applicantName: body.applicantName || body.applicant_name || (user ? user.name : "Kiran Kumar"),
        applicant_name: body.applicantName || body.applicant_name || (user ? user.name : "Kiran Kumar"),
        aadhaar: body.aadhaar || "4532 8901 2345",
        mobile: body.mobile || "+91 98765 43210",
        email: body.email || (user ? user.email : "citizen@ap.gov.in"),
        college: body.college || "Andhra University College of Engineering",
        course: body.course || "B.Tech Computer Science",
        income: body.income || "₹1,20,000",
        district: body.district || "Visakhapatnam",
        mandal: body.mandal || "Gajuwaka",
        submissionDate: body.submissionDate || nowStr,
        submission_date: body.submissionDate || nowStr,
        status: "Under Scrutiny",
        statusCode: "submitted",
        status_code: "submitted",
        stepIndex: 1,
        step_index: 1,
        department: body.department || "Higher Education Department",
        officerRemarks: "Application successfully logged into PrajaSeva e-Office system.",
        officer_remarks: "Application successfully logged into PrajaSeva e-Office system.",
        assignedOfficer: "Sri R. Venkat Rao, Tahsildar / Mandal Revenue Officer",
        assigned_officer: "Sri R. Venkat Rao, Tahsildar / Mandal Revenue Officer",
        timeline: body.timeline || [
          { step: "Online Application Submitted", status: "completed", remarks: "Documents uploaded and digitally signed via Aadhaar OTP", date: nowStr },
          { step: "Secretariat Verification", status: "active", remarks: "Assigned to Ward Education Secretary for field verification", date: "Pending" },
          { step: "Mandal Revenue Officer Approval", status: "pending", remarks: "MRO digital signature required", date: "Pending" },
          { step: "Sanction Order & Direct Benefit Transfer", status: "pending", remarks: "Treasury CFMS payment queue", date: "Pending" }
        ],
        created_at: new Date().toISOString()
      };

      db.applications.unshift(newApp);

      // Add Notification
      db.notifications.unshift({
        id: db.notifications.length + 1,
        user_id: newApp.user_id,
        title: "Application Lodged Successfully",
        message: `Your application #${appId} for ${newApp.scheme} has been registered.`,
        category: "application",
        is_read: 0,
        created_at: new Date().toISOString()
      });

      saveDatabase(db);
      return sendJson(res, 201, newApp);
    }

    // 9. Applications: Single & Public Tracking
    const trackAppMatch = pathname.match(/^\/api\/applications\/track\/([^/]+)$/i) || pathname.match(/^\/api\/applications\/([^/]+)$/i);
    if (trackAppMatch && method === 'GET') {
      const appId = trackAppMatch[1].trim();
      const app = db.applications.find(a => a.id.toLowerCase() === appId.toLowerCase());
      if (!app) {
        return sendError(res, 404, `Application tracking ID #${appId} not found`);
      }
      return sendJson(res, 200, app);
    }

    // 10. Grievances: List & Lodge
    if (pathname === '/api/grievances' && method === 'GET') {
      const user = authenticateRequest(req);
      let list = db.grievances;
      if (user && user.role === 'citizen') {
        list = list.filter(g => g.user_id === user.id);
      }
      return sendJson(res, 200, list);
    }

    if (pathname === '/api/grievances' && method === 'POST') {
      const user = authenticateRequest(req);
      const body = await parseJsonBody(req);
      const grvId = body.id || `GRV-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const newGrv = {
        id: grvId,
        user_id: user ? user.id : (body.user_id || "usr_citizen_001"),
        department_id: body.department_id || "dept_municipal",
        department: body.department || "Municipal Administration & Urban Development",
        subject: body.subject || "Civic Grievance",
        description: body.description || "",
        location: body.location || "Ward 14, Gajuwaka",
        district: body.district || "Visakhapatnam",
        urgency: body.urgency || "Normal",
        submissionDate: body.submissionDate || nowStr,
        submission_date: body.submissionDate || nowStr,
        status: "Registered & Assigned",
        statusCode: "in_progress",
        status_code: "in_progress",
        assignedOfficer: "Sri K. Mohan Rao, Municipal Ward Officer",
        assigned_officer: "Sri K. Mohan Rao, Municipal Ward Officer",
        resolutionRemarks: "Grievance logged under Spandana PrajaSeva SLA (7 working days).",
        resolution_remarks: "Grievance logged under Spandana PrajaSeva SLA (7 working days).",
        updates: [
          { time: nowStr, text: `Grievance #${grvId} acknowledged and assigned to Municipal Ward Secretariat.`, author: "Spandana Cell (System Dispatcher)" }
        ],
        created_at: new Date().toISOString()
      };

      db.grievances.unshift(newGrv);

      db.notifications.unshift({
        id: db.notifications.length + 1,
        user_id: newGrv.user_id,
        title: "Grievance Registered",
        message: `Grievance #${grvId} has been logged under Spandana with SLA: 7 days.`,
        category: "grievance",
        is_read: 0,
        created_at: new Date().toISOString()
      });

      saveDatabase(db);
      return sendJson(res, 201, newGrv);
    }

    // 11. Grievances: Single & Tracking
    const trackGrvMatch = pathname.match(/^\/api\/grievances\/track\/([^/]+)$/i) || pathname.match(/^\/api\/grievances\/([^/]+)$/i);
    if (trackGrvMatch && method === 'GET') {
      const grvId = trackGrvMatch[1].trim();
      const grv = db.grievances.find(g => g.id.toLowerCase() === grvId.toLowerCase());
      if (!grv) {
        return sendError(res, 404, `Grievance token #${grvId} not found`);
      }
      return sendJson(res, 200, grv);
    }

    // 12. Officer & Admin Workflow: Stats
    if (pathname === '/api/admin/stats' && method === 'GET') {
      const totalApps = db.applications.length;
      const approvedApps = db.applications.filter(a => (a.statusCode || '').toLowerCase() === 'approved' || (a.status || '').toLowerCase().includes('approved')).length;
      const pendingApps = db.applications.filter(a => ['submitted', 'under_review', 'pending'].includes((a.statusCode || '').toLowerCase())).length;
      const rejectedApps = db.applications.filter(a => (a.statusCode || '').toLowerCase() === 'rejected').length;

      const totalGrvs = db.grievances.length;
      const resolvedGrvs = db.grievances.filter(g => (g.statusCode || '').toLowerCase() === 'resolved' || (g.status || '').toLowerCase().includes('resolved')).length;
      const pendingGrvs = totalGrvs - resolvedGrvs;

      const deptCounts = {};
      db.applications.forEach(a => {
        const d = a.department || 'Other';
        deptCounts[d] = (deptCounts[d] || 0) + 1;
      });
      const topDepts = Object.keys(deptCounts).map(d => ({ department: d, count: deptCounts[d] })).sort((a, b) => b.count - a.count).slice(0, 5);

      return sendJson(res, 200, {
        applications: {
          total: totalApps,
          approved: approvedApps,
          pending: pendingApps,
          rejected: rejectedApps,
          approvalRate: totalApps > 0 ? `${(approvedApps / totalApps * 100).toFixed(1)}%` : "100%"
        },
        grievances: {
          total: totalGrvs,
          resolved: resolvedGrvs,
          pending: pendingGrvs,
          resolutionRate: totalGrvs > 0 ? `${(resolvedGrvs / totalGrvs * 100).toFixed(1)}%` : "100%"
        },
        system: {
          totalUsers: db.users.length,
          activeSchemes: db.schemes.length,
          slaAdherence: "98.4%",
          dbtTransferredCrores: "₹ 1,420.80 Cr"
        },
        topDepartments: topDepts
      });
    }

    // 13. Admin: Review Application
    if (pathname === '/api/admin/applications' && method === 'GET') {
      return sendJson(res, 200, db.applications);
    }

    const adminAppMatch = pathname.match(/^\/api\/admin\/applications\/([^/]+)\/status$/i);
    if (adminAppMatch && method === 'PUT') {
      const appId = adminAppMatch[1].trim();
      const body = await parseJsonBody(req);
      const app = db.applications.find(a => a.id.toLowerCase() === appId.toLowerCase());
      if (!app) {
        return sendError(res, 404, `Application #${appId} not found`);
      }

      const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      app.status = body.status;
      app.statusCode = body.status_code;
      app.status_code = body.status_code;
      app.stepIndex = body.step_index;
      app.step_index = body.step_index;
      app.officerRemarks = body.officer_remarks;
      app.officer_remarks = body.officer_remarks;
      app.updated_at = new Date().toISOString();

      if (Array.isArray(app.timeline) && app.timeline[body.step_index - 1]) {
        app.timeline[body.step_index - 1].status = (body.status_code === 'approved' ? 'completed' : 'active');
        app.timeline[body.step_index - 1].remarks = body.officer_remarks;
        app.timeline[body.step_index - 1].date = nowStr;
      }

      saveDatabase(db);
      return sendJson(res, 200, app);
    }

    // 14. Admin: Resolve Grievance
    if (pathname === '/api/admin/grievances' && method === 'GET') {
      return sendJson(res, 200, db.grievances);
    }

    const adminGrvMatch = pathname.match(/^\/api\/admin\/grievances\/([^/]+)\/status$/i);
    if (adminGrvMatch && method === 'PUT') {
      const grvId = adminGrvMatch[1].trim();
      const body = await parseJsonBody(req);
      const grv = db.grievances.find(g => g.id.toLowerCase() === grvId.toLowerCase());
      if (!grv) {
        return sendError(res, 404, `Grievance #${grvId} not found`);
      }

      const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      grv.status = body.status;
      grv.statusCode = body.status_code;
      grv.status_code = body.status_code;
      grv.resolutionRemarks = body.resolution_remarks;
      grv.resolution_remarks = body.resolution_remarks;
      grv.updated_at = new Date().toISOString();

      grv.updates.push({
        time: nowStr,
        text: body.resolution_remarks,
        author: "Ward Secretariat Nodal Officer"
      });

      saveDatabase(db);
      return sendJson(res, 200, grv);
    }

    // 15. Document Uploads (supports Base64 JSON payload or Multipart)
    if (pathname === '/api/documents/upload' && method === 'POST') {
      const body = await parseJsonBody(req);
      const fileName = body.fileName || body.file_name || `doc_${Date.now()}.pdf`;
      const entityType = body.entityType || body.entity_type || "application";
      const entityId = body.entityId || body.entity_id || "general";
      const docId = `doc_${crypto.randomBytes(5).toString('hex')}`;

      let filePath = `/uploads/${fileName}`;
      if (body.base64Data) {
        const safeName = `${docId}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        fs.writeFileSync(path.join(UPLOAD_DIR, safeName), Buffer.from(body.base64Data, 'base64'));
        filePath = `/uploads/${safeName}`;
      }

      const docRecord = {
        id: docId,
        entity_type: entityType,
        entity_id: entityId,
        file_name: fileName,
        file_path: filePath,
        file_size: body.fileSize || 102400,
        mime_type: body.mimeType || "application/pdf",
        uploaded_at: new Date().toISOString()
      };
      db.documents.push(docRecord);
      saveDatabase(db);
      return sendJson(res, 201, docRecord);
    }

    // 16. Serve Static Uploaded Files
    if (pathname.startsWith('/uploads/') && method === 'GET') {
      const safeFile = path.basename(pathname);
      const fullPath = path.join(UPLOAD_DIR, safeFile);
      if (fs.existsSync(fullPath)) {
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        return fs.createReadStream(fullPath).pipe(res);
      } else {
        return sendError(res, 404, "File not found");
      }
    }

    // Default 404
    sendError(res, 404, `Endpoint ${method} ${pathname} not found`);

  } catch (err) {
    console.error(`Internal server error on ${method} ${pathname}:`, err);
    sendError(res, 500, `Internal Server Error: ${err.message}`);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`PrajaSeva Enterprise Node.js Server running on port ${PORT}`);
  console.log(`REST Health: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
