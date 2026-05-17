# SSO Requirements

SSO is planned for Phase F and should be treated as Enterprise-only until the security model is fully reviewed.

## Supported direction

- Prefer WorkOS for SAML and OIDC to reduce implementation and maintenance risk.
- Capture identity provider, metadata URL, required claims, groups, and domain verification during pilot scoping.
- Keep `profiles.sso_provider` as the current placeholder until provider-specific account linking ships.

## Required controls

- Enforced domain claim for Enterprise workspaces.
- Just-in-time provisioning mapped to workspace roles only after admin approval.
- Break-glass workspace owner account.
- Audit log entry for sign-in, role mapping, and SSO configuration changes.
- Clear fallback process before enforcing SSO.
