import { NextRequest, NextResponse } from 'next/server';
import { ApiUnauthorizedError, ApiForbiddenError } from './session';

type RouteHandler = (req: NextRequest, ...args: never[]) => Promise<NextResponse | Response>;

export function withErrorHandler<T extends RouteHandler>(handler: T): T {
  return (async (req: NextRequest, ...args: unknown[]) => {
    try {
      return await (handler as Function)(req, ...args);
    } catch (error) {
      if (error instanceof ApiUnauthorizedError) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error instanceof ApiForbiddenError) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      console.error('API error:', error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
    }
  }) as unknown as T;
}
