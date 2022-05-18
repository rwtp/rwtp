import type { NextApiRequest, NextApiResponse } from 'next';
import { create } from 'ipfs-http-client';
import { AbortController } from 'node-abort-controller';
import { Any } from '@react-spring/types';

global.AbortController = AbortController;

type Response = {
   cid: string;
};

type ErrorResponse = {
   message: string;
};

export const config = {
   api: {
      bodyParser: {
         sizeLimit: '5mb'  // this is the max limit
      }
   }
};

export default async function handler(
   req: NextApiRequest,
   res: NextApiResponse<Response | ErrorResponse>
) {
   let input = Buffer.from(req.body, "base64");

   const projectId =
      process.env.INFURA_IPFS_PROJECT_ID || '277IbGirb1KWD3z8myADmbbeCyI'; // dev key
   const projectSecret =
      process.env.INFURA_IPFS_PROJECT_SECRET ||
      '23616240472a1d019108d445667d3710'; // dev secret
   const auth =
      'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

   console.log("uploading to infura ipfs node");
   const ipfs = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: {
         authorization: auth,
      },
   });
   const addResult = await ipfs.add(input);

   console.log("uploading to the graph ipfs node");
   const graphIpfs = create({
      host: 'api.thegraph.com',
      apiPath: 'ipfs/api/v0',
      protocol: 'https',
      port: 443,
   });
   const graphIpfsResult = await graphIpfs.add(input);
   console.log("uploaded to the graph ipfs node {}", graphIpfsResult);

   res.status(200).json({ cid: addResult.cid.toString() });
}