import { Token } from '../../../../types';
import { convertToCamelCase } from '../case-conversion-utils';
import { isPaginatedList, isTokenResponse, TokenResponse } from './type-guards';

export const toPaginatedTokensResponse = (response: TokenResponse): { data: Token[]; pagination: Record<string, unknown> } | undefined => {
  if (isPaginatedList<TokenResponse>(response)) {
    const transformedData = response.data.filter(isTokenResponse).map((t) => ({
      ...convertToCamelCase(t),
      data: t.data,
      metadata: t.metadata,
    } as Token));

    return {
      data: transformedData,
      pagination: convertToCamelCase(response.pagination),
    };
  }

  return undefined;
};

export const toTokenResponse = (response: TokenResponse): Token | undefined => {
  const _res = convertToCamelCase(response);

  if (isTokenResponse(_res)) {
    return {
      ..._res,
      data: response.data,
      metadata: response.metadata,
    };
  }

  return undefined;
};
