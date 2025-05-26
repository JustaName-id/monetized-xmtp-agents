

import Agents from '@/components/Agents';
import Connect from '@/components/Connect';
import {getAgents} from "@/query/agents";

// This function runs on the server during SSR
export async function generateMetadata() {
  // You can use this to set dynamic metadata based on fetched data
  return {
    title: 'Data Dashboard',
    description: 'Server-side rendered data with client-side updates',
  };
}

// Server Component for initial data fetching
export default async function Index() {
  // Fetch initial data on the server
  const initialData = await getAgents();


  return (
    <div>
      <div className="wrapper">
        <div className="container">

          <div id="welcome">
            <h1>
              <span>Agents</span>
            </h1>
          </div>

          <Connect />
          {/* Client component that will handle React Query updates */}
          <Agents initialData={initialData} />
        </div>
      </div>
    </div>
  );
}
