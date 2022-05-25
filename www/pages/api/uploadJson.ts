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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  const body = req.body as Body;

  const projectId = "29IXS0LrC2gnQjhwcwIGDX9r4qb";//process.env.INFURA_IPFS_PROJECT_ID;
  const projectSecret = "6f3ec384f3e4f14b83f713c55b8e75bb";//process.env.INFURA_IPFS_PROJECT_SECRET;
  const auth =
    'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

  const client = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: {
          authorization: auth,
      },
  });

  client.add('Hello World').then((res) => {
      console.log(res);
  });

  // console.log("uploading to the graph ipfs node");
  // const graphIpfs = create({
  //   host: 'api.thegraph.com',
  //   apiPath: 'ipfs/api/v0',
  //   protocol: 'https',
  //   port: 443,
  // });
  // const graphIpfsResult = await graphIpfs.add(input);
  // console.log("uploaded to the graph ipfs node {}", graphIpfsResult);

  res.status(200).json({ cid: ""});//addResult.cid.toString() });
}
