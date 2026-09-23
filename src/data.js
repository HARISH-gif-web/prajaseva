export const INITIAL_DATA = {
  // Empty profile data by default - user fills it up!
  profile: {
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
  },
  
  categories: [
    {
      id: "certificates",
      title: "Certificates",
      subtitle: "Income, Caste, Residence, Birth, Death",
      icon: "file-text",
      count: 14,
      targetView: "service-certificates",
      desc: "Apply for official government certificates & land records"
    },
    {
      id: "education",
      title: "Education",
      subtitle: "Scholarships, Fee Reimbursement, Admissions",
      icon: "graduation-cap",
      count: 18,
      targetView: "dept-education",
      desc: "Student assistance, fee reimbursement & academic support"
    },
    {
      id: "health",
      title: "Health",
      subtitle: "Health Schemes, Aarogyasri, Medical Aid",
      icon: "heart-pulse",
      count: 12,
      targetView: "scheme-aarogyasri",
      desc: "Comprehensive health insurance & medical expense relief"
    },
    {
      id: "agriculture",
      title: "Agriculture",
      subtitle: "Farmer Services, Crop Insurance, Subsidies",
      icon: "sprout",
      count: 22,
      targetView: "scheme-rythu-bharosa",
      desc: "Rythu Bharosa, seed subsidy & financial aid for farmers"
    },
    {
      id: "transport",
      title: "Transport",
      subtitle: "Driving License, Vehicle Registration, RC",
      icon: "car",
      count: 16,
      targetView: "dept-transport",
      desc: "RTO services, learner license, driving test slot booking"
    },
    {
      id: "housing",
      title: "Housing",
      subtitle: "Housing Schemes, Site Allotment, House Sanction",
      icon: "home",
      count: 9,
      targetView: "dept-housing",
      desc: "Navaratnalu Pedalandarikki Illu housing assistance"
    }
  ],

  departments: [
    {
      id: "revenue",
      name: "Revenue Department",
      subtitle: "Caste, Income, Residence, Land Records, Adangal",
      icon: "building-columns",
      targetView: "dept-revenue",
      servicesCount: 24,
      services: [
        "Integrated Caste & Date of Birth Certificate",
        "Income & Asset Certificate (EWS / BC / SC / ST)",
        "Residence / Nativity Certificate",
        "Webland 1B / Adangal Verification",
        "Mutation of Land Record"
      ]
    },
    {
      id: "education-dept",
      name: "Education Department",
      subtitle: "Scholarships, Fee Reimbursement, Jagananna Vidya Deevena",
      icon: "graduation-cap",
      targetView: "dept-education",
      servicesCount: 19,
      services: [
        "Post-Matric Scholarship & Fee Reimbursement",
        "Jagananna Vasathi Deevena",
        "School Admission & Transfer Certificate Approval",
        "Merit Scholarship Application"
      ]
    },
    {
      id: "health-dept",
      name: "Health Department",
      subtitle: "YSR Aarogyasri Card, Medical Aid, Sanction",
      icon: "heart-pulse",
      targetView: "dept-health",
      servicesCount: 15,
      services: [
        "YSR Aarogyasri Health Card Renewal & Addition",
        "Chief Minister Relief Fund (CMRF) Medical Claim",
        "Universal Health Insurance Coverage Scheme",
        "Free Dialysis / Chronic Illness Support"
      ]
    },
    {
      id: "municipal",
      name: "Municipal Department",
      subtitle: "Property Tax, Water Bill, Building Approvals",
      icon: "landmark",
      targetView: "dept-municipal",
      servicesCount: 31,
      services: [
        "Property Tax Assessment & Online Payment",
        "New Water Connection & Tap Charges",
        "Building Plan Approval (AP-DPMS)",
        "Trade License Issuance & Renewal"
      ]
    },
    {
      id: "agri-dept",
      name: "Agriculture Department",
      subtitle: "Rythu Bharosa, Crop Insurance, Seed Subsidy",
      icon: "sprout",
      targetView: "dept-agriculture",
      servicesCount: 27,
      services: [
        "YSR Rythu Bharosa Payment Status",
        "Free Crop Insurance (e-Crop Registration)",
        "Subsidy Fertilizer & Seed Booking",
        "Farm Machinery Subsidy Registration"
      ]
    },
    {
      id: "transport-dept",
      name: "Transport Department",
      subtitle: "Driving License, LLR Slot, RC Transfer",
      icon: "car",
      targetView: "dept-transport",
      servicesCount: 16,
      services: [
        "Learner's License Slot Booking (LLR)",
        "Permanent Driving License Renewal",
        "Vehicle RC Transfer of Ownership",
        "Road Tax Clearance Certificate"
      ]
    }
  ],

  schemesList: [
    {
      id: "fee-reimbursement",
      title: "Fee Reimbursement",
      subtitle: "Jagananna Vidya Deevena Fee Reimbursement Scheme",
      dept: "Education Department",
      targetView: "scheme-fee-reimbursement",
      icon: "graduation-cap",
      badge: "100% Tuition Fee",
      desc: "Complete financial support for tuition fees of eligible SC, ST, BC, EBC, Kapu, Minority students."
    },
    {
      id: "aarogyasri",
      title: "YSR Aarogyasri Health Scheme",
      subtitle: "Cashless Medical Treatment Up to ₹5 Lakhs",
      dept: "Health Department",
      targetView: "scheme-aarogyasri",
      icon: "heart-pulse",
      badge: "Cashless Healthcare",
      desc: "Free super-specialty medical treatment for BPL families across empaneled hospitals."
    },
    {
      id: "rythu-bharosa",
      title: "YSR Rythu Bharosa",
      subtitle: "Annual Financial Assistance of ₹13,500 for Farmers",
      dept: "Agriculture Department",
      targetView: "scheme-rythu-bharosa",
      icon: "sprout",
      badge: "₹13,500 / Year",
      desc: "Direct benefit transfer for farmer families to support input costs before crop seasons."
    }
  ],

  initialApplications: [],
  initialGrievances: []
};
