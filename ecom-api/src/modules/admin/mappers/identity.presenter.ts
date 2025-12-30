export function presentIdentity(u: any) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    isActive: u.isActive,
    createdAt: u.createdAt,
    roles: (u.roles ?? []).map((l: any) => ({
      id: l.role.id,
      name: l.role.name,
      scope: l.role.scope,
    })),
  };
}
