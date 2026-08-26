import type { Game, Question } from '../types';

const API_BASE = '/api';

export const api = {
  async getIpInfo() {
    const res = await fetch(`${API_BASE}/ip`);
    return await res.json();
  },

  async getGames(): Promise<Game[]> {
    const res = await fetch(`${API_BASE}/games`);
    return await res.json();
  },

  async getGame(id: string): Promise<Game> {
    const res = await fetch(`${API_BASE}/games/${id}`);
    if (!res.ok) throw new Error('Game not found');
    return await res.json();
  },

  async createGame(data: Partial<Game>): Promise<Game> {
    const res = await fetch(`${API_BASE}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create game');
    }
    return await res.json();
  },

  async updateGame(id: string, data: Partial<Game>): Promise<Game> {
    const res = await fetch(`${API_BASE}/games/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update game');
    return await res.json();
  },

  async deleteGame(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/games/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete game');
  },

  async duplicateGame(id: string): Promise<Game> {
    const res = await fetch(`${API_BASE}/games/${id}/duplicate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to duplicate game');
    return await res.json();
  },

  async addQuestion(gameId: string, data: any): Promise<Question> {
    const res = await fetch(`${API_BASE}/games/${gameId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add question');
    }
    return await res.json();
  },

  async updateQuestion(id: string, data: any): Promise<Question> {
    const res = await fetch(`${API_BASE}/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update question');
    }
    return await res.json();
  },

  async deleteQuestion(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/questions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete question');
  },

  async reorderQuestions(gameId: string, questionIds: string[]): Promise<Question[]> {
    const res = await fetch(`${API_BASE}/games/${gameId}/reorder-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionIds })
    });
    if (!res.ok) throw new Error('Failed to reorder questions');
    return await res.json();
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload image');
    const data = await res.json();
    return data.url;
  }
};
