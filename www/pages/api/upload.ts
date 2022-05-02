// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
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

  const projectId = '277IbGirb1KWD3z8myADmbbeCyI';
  const projectSecret = '23616240472a1d019108d445667d3710';
  const auth =
    'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

  const ipfs = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: auth,
    },
  });

  const addResult = await ipfs.add(body.data);

  res.status(200).json({ cid: addResult.cid.toString() });
}
