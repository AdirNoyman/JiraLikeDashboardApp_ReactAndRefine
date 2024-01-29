import { GraphQLFormattedError } from 'graphql';

type Error = {
  message: string;
  statusCode: string;
};

// This is our custom fetch that will call as middleware for every fetch request that we make
const customFetch = async (url: string, options: RequestInit) => {
  const accessToken = localStorage.getItem('access_token');

  const headers = options.headers as Record<string, string>;

  return await fetch(url, {
    ...options,
    headers: {
      ...headers,
      Authorization: headers?.Authorization || `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      // Prevent CORS problem
      'Apollo-Require-Preflight': 'true',
    },
  });
};

// This is our custom erorr that will use to chck if the request came back with an error
const getGraphQLErrors = (
  body: Record<'errors', GraphQLFormattedError[] | undefined>
): Error | null => {
  // Check if body exists
  if (!body) {
    return {
      message: 'Unknown error',
      statusCode: 'INTERNAL_SERVER_ERROR',
    };
  }

  // Check if body has errors
  if ('errors' in body) {
    const errors = body?.errors;

    const messages = errors?.map((error) => error?.message)?.join('');
    const code = errors?.[0]?.extensions?.code;

    return {
      message: messages || JSON.stringify(errors),
      statusCode: code || 500,
    };
  }

  // Have a body and no errors
  return null;
};

export const fetchWrapper = async (url: string, options: RequestInit) => {
  const response = await customFetch(url, options);

  const responseClone = response.clone();

  const body = await responseClone.json();

  const error = getGraphQLErrors(body);

  if (error) {
    throw error;
  }

  return response;
};
