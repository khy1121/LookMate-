import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 파일 업로드를 위한 Multer 설정
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // 고유한 파일명 생성: YYYYMMDD-HHMMSS-random-originalname
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${timestamp}-${random}-${basename}${ext}`);
  }
});

// 파일 필터: 이미지만 허용
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
};

// Multer 업로드 설정 (검증 포함)
const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 최대 5MB
  }
});

// 이미지 URL을 반환하는 헬퍼 함수
const getImageUrl = (req: Request, filename: string): string => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
};

/**
 * POST /api/ai/avatar
 * 얼굴 사진으로 전신 아바타 생성
 * 
 * Request (multipart/form-data):
 *   - faceImage: File
 *   - height: string (number)
 *   - bodyType: string ('slim' | 'normal' | 'muscular' | 'plus')
 *   - gender: string ('male' | 'female' | 'unisex')
 * 
 * Response:
 *   - avatarUrl: string
 *   - meta: { modelVersion: string, note: string }
 * 
 * STUB: 현재 업로드된 이미지를 그대로 반환합니다. 실제 AI 모델로 교체 필요.
 */
router.post('/avatar', upload.single('faceImage'), (req: Request, res: Response) => {
  try {
    const { height, bodyType, gender } = req.body;
    const faceImage = req.file;

    if (!faceImage) {
      return res.status(400).json({ error: 'faceImage is required' });
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📸 Avatar generation request:`, {
      fileName: faceImage.filename,
      originalName: faceImage.originalname,
      size: `${(faceImage.size / 1024).toFixed(2)} KB`,
      height,
      bodyType,
      gender
    });

    // STUB: 현재 업로드된 얼굴 이미지를 아바타로 반환
    // TODO: 실제 AI 아바타 생성 모델 통합
    // - 얼굴 사진 + 신체 파라미터로 전신 아바타 생성
    // - 옵션: DALL-E, Stable Diffusion, 커스텀 GAN 모델
    const avatarUrl = getImageUrl(req, faceImage.filename);

    res.json({
      avatarUrl,
      meta: {
        height: height ? parseFloat(height) : undefined,
        bodyType,
        gender,
        modelVersion: 'stub-v1.0',
        note: 'STUB: Using uploaded face image. Integrate AI model for real avatar generation.'
      }
    });
  } catch (error: any) {
    console.error('❌ Avatar generation error:', error);
    res.status(500).json({ error: 'Avatar generation failed', message: error.message });
  }
});

/**
 * POST /api/ai/remove-background
 * 옷 이미지의 배경 제거
 * 
 * Request (multipart/form-data):
 *   - clothImage: File
 * 
 * Response:
 *   - imageUrl: string (배경이 제거된 이미지 URL)
 * 
 * STUB: 현재 업로드된 이미지를 그대로 반환합니다. remove.bg API 또는 커스텀 모델로 교체 필요.
 */
router.post('/remove-background', upload.single('clothImage'), (req: Request, res: Response) => {
  try {
    const clothImage = req.file;

    if (!clothImage) {
      return res.status(400).json({ error: 'clothImage is required' });
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🖼️ Background removal request:`, {
      fileName: clothImage.filename,
      originalName: clothImage.originalname,
      size: `${(clothImage.size / 1024).toFixed(2)} KB`,
      mimeType: clothImage.mimetype
    });

    // STUB: 현재 원본 이미지를 그대로 반환
    // TODO: remove.bg API 또는 커스텀 배경 제거 모델 통합
    // - Option 1: remove.bg API (https://www.remove.bg/api)
    // - Option 2: U-2-Net 또는 유사 오픈소스 모델
    // - Option 3: GPU 서버에 커스텀 학습 모델
    const imageUrl = getImageUrl(req, clothImage.filename);

    res.json({
      imageUrl,
      meta: {
        originalSize: clothImage.size,
        processedAt: timestamp,
        note: 'STUB: Using original image. Integrate background removal API/model for actual processing.'
      }
    });
  } catch (error: any) {
    console.error('❌ Background removal error:', error);
    res.status(500).json({ error: 'Background removal failed', message: error.message });
  }
});

/**
 * POST /api/ai/try-on
 * 가상 피팅: 아바타가 옷을 입은 이미지 생성
 * 
 * Request (JSON):
 *   - avatarImageUrl: string
 *   - clothingImageUrls: string[]
 *   - pose?: string
 * 
 * Response:
 *   - tryOnImageUrl: string
 *   - meta: { modelVersion: string, note: string }
 * 
 * STUB: AI 기반 가상 피팅을 위한 향후 엔드포인트.
 */
router.post('/try-on', (req: Request, res: Response) => {
  try {
    const { avatarImageUrl, clothingImageUrls, pose } = req.body;

    // 입력값 검증
    if (!avatarImageUrl) {
      return res.status(400).json({ error: 'avatarImageUrl is required' });
    }
    if (!clothingImageUrls || !Array.isArray(clothingImageUrls) || clothingImageUrls.length === 0) {
      return res.status(400).json({ error: 'clothingImageUrls array is required' });
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 👗 Virtual try-on request:`, {
      avatarImageUrl,
      clothingCount: clothingImageUrls.length,
      clothingUrls: clothingImageUrls,
      pose: pose || 'default'
    });

    // STUB: 플레이스홀더 가상 피팅 결과 반환
    // TODO: 가상 피팅 AI 모델 통합
    // - 옵션: VITON-HD, HR-VITON 또는 유사 의류 전이 모델
    // - GPU 추론 서버 필요
    // - 현재는 아바타 URL을 플레이스홀더로 반환
    const tryOnImageUrl = avatarImageUrl;

    res.json({
      tryOnImageUrl,
      meta: {
        avatarUrl: avatarImageUrl,
        clothingCount: clothingImageUrls.length,
        pose: pose || 'default',
        modelVersion: 'stub-v1.0',
        processedAt: timestamp,
        note: 'STUB: Returning original avatar. Integrate virtual try-on AI model for actual garment transfer.'
      }
    });
  } catch (error: any) {
    console.error('❌ Virtual try-on error:', error);
    res.status(500).json({ error: 'Try-on failed', message: error.message });
  }
});

export default router;
