from pydantic import BaseModel
from typing import Optional

class MemberApprovalRequest(BaseModel):
    user_id: str
    action: str = "APPROVE" # or REJECT
    admin_notes: Optional[str] = None
    role: Optional[str] = None # 'PERMANENT', 'NORMAL', 'ASSOCIATED'

class ManualMemberCreate(BaseModel):
    phone: str
    full_name: str
    role: str # 'PERMANENT', 'NORMAL', 'ASSOCIATED'
    zonal_committee: Optional[str] = None
    regional_committee: Optional[str] = None
