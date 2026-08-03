from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ProjectCreate(BaseModel):
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, alias="metadata_")
    
print("Success")
