# VYPAARMITRA AI - Architecture Documentation
**Parent Company: NPB MEDIA**  
**Tagline: "Smart Business Management for Every Business"**

---

## 1. System Overview
VypaarMitra AI is a unified, multi-tenant Business Management SaaS platform engineered to support 39+ distinct retail, wholesale, service, and food business types (Kirana, Garments, Pharmacy, Electronics, Restaurant, Salon, etc.) using a dynamic, configurable Business Type Engine.

```
                          [ Client Layer: Web / PWA ]
                                       |
                   +-------------------+-------------------+
                   |                                       |
        [ Next.js Client App ]                   [ Next.js API Routes ]
       (React, Tailwind, i18n)                 (Auth, Tenancy, Quotas)
                   |                                       |
                   +-------------------+-------------------+
                                       |
                                       v
                             [ Unified Data Layer ]
            +--------------------------+--------------------------+
            |                                                     |
            v                                                     v
  [ Cloud Firestore ]                                   [ Firebase Storage ]
  • Tenant-isolated docs                                • Invoices, Logos
  • Realtime listeners                                  • Attachments
  • Immutable audit logs                                • Receipts
```

---

## 2. The 5 Distinct Application Consoles
1. **Super Admin Console (`/superadmin`)**:
   - Master NPB Media administrative console.
   - Manages businesses, merchant provisioning, business type definitions, subscription plans, module allocations, and immutable security audit streams.
2. **Merchant Console (`/merchant`)**:
   - Single-store / multi-counter administrative dashboard.
   - Fast POS counter, product inventory with business-specific dynamic fields, customer khata, supplier inward orders, expense tracker, staff management, and financial/GST reports.
   - VyapaarMitra AI natural language business assistant.
3. **Employee Console (`/employee`)**:
   - Scoped interface for cashiers, sales clerks, and warehouse workers.
   - Sub-role permissions control feature availability.
4. **Support Console (`/support`)**:
   - Tiered NPB Media customer support portal (L1 View to L4 Full Support).
   - Support ticket workflows, merchant account inspection, and assisted credential recovery with full audit logging.
5. **Developer Console (`/developer`)**:
   - 10-Step Firebase setup wizard, Firestore/Storage/FCM diagnostics, and system health monitors.

---

## 3. Data Synchronization & Resilience
- Dual-state architecture: High-speed local store with seamless Cloud Firestore synchronization.
- Real-time online/offline detection with status banners (`Saving...`, `Saved`, `Syncing...`, `Synced`, `Offline`, `Sync failed`).
- Conflict-safe immutable financial records.
