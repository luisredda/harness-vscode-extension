export interface HarnessOrg {
  identifier: string;
  name: string;
}

export interface HarnessProject {
  identifier: string;
  name: string;
  orgIdentifier: string;
}

export async function fetchOrgs(baseUrl: string, accountId: string, apiKey: string): Promise<HarnessOrg[]> {
  const allOrgs: HarnessOrg[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const pageIndex = Math.floor(offset / limit);
    const qs = new URLSearchParams({
      accountIdentifier: accountId,
      pageSize: String(limit),
      pageIndex: String(pageIndex)
    });

    const res = await fetch(`${baseUrl}/ng/api/organizations?${qs}`, {
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const content: any[] = json?.data?.content ?? [];

    const orgs = content.map((o: any) => ({
      identifier: o.organization?.identifier ?? o.identifier,
      name:       o.organization?.name       ?? o.name,
    })).filter(o => o.identifier);

    if (orgs.length === 0) break;

    allOrgs.push(...orgs);

    const totalItems = json?.data?.totalItems ?? 0;
    if (allOrgs.length >= totalItems || orgs.length < limit) {
      break;
    }

    offset += limit;
  }

  return allOrgs;
}

export async function fetchProjects(baseUrl: string, accountId: string, orgId: string, apiKey: string): Promise<HarnessProject[]> {
  const allProjects: HarnessProject[] = [];
  let offset = 0;
  const limit = 50; // API max page size

  while (true) {
    const pageIndex = Math.floor(offset / limit);
    const qs = new URLSearchParams({
      accountIdentifier: accountId,
      orgIdentifier: orgId,
      pageSize: String(limit),
      pageIndex: String(pageIndex)
    });

    const res = await fetch(`${baseUrl}/ng/api/projects?${qs}`, {
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const content: any[] = json?.data?.content ?? [];

    const projects = content.map((p: any) => ({
      identifier:    p.project?.identifier ?? p.identifier,
      name:          p.project?.name       ?? p.name,
      orgIdentifier: orgId,
    })).filter(p => p.identifier);

    if (projects.length === 0) break;

    allProjects.push(...projects);

    const totalItems = json?.data?.totalItems ?? 0;
    if (allProjects.length >= totalItems || projects.length < limit) {
      break;
    }

    offset += limit;
  }

  return allProjects;
}
