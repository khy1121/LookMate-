import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthUser } from '../types/auth';

// 인증 미들웨어: JWT 토큰 검증 및 사용자 정보 주입
// AuthedRequest 타입을 export 하여 라우터에서 사용하도록 함
export type AuthedRequest = Request & { user: AuthUser };
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT 시크릿이 설정되지 않았습니다.');
    const payload = jwt.verify(token, secret) as any;
    // req.user에 최소 정보 주입
    (req as AuthedRequest).user = {
      id: payload.id,
      email: payload.email,
      displayName: payload.displayName,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}
