import { PSV, PSVSummary } from "@/components/psv/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchPSVs(): Promise<PSV[]> {
  const response = await fetch(`${API_URL}/api/psv`);
  if (!response.ok) {
    throw new Error('Failed to fetch PSVs');
  }
  return response.json();
}

export async function fetchPSVSummary(): Promise<PSVSummary> {
  const response = await fetch(`${API_URL}/api/psv/summary`);
  if (!response.ok) {
    throw new Error('Failed to fetch PSV summary');
  }
  return response.json();
}

export async function fetchPSVById(id: string): Promise<PSV> {
  const response = await fetch(`${API_URL}/api/psv/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch PSV');
  }
  return response.json();
}