I have an Inspector management system built with FastAPI + SQLModel.  
Currently, I have two models: `InspectorDocument` and `InspectorCertificationRecord`.  

Problem:  
- In `InspectorDocument`, I defined a `DocumentType` enum that contains values like `Certificate`, `IdCard`, `Degree`, etc.  
- At the same time, I also have a dedicated `InspectorCertificationRecord` model for certifications.  
- This creates an overlap, because certificates exist in both places (as a `DocumentType` in documents and as their own model with metadata).

What I want:  
1. Remove `Certificate` (and any certificate-related values) from the `DocumentType` enum inside `InspectorDocument`.  
   → `DocumentType` should only contain values like `IdCard`, `BirthCertificate`, `MilitaryService`, `Degree`, `Other`.  

2. Keep all professional certifications (API, NDT, etc.) exclusively inside `InspectorCertificationRecord`.  
   → Certificates should have structured metadata: certification_type, certification_number, issuing_authority, issue_date, expiry_date, level, and an optional document_path (link to the uploaded file).  

3. Refactor the APIs:  
   - The **Document API** should only handle `InspectorDocument` (identity, education, general documents).  
   - The **Certification API** should only handle `InspectorCertificationRecord`. No more certificates in `InspectorDocument`.  

4. Ensure all relationships remain correct:  
   - `Inspector` → `documents: List[InspectorDocument]`  
   - `Inspector` → `certifications: List[InspectorCertificationRecord]`  

Deliverables:  
- Updated models with the cleaned-up `DocumentType`.  
- Updated routers/services so that `InspectorDocument` APIs don’t deal with certificates anymore.  
- Separate Certification endpoints for creating, listing, updating, deleting certifications.

