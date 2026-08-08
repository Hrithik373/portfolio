import { useEffect, useState } from "react";
import { logout } from "./auth";

const CRM_GRAPHQL_URL =
  import.meta.env.VITE_CRM_GRAPHQL_URL ?? "http://localhost:8016/graphql";

interface Lead {
  id: string;
  name: string;
  email: string;
  note: string | null;
  source: string | null;
  createdAt: string;
}

const LEADS_QUERY = `query { leads { id name email note source createdAt } }`;

export function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(CRM_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: LEADS_QUERY }),
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.errors) throw new Error(body.errors[0]?.message ?? "GraphQL error");
        setLeads(body.data.leads);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="vik-admin__dashboard">
      <header>
        <h1>Leads</h1>
        <button onClick={logout}>Sign out</button>
      </header>

      {loading && <p>Loading...</p>}
      {error && <p className="vik-admin__error">Couldn't reach svc-crm: {error}</p>}

      {!loading && !error && leads.length === 0 && <p>No leads captured yet.</p>}

      {leads.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Source</th>
              <th>Captured</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.name}</td>
                <td>{lead.email}</td>
                <td>{lead.source ?? "—"}</td>
                <td>{lead.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
