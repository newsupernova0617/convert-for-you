import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const backendUrl = process.env.CONVERT_API_URL || 'http://localhost:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Job id is required' });
  }

  try {
    const response = await axios.get(`${backendUrl}/jobs/${id}`);
    return res.status(response.status).json(response.data);
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    console.error(error);
    return res.status(500).json({ message: 'Failed to load job' });
  }
}
