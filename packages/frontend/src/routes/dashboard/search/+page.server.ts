import type { PageServerLoad, RequestEvent } from './$types';
import { api } from '$lib/server/api';
import type { SearchResult } from '@ProofArchive/types';

import type { MatchingStrategy } from '@ProofArchive/types';

async function performSearch(
	keywords: string,
	page: number,
	matchingStrategy: MatchingStrategy,
	event: RequestEvent
) {
	if (!keywords) {
		return { searchResult: null, keywords: '', page: 1, matchingStrategy: 'last' };
	}

	try {
		const response = await api(
			`/search?keywords=${keywords}&page=${page}&limit=10&matchingStrategy=${matchingStrategy}`,
			event,
			{
				method: 'GET',
			}
		);

		if (!response.ok) {
			const error = await response.json();
			return { searchResult: null, keywords, page, matchingStrategy, error: error.message };
		}

		const searchResult = (await response.json()) as SearchResult;
		return { searchResult, keywords, page, matchingStrategy };
	} catch (error) {
		return {
			searchResult: null,
			keywords,
			page,
			matchingStrategy,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export const load: PageServerLoad = async (event) => {
	const keywords = event.url.searchParams.get('keywords') || '';
	const page = parseInt(event.url.searchParams.get('page') || '1');
	const matchingStrategy = (event.url.searchParams.get('matchingStrategy') ||
		'last') as MatchingStrategy;
	return performSearch(keywords, page, matchingStrategy, event);
};
