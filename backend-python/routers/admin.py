from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, Dict, Any, List
from models import ApplicationStatusUpdateRequest, GrievanceStatusUpdateRequest
from database import (
    get_admin_stats, get_all_applications, update_application_status,
    get_all_grievances, update_grievance_status
)
from dependencies import get_current_user_optional

router = APIRouter(prefix="/api/admin", tags=["Officer & Admin Workflow"])

def verify_officer_access(current_user: Optional[Dict[str, Any]]) -> str:
    if current_user:
        if current_user.get("role") not in ["officer", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access restricted: Officer or Administrator privileges required"
            )
        return current_user.get("name", "Authorized Officer")
    return "Sri R. Venkat Rao (Tahsildar / Officer)"

@router.get("/stats")
def fetch_admin_stats(current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    verify_officer_access(current_user)
    return get_admin_stats()

@router.get("/applications")
def fetch_all_applications(current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    verify_officer_access(current_user)
    return get_all_applications(None)

@router.put("/applications/{app_id}/status")
def review_application(
    app_id: str,
    req: ApplicationStatusUpdateRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    officer_name = verify_officer_access(current_user)
    updated = update_application_status(
        app_id=app_id,
        new_status=req.status,
        new_status_code=req.status_code,
        step_index=req.step_index,
        officer_remarks=req.officer_remarks,
        officer_name=officer_name
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application #{app_id} not found"
        )
    return updated

@router.get("/grievances")
def fetch_all_grievances(current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    verify_officer_access(current_user)
    return get_all_grievances(None)

@router.put("/grievances/{grv_id}/status")
def resolve_grievance(
    grv_id: str,
    req: GrievanceStatusUpdateRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    officer_name = verify_officer_access(current_user)
    updated = update_grievance_status(
        grv_id=grv_id,
        new_status=req.status,
        status_code=req.status_code,
        resolution_remarks=req.resolution_remarks,
        officer_name=officer_name
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grievance #{grv_id} not found"
        )
    return updated
