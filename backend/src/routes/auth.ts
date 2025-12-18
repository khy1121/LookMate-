import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { requireAuth, AuthedRequest } from '../middleware/requireAuth';

const router = Router();

// 회원가입
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: '이메일, 비밀번호, 닉네임이 필요합니다.' });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: '이미 가입된 이메일입니다.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, displayName, name: displayName, passwordHash },
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.', detail: String(err) });
  }
});

// 로그인
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력하세요.' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT 시크릿이 설정되지 않았습니다.');
    const token = (jwt as any).sign(
      { id: user.id, email: user.email, displayName: user.displayName },
      secret as any,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as any
    );
    return res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: '로그인 중 오류가 발생했습니다.', detail: String(err) });
  }
});

// 로그아웃 (JWT는 클라이언트에서 토큰 삭제)
router.post('/logout', (req: Request, res: Response) => {
  // JWT는 서버 상태를 가지지 않으므로 클라이언트에서 토큰 삭제
  return res.json({ success: true });
});

// 내 정보 조회
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  // req.user는 requireAuth에서 주입
  const user = (req as AuthedRequest).user;
  return res.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  });
});

export default router;
