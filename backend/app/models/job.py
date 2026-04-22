from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

class JobLocation(BaseModel):
    city: str
    state: str = ""
    country: str = "India"
    remote: bool = False
    hybrid: bool = False

class JobRole(BaseModel):
    title: str
    title_canonical: str = ""
    level: str = "mid"
    department: str = ""
    type: str = "fulltime"

class JobCompany(BaseModel):
    name: str
    domain: str = ""
    city: str = ""
    industry: str = ""
    size: str = ""

class JobRequirements(BaseModel):
    skills: list[str] = []
    exp_years_min: int = 0
    exp_years_max: int = 10
    education: Optional[str] = None

class JobCompensation(BaseModel):
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "INR"
    disclosed: bool = False

    @field_validator("salary_max")
    @classmethod
    def validate_salary_range(cls, v, info):
        salary_min = info.data.get("salary_min")
        if v is not None and salary_min is not None and v < salary_min:
            raise ValueError("salary_max must be >= salary_min")
        return v

class Job(BaseModel):
    id: str = Field(alias="_id")
    source: str
    source_url: str
    apply_url: str
    ats_type: Optional[str] = None
    company: JobCompany
    role: JobRole
    location: JobLocation
    requirements: JobRequirements
    compensation: JobCompensation
    raw_jd: str = ""
    milvus_id: Optional[str] = None
    posted_at: datetime
    expires_at: datetime
    scraped_at: datetime
    updated_at: datetime
    is_active: bool = True
    freshness_score: float = 1.0
    # Lifecycle fields
    first_seen_at: Optional[datetime] = None
    deactivated_at: Optional[datetime] = None
    consecutive_missing: int = 0
    content_hash: str = ""

    class Config:
        populate_by_name = True
