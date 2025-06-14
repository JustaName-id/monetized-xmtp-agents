"use client";

import { Agent } from "@/components/Agent";
import React, {useMemo} from 'react';
import { clientEnv } from "@/utils/config/clientEnv";
import { useEnsSubnames } from '@justaname.id/react'

export default function Agents() {

  const { data } = useEnsSubnames({
    ensDomain: clientEnv.xmtpAgentEnsDomain,
    isClaimed: true,
    chainId: 1
  })
  // const { fetchStatus } = useAgents()
  // const [page, setPage] = useState(1);
  // const [allData, setAllData] = useState<DataItem[]>(initialData);
  //
  // // Use React Query to fetch more data
  // const { data, isLoading, isError, error } = useQuery({
  //   queryKey: ['moreData', page],
  //   queryFn: () => fetchMoreData(page),
  //   enabled: page > 1, // Only fetch when page is greater than 1
  // });
  //
  // // Update allData when new data is fetched
  // useEffect(() => {
  //   if (data) {
  //     setAllData(prev => [...prev, ...data]);
  //   }
  // }, [data]);
  //
  // // Handle loading more data
  // const loadMore = () => {
  //   setPage(prev => prev + 1);
  // };

  const flatData = useMemo(() => {
    return data?.pages.flatMap(item => item.data) || []
  }, [data])

  return (
    <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-2.5 gap-y-2.5">
      {flatData?.map((subname) => {
        if (subname.ens === clientEnv.xmtpAgentEnsDomain) return null
        return (<React.Fragment key={subname.ens}>
          <Agent subname={subname} />
        </React.Fragment>);
      })}

      {/* Display all data items */}
      {/*<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">*/}
      {/*  {allData.map(item => (*/}
      {/*    <div key={item.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">*/}
      {/*      <h3 className="text-xl font-semibold">{item.title}</h3>*/}
      {/*      <p className="text-gray-600">{item.description}</p>*/}
      {/*    </div>*/}
      {/*  ))}*/}
      {/*</div>*/}

      {/*/!* Loading state *!/*/}
      {/*{isLoading && (*/}
      {/*  <div className="flex justify-center my-4">*/}
      {/*    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>*/}
      {/*  </div>*/}
      {/*)}*/}

      {/*/!* Error state *!/*/}
      {/*{isError && (*/}
      {/*  <div className="text-red-500 my-4">*/}
      {/*    Error loading data: {error instanceof Error ? error.message : 'Unknown error'}*/}
      {/*  </div>*/}
      {/*)}*/}

      {/*/!* Load more button *!/*/}
      {/*<div className="flex justify-center mt-6">*/}
      {/*  <button*/}
      {/*    onClick={loadMore}*/}
      {/*    disabled={isLoading}*/}
      {/*    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"*/}
      {/*  >*/}
      {/*    {isLoading ? 'Loading...' : 'Load More'}*/}
      {/*  </button>*/}
      {/*</div>*/}
    </div>
  );
}
