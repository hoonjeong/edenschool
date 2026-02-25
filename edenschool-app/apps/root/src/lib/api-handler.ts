import { NextRequest, NextResponse } from 'next/server';
import { ApiUnauthorizedError, ApiForbiddenError } from './session';

type HandlerFn = (req: NextRequest, context?: any) => Promise<NextResponse | Response>;

export function withErrorHandler(handler: HandlerFn): HandlerFn {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
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
  };
}
