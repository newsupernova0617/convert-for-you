import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const backendUrl = process.env.CONVERT_API_URL || 'http://localhost:4000';

export const config = {
  api: {
    bodyParser: false
  }
};

function readRequestBody(req: NextApiRequest) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', (error) => reject(error));
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const rawBody = await readRequestBody(req);
    const response = await axios.post(`${backendUrl}/jobs`, rawBody, {
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/octet-stream'
      }
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create job' });
  }
}
