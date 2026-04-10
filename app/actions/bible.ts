'use server';

import { ApiClient, BibleClient } from '@youversion/platform-core';

function getBibleClient() {
  const apiClient = new ApiClient({
    appKey: process.env.YOUVERSION_API_KEY || '',
  });
  return new BibleClient(apiClient);
}

// Optionally cache these
export async function getVersions() {
  try {
    const client = getBibleClient();
    const versions = await client.getVersions('en'); // english versions
    
    const PREFERRED_VERSIONS = [1, 97, 68, 107, 8, 116, 2692, 2079, 111, 12];
    
    const data = versions.data.map((v: any) => ({
      id: v.id,
      title: v.title,
      abbreviation: v.localized_abbreviation || v.abbreviation
    }));
    
    data.sort((a: any, b: any) => {
      const idxA = PREFERRED_VERSIONS.indexOf(a.id);
      const idxB = PREFERRED_VERSIONS.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.title.localeCompare(b.title);
    });
    
    return data;
  } catch (e) {
    console.error("Failed to fetch versions", e);
    return [];
  }
}

export async function getBooks(versionId: number) {
  try {
    const client = getBibleClient();
    const books = await client.getBooks(versionId);
    return books.data.map((b: any) => ({
      id: b.id,
      name: b.name || b.id, 
      chapters: b.chapters?.map((c: any) => c.title) || [],
    }));
  } catch (e) {
    console.error("Failed to fetch books", e);
    return [];
  }
}

export async function getPassage(versionId: number, passageId: string) {
  try {
    const client = getBibleClient();
    const passage = await client.getPassage(versionId, passageId);
    return { title: passage.reference, content: passage.content };
  } catch (e) {
    console.error("Failed to fetch passage", e);
    return { title: 'Error', content: '<p>Failed to load passage.</p>' };
  }
}
