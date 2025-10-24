const API_BASE_URL = '/api';

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
}

export const api = {
  // Memory Circles
  getMemoryCircles: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/memory-circles?user_id=${userId}`);
    return handleResponse(response);
  },

  createMemoryCircle: async (data: { name: string; description: string; owner_id: string }) => {
    const response = await fetch(`${API_BASE_URL}/memory-circles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Collaborative Journals
  getCollaborativeJournals: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/collaborative-journals?user_id=${userId}`);
    return handleResponse(response);
  },

  createCollaborativeJournal: async (data: { title: string; description: string; created_by: string; journey_id?: string }) => {
    const response = await fetch(`${API_BASE_URL}/collaborative-journals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Journal Entries
  getJournalEntries: async (journalId: string) => {
    const response = await fetch(`${API_BASE_URL}/collaborative-journals/${journalId}/entries`);
    return handleResponse(response);
  },

  addJournalEntry: async (data: { journal_id: string; user_id: string; user_name: string; content: string; entry_type?: string; image_url?: string; location?: string }) => {
    const response = await fetch(`${API_BASE_URL}/collaborative-journals/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        entry_type: data.entry_type || 'text',
      }),
    });
    return handleResponse(response);
  },

  // Anonymous Memories
  getAnonymousMemories: async (travelType?: string) => {
    const url = travelType 
      ? `${API_BASE_URL}/anonymous-memories?travel_type=${travelType}`
      : `${API_BASE_URL}/anonymous-memories`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Memory Exchanges
  getMemoryExchanges: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/memory-exchanges/${userId}`);
    return handleResponse(response);
  },

  createMemoryExchange: async (data: { user1_id: string; user2_id: string; memory1_id: string; memory2_id: string }) => {
    const response = await fetch(`${API_BASE_URL}/memory-exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};
