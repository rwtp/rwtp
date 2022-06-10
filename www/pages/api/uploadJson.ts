import type { NextApiRequest, NextApiResponse } from 'next';
import { create } from 'ipfs-http-client';
import { AbortController } from 'node-abort-controller';

global.AbortController = AbortController;

type Response = {
  cid: string;
};

type Body = {
  data: string;
};

export async function uploadJson(body: any): Promise<string> {
  console.log('body:', body);
  const projectId = process.env.INFURA_IPFS_PROJECT_ID;
  const projectSecret = process.env.INFURA_IPFS_PROJECT_SECRET;
  const auth =
    'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

  console.log('uploading to infura ipfs node');
  const ipfs = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: auth,
    },
  });

  let input;
  if (typeof body.data == 'string') {
    input = body.data;
  } else {
    input = JSON.stringify(body.data);
  }
  const addResult = await ipfs.add(input);

  console.log('uploading to the graph ipfs node');
  const graphIpfs = create({
    host: 'api.thegraph.com',
    apiPath: 'ipfs/api/v0',
    protocol: 'https',
    port: 443,
  });
  const graphIpfsResult = await graphIpfs.add(input);
  console.log('uploaded to the graph ipfs node {}', graphIpfsResult);
  return addResult.cid.toString();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  const body = req.body as Body;
  res.status(200).json({ cid: await uploadJson(body) });
}
