from pydantic import BaseModel
from typing import Optional

class MemberApprovalRequest(BaseModel):
    user_id: str
    action: str = "APPROVE" # or REJECT
    admin_notes: Optional[str] = None
    role: Optional[str] = None # 'PERMANENT', 'NORMAL', 'ASSOCIATED'
