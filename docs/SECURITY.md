# Security & Multi-Tenancy Isolation
**VypaarMitra AI • NPB MEDIA**

---

## 1. Core Security Principles
- **No Public Self-Registration for Merchants**: Only Super Admin can provision businesses and merchants.
- **Tenant Isolation**: Every merchant-owned record must include `companyId`. Security rules and backend services prevent cross-tenant reading (`request.auth.token.companyId == resource.data.companyId`).
- **Initial Super Admin Bootstrap & Forced Password Change**:
  - Bootstrap credentials: `adminn` / `Admin@88`.
  - On first login, `mustChangePassword = true` blocks dashboard access until replaced with a unique secure password.
  - Security events logged: `SUPER_ADMIN_INITIAL_LOGIN`, `SUPER_ADMIN_PASSWORD_CHANGED`.
- **Immutable Financial Records**:
  - Sales and stock movements cannot be silently deleted or edited.
  - Returns produce reverse adjustment records.
- **Privileged Credentials**: Service account keys are never bundled in frontend assets.

---

## 2. Firestore Security Rules Summary
```javascript
function belongsToCompany(companyId) {
  return isAuthenticated() && (
    request.auth.token.companyId == companyId ||
    getUserData().companyId == companyId
  );
}

match /{collectionName}/{docId} {
  allow read: if isAuthenticated() && (
    isSuperAdmin() ||
    (resource != null && belongsToCompany(resource.data.companyId))
  );
  allow create: if isAuthenticated() && (
    isSuperAdmin() ||
    belongsToCompany(request.resource.data.companyId)
  );
  allow update: if isAuthenticated() && (
    isSuperAdmin() ||
    (resource != null && belongsToCompany(resource.data.companyId))
  );
}
```
