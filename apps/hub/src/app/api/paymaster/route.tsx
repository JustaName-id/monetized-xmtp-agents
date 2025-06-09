// import { paymasterClient, getSpenderBundlerClient} from "@/lib/smartSpender";
// import { serverEnv } from '@/utils/config/serverEnv';
// import axios from 'axios';

// export async function POST(r: Request) {
//   try {
//     const req = await r.json();
//     const method = req.method;

//     const result = await axios.post(serverEnv.basePaymasterUrl, {
//       method,
//       params: req.params,
//       jsonrpc: '2.0',
//       id: 1,
//     });
//     return Response.json(result.data);
//   } catch (error) {
//     console.error('=== PAYMASTER ERROR ===');
//     console.error('Error:', error);

//     return Response.json(
//       {
//         error: error instanceof Error ? error.message : 'Unknown error',
//         details: error instanceof Error ? error.stack : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }
