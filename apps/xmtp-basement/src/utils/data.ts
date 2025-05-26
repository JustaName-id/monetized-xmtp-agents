// Define the data model
export type DataItem = {
  id: number;
  title: string;
  description: string;
};

// Generate mock data for a given page
export const generateMockData = (page: number): DataItem[] => {
  return [
    { id: page * 3 + 1, title: `Item ${page * 3 + 1}`, description: `Description for item ${page * 3 + 1}` },
    { id: page * 3 + 2, title: `Item ${page * 3 + 2}`, description: `Description for item ${page * 3 + 2}` },
    { id: page * 3 + 3, title: `Item ${page * 3 + 3}`, description: `Description for item ${page * 3 + 3}` },
  ];
};

// Fetch initial data (for server-side rendering)
export async function getInitialData(): Promise<DataItem[]> {
  // Simulate a server delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return mock data for page 0
  return generateMockData(0);
}
