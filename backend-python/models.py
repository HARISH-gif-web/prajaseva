from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Auth Models
class UserRegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)
    name: str
    phone: Optional[str] = ""
    role: Optional[str] = "citizen"
    department_id: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = ""
    role: str
    department_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Profile Models
class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    aadhaar: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = "Male"
    district: Optional[str] = None
    mandal: Optional[str] = None
    address: Optional[str] = None
    avatar: Optional[str] = "/citizen_avatar.png"
    annual_income: Optional[float] = 120000
    caste_category: Optional[str] = "BC"
    occupation: Optional[str] = "Professional"
    qualification: Optional[str] = "Graduate"

# Eligibility Check Model
class EligibilityCheckRequest(BaseModel):
    scheme_id: str
    annual_income: Optional[float] = 120000
    caste_category: Optional[str] = "BC"
    age: Optional[int] = 25
    district: Optional[str] = "Visakhapatnam"

# Application Models
class ApplicationCreateRequest(BaseModel):
    id: Optional[str] = None
    scheme_id: Optional[str] = "SCH-001"
    scheme: Optional[str] = "Jagananna Vidya Deevena (Fee Reimbursement)"
    applicantName: Optional[str] = "Citizen Applicant"
    applicant_name: Optional[str] = None
    aadhaar: Optional[str] = ""
    mobile: Optional[str] = ""
    email: Optional[str] = ""
    college: Optional[str] = ""
    course: Optional[str] = ""
    income: Optional[str] = ""
    district: Optional[str] = "Visakhapatnam"
    mandal: Optional[str] = "Gajuwaka"
    submissionDate: Optional[str] = None
    department: Optional[str] = "Higher Education Department"
    timeline: Optional[List[Dict[str, Any]]] = None

class ApplicationStatusUpdateRequest(BaseModel):
    status: str
    status_code: str
    step_index: int = 1
    officer_remarks: str

# Grievance Models
class GrievanceCreateRequest(BaseModel):
    id: Optional[str] = None
    department_id: Optional[str] = "dept_municipal"
    department: Optional[str] = "Municipal Administration & Urban Development"
    subject: str
    description: str
    location: Optional[str] = ""
    district: Optional[str] = "Visakhapatnam"
    urgency: Optional[str] = "Normal"
    submissionDate: Optional[str] = None

class GrievanceStatusUpdateRequest(BaseModel):
    status: str
    status_code: str
    resolution_remarks: str
