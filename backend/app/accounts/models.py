from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class TransactionCreate(BaseModel):
    type: str = Field(..., pattern="^(INCOME|EXPENSE)$")
    category: str
    amount: float = Field(..., gt=0)
    description: Optional[str] = None
    transaction_date: Optional[date] = None
