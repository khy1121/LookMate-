import express, { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';

const router = express.Router();

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 이메일로 사용자를 찾고, 없으면 새로 생성하는 헬퍼 함수
 * 프론트엔드가 localStorage 기반이므로, 백엔드는 이메일로 User를 매핑
 */
async function getOrCreateUserByEmail(email: string, displayName?: string) {
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // displayName이 없으면 이메일 앞부분 사용
    const name = displayName || email.split('@')[0];
    user = await prisma.user.create({
      data: {
        email,
        name,
        displayName: name,
      },
    });
    console.log(`✅ 새 사용자 생성: ${email} (id: ${user.id})`);
  }

  return user;
}

// ============================================
// 읽기 API
// ============================================

/**
 * GET /api/data/closet
 * 사용자의 모든 옷장 아이템 조회
 * 
 * Query params:
 *   - userId (required): 사용자 ID
 * 
 * Response:
 *   - items: ClothingItem[] (frontend 타입과 호환)
 */
router.get('/closet', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [GET] /api/data/closet userId=${userId}`);

    const items = await prisma.clothingItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // DB 모델을 frontend 호환 형식으로 변환
    const formattedItems = items.map(item => ({
      id: item.id,
      userId: item.userId,
      imageUrl: item.imageUrl,
      originalImageUrl: item.originalImageUrl,
      category: item.category,
      color: item.color,
      season: item.season || undefined,
      brand: item.brand || undefined,
      size: item.size || undefined,
      memo: item.memo || undefined,
      isFavorite: item.isFavorite,
      shoppingUrl: item.shoppingUrl || undefined,
      price: item.price || undefined,
      isPurchased: item.isPurchased || false,
      createdAt: item.createdAt.getTime(), // Convert DateTime to timestamp
      tags: item.tags ? JSON.parse(item.tags) : [],
    }));

    console.log(`  → Returned ${formattedItems.length} items`);

    res.json({ items: formattedItems });
  } catch (error: any) {
    console.error('❌ /api/data/closet error:', error);
    res.status(500).json({ error: 'Failed to fetch closet items', message: error.message });
  }
});

/**
 * GET /api/data/looks
 * 사용자의 모든 룩 조회
 * 
 * Query params:
 *   - userId (required): 사용자 ID
 * 
 * Response:
 *   - looks: Look[] (snapshotUrl, items, layers 포함)
 */
router.get('/looks', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [GET] /api/data/looks userId=${userId}`);

    const looks = await prisma.look.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // 모든 룩에서 고유 아이템 ID 추출
    const allItemIds = new Set<string>();
    looks.forEach(look => {
      const itemIds = JSON.parse(look.itemIds);
      itemIds.forEach((id: string) => allItemIds.add(id));
    });

    // 한 번의 쿼리로 모든 아이템 조회
    const items = await prisma.clothingItem.findMany({
      where: { id: { in: Array.from(allItemIds) } },
    });

    const itemsMap = new Map(items.map(item => [item.id, item]));

    // DB 모델을 frontend 호환 형식으로 변환
    const formattedLooks = looks.map(look => {
      const itemIds = JSON.parse(look.itemIds);
      const lookItems = itemIds.map((id: string) => {
        const item = itemsMap.get(id);
        if (!item) return null;
        
        return {
          id: item.id,
          userId: item.userId,
          imageUrl: item.imageUrl,
          originalImageUrl: item.originalImageUrl,
          category: item.category,
          color: item.color,
          season: item.season || undefined,
          brand: item.brand || undefined,
          size: item.size || undefined,
          memo: item.memo || undefined,
          isFavorite: item.isFavorite,
          shoppingUrl: item.shoppingUrl || undefined,
          price: item.price || undefined,
          isPurchased: item.isPurchased || false,
          createdAt: item.createdAt.getTime(),
          tags: item.tags ? JSON.parse(item.tags) : [],
        };
      }).filter(Boolean);

      return {
        id: look.id,
        userId: look.userId,
        name: look.name,
        items: lookItems,
        layers: JSON.parse(look.layers),
        snapshotUrl: look.snapshotUrl || undefined,
        isPublic: look.isPublic,
        publicId: undefined, // Will be populated if public
        tags: JSON.parse(look.tags),
        createdAt: look.createdAt.getTime(),
      };
    });

    console.log(`  → Returned ${formattedLooks.length} looks`);

    res.json({ looks: formattedLooks });
  } catch (error: any) {
    console.error('❌ /api/data/looks error:', error);
    res.status(500).json({ error: 'Failed to fetch looks', message: error.message });
  }
});

/**
 * GET /api/data/public-looks
 * 공개 룩 피드 조회
 * 
 * Query params:
 *   - limit (optional): 반환할 룩 개수 (기본값: 20)
 *   - sort (optional): 'likes' | 'latest' (기본값: 'latest')
 * 
 * Response:
 *   - publicLooks: PublicLook[]
 */
router.get('/public-looks', async (req: Request, res: Response) => {
  try {
    const { limit = '20', sort = 'latest' } = req.query;
    const limitNum = parseInt(limit as string, 10) || 20;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [GET] /api/data/public-looks limit=${limitNum} sort=${sort}`);

    const orderBy = sort === 'likes'
      ? { likesCount: 'desc' as const }
      : { createdAt: 'desc' as const };

    const publicLooks = await prisma.publicLook.findMany({
      take: limitNum,
      orderBy,
    });

    // DB 모델을 frontend 호환 형식으로 변환
    const formattedLooks = publicLooks.map(pl => ({
      publicId: pl.publicId,
      name: '', // Not stored in PublicLook, could join with Look if needed
      ownerName: pl.ownerName,
      ownerId: pl.ownerId,
      ownerEmail: pl.ownerEmail,
      snapshotUrl: pl.snapshotUrl || null,
      items: JSON.parse(pl.itemsSnapshot), // Already in correct format from seed
      likesCount: pl.likesCount,
      bookmarksCount: pl.bookmarksCount,
      createdAt: pl.createdAt.getTime(),
      tags: JSON.parse(pl.tags),
    }));

    console.log(`  → Returned ${formattedLooks.length} public looks`);

    res.json({ publicLooks: formattedLooks });
  } catch (error: any) {
    console.error('❌ /api/data/public-looks error:', error);
    res.status(500).json({ error: 'Failed to fetch public looks', message: error.message });
  }
});

/**
 * POST /api/data/public-looks
 * 공개 피드에 룩을 올리는 API
 * 
 * Request body:
 *  - email (string, required): 현재 사용자 이메일
 *  - displayName (string, optional)
 *  - lookId (string, required): 공개하려는 Look의 ID
 *
 * Response:
 *  - publicLook: PublicLook (frontend 호환 형식)
 */
router.post('/public-looks', async (req: Request, res: Response) => {
  try {
    const { email, displayName, lookId } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: '이메일이 필요합니다' });
    }
    if (!lookId || typeof lookId !== 'string') {
      return res.status(400).json({ error: 'lookId가 필요합니다' });
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [POST] /api/data/public-looks email=${email} lookId=${lookId}`);

    // 사용자 찾기
    const user = await getOrCreateUserByEmail(email, displayName);

    // 룩 존재 및 소유자 확인
    const look = await prisma.look.findUnique({ where: { id: lookId } });
    if (!look) return res.status(404).json({ error: '룩을 찾을 수 없습니다' });
    if (look.userId !== user.id) return res.status(403).json({ error: '권한이 없습니다' });

    // 이미 공개된 PublicLook이 있는지 확인
    let existing = await prisma.publicLook.findUnique({ where: { lookId } });
    if (existing) {
      // 이미 공개된 상태면 그대로 반환
      const formatted = {
        publicId: existing.publicId,
        name: look.name,
        ownerName: existing.ownerName,
        ownerId: existing.ownerId,
        ownerEmail: existing.ownerEmail,
        snapshotUrl: existing.snapshotUrl || null,
        items: JSON.parse(existing.itemsSnapshot),
        likesCount: existing.likesCount,
        bookmarksCount: existing.bookmarksCount,
        createdAt: existing.createdAt.getTime(),
        tags: JSON.parse(existing.tags),
      };
      return res.json({ publicLook: formatted });
    }

    // 아이템 스냅샷 생성
    const itemIds = JSON.parse(look.itemIds);
    const items = await prisma.clothingItem.findMany({ where: { id: { in: itemIds } } });
    const itemsSnapshot = items.map(item => ({
      id: item.id,
      imageUrl: item.imageUrl,
      category: item.category,
      color: item.color,
      tags: item.tags ? JSON.parse(item.tags) : [],
    }));

    // publicId 생성 (간단한 URL-friendly ID)
    const publicId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

    // PublicLook 생성
    const createData: Prisma.PublicLookUncheckedCreateInput = {
      lookId: look.id,
      publicId,
      ownerName: user.displayName || user.name,
      ownerEmail: user.email,
      ownerId: user.id,
      snapshotUrl: look.snapshotUrl || null,
      itemsSnapshot: JSON.stringify(itemsSnapshot),
      tags: JSON.stringify(look.tags ? JSON.parse(look.tags) : []),
    };

    const pl = await prisma.publicLook.create({
      data: createData,
    });

    // 룩을 공개 상태로 표시
    await prisma.look.update({ where: { id: look.id }, data: { isPublic: true } });

    const formatted = {
      publicId: pl.publicId,
      name: look.name,
      ownerName: pl.ownerName,
      ownerId: pl.ownerId,
      ownerEmail: pl.ownerEmail,
      snapshotUrl: pl.snapshotUrl || null,
      items: itemsSnapshot,
      likesCount: pl.likesCount,
      bookmarksCount: pl.bookmarksCount,
      createdAt: pl.createdAt.getTime(),
      tags: JSON.parse(pl.tags),
    };

    console.log(`  → PublicLook 생성: ${pl.publicId}`);
    res.status(201).json({ publicLook: formatted });
  } catch (error: any) {
    console.error('❌ POST /api/data/public-looks error:', error);
    res.status(500).json({ error: '공개 룩 생성 실패', message: error.message });
  }
});

/**
 * DELETE /api/data/public-looks/:publicId
 * 공개 피드에서 룩을 삭제(공개 해제)하는 API
 * 
 * Request params:
 *  - publicId: PublicLook의 publicId
 * Request body:
 *  - email (string, optional): 소유자 확인용 이메일 (제공 시 검증)
 */
router.delete('/public-looks/:publicId', async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;
    const { email } = req.body || {};

    if (!publicId || typeof publicId !== 'string') return res.status(400).json({ error: 'publicId가 필요합니다' });

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DELETE] /api/data/public-looks/${publicId} email=${email ?? 'none'}`);

    const pl = await prisma.publicLook.findUnique({ where: { publicId } });
    if (!pl) return res.status(404).json({ error: '공개 룩을 찾을 수 없습니다' });

    if (email) {
      if (typeof email !== 'string') return res.status(400).json({ error: '이메일 형식이 올바르지 않습니다' });
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
      if (pl.ownerEmail !== user.email) return res.status(403).json({ error: '삭제 권한이 없습니다' });
    }

    // 연결된 룩이 있으면 isPublic false로 업데이트
    try {
      await prisma.look.updateMany({ where: { id: pl.lookId }, data: { isPublic: false } });
    } catch (e) {
      // 실패해도 진행
      console.warn('룩 공개 상태 업데이트 실패:', e);
    }

    await prisma.publicLook.delete({ where: { publicId } });

    console.log(`  → PublicLook 삭제: ${publicId}`);
    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ DELETE /api/data/public-looks/:publicId error:', error);
    res.status(500).json({ error: '공개 룩 삭제 실패', message: error.message });
  }
});

// ============================================
// 쓰기 API - 옷장 (ClothingItem)
// ============================================

/**
 * POST /api/data/closet
 * 옷장에 새 옷을 추가하는 API (사용자 이메일 기준)
 * 
 * Request body:
 *   - email (string, required): 현재 로그인한 사용자의 이메일
 *   - displayName (string, optional): 사용자 표시 이름
 *   - item (object, required): ClothingItem 필드들 (id, userId, createdAt 제외)
 * 
 * Response:
 *   - item: ClothingItem (frontend 타입)
 */
router.post('/closet', async (req: Request, res: Response) => {
  try {
    const { email, displayName, item } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: '이메일이 필요합니다' });
    }

    if (!item || typeof item !== 'object') {
      return res.status(400).json({ error: '옷 정보가 필요합니다' });
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [POST] /api/data/closet email=${email}`);

    // 사용자 찾기 또는 생성
    const user = await getOrCreateUserByEmail(email, displayName);

    // ClothingItem 생성
    const newItem = await prisma.clothingItem.create({
      data: {
        userId: user.id,
        category: item.category,
        imageUrl: item.imageUrl,
        originalImageUrl: item.originalImageUrl,
        color: item.color,
        season: item.season || null,
        brand: item.brand || null,
        size: item.size || null,
        tags: JSON.stringify(item.tags || []),
        memo: item.memo || null,
        isFavorite: item.isFavorite ?? false,
        shoppingUrl: item.shoppingUrl || null,
        price: item.price || null,
        isPurchased: item.isPurchased ?? false,
      },
    });

    // Frontend 형식으로 변환
    const formattedItem = {
      id: newItem.id,
      userId: newItem.userId,
      imageUrl: newItem.imageUrl,
      originalImageUrl: newItem.originalImageUrl,
      category: newItem.category,
      color: newItem.color,
      season: newItem.season || undefined,
      brand: newItem.brand || undefined,
      size: newItem.size || undefined,
      memo: newItem.memo || undefined,
      isFavorite: newItem.isFavorite,
      shoppingUrl: newItem.shoppingUrl || undefined,
      price: newItem.price || undefined,
      isPurchased: newItem.isPurchased,
      createdAt: newItem.createdAt.getTime(),
      tags: JSON.parse(newItem.tags),
    };

    console.log(`  → 옷 추가 성공: ${newItem.id}`);

    res.status(201).json({ item: formattedItem });
  } catch (error: any) {
    console.error('❌ POST /api/data/closet error:', error);
    res.status(500).json({ error: '옷 추가 실패', message: error.message });
  }
});

/**
 * PUT /api/data/closet/:id
 * 옷장 아이템 수정 API (소유자 확인 포함)
 * 
 * Request params:
 *   - id: ClothingItem ID
 * 
 * Request body:
 *   - email (string, required): 권한 확인용 이메일
 *   - patch (object, required): 수정할 필드들
 * 
 * Response:
 *   - item: ClothingItem (수정된)
 */
router.put('/closet/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, patch } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: '이메일이 필요합니다' });
    }

    if (!patch || typeof patch !== 'object') {
      return res.status(400).json({ error: '수정할 데이터가 필요합니다' });
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [PUT] /api/data/closet/${id} email=${email}`);

    // 사용자 찾기
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 아이템 소유자 확인
    const existingItem = await prisma.clothingItem.findUnique({ where: { id } });
    if (!existingItem) {
      return res.status(404).json({ error: '옷을 찾을 수 없습니다' });
    }

    if (existingItem.userId !== user.id) {
      return res.status(403).json({ error: '수정 권한이 없습니다' });
    }

    // 업데이트용 데이터 준비
    const updateData: any = {};
    if (patch.category !== undefined) updateData.category = patch.category;
    if (patch.color !== undefined) updateData.color = patch.color;
    if (patch.season !== undefined) updateData.season = patch.season || null;
    if (patch.brand !== undefined) updateData.brand = patch.brand || null;
    if (patch.size !== undefined) updateData.size = patch.size || null;
    if (patch.memo !== undefined) updateData.memo = patch.memo || null;
    if (patch.isFavorite !== undefined) updateData.isFavorite = patch.isFavorite;
    if (patch.shoppingUrl !== undefined) updateData.shoppingUrl = patch.shoppingUrl || null;
    if (patch.price !== undefined) updateData.price = patch.price || null;
    if (patch.isPurchased !== undefined) updateData.isPurchased = patch.isPurchased;
    if (patch.tags !== undefined) updateData.tags = JSON.stringify(patch.tags);

    // 업데이트 실행
    const updatedItem = await prisma.clothingItem.update({
      where: { id },
      data: updateData,
    });

    // Frontend 형식으로 변환
    const formattedItem = {
      id: updatedItem.id,
      userId: updatedItem.userId,
      imageUrl: updatedItem.imageUrl,
      originalImageUrl: updatedItem.originalImageUrl,
      category: updatedItem.category,
      color: updatedItem.color,
      season: updatedItem.season || undefined,
      brand: updatedItem.brand || undefined,
      size: updatedItem.size || undefined,
      memo: updatedItem.memo || undefined,
      isFavorite: updatedItem.isFavorite,
      shoppingUrl: updatedItem.shoppingUrl || undefined,
      price: updatedItem.price || undefined,
      isPurchased: updatedItem.isPurchased,
      createdAt: updatedItem.createdAt.getTime(),
      tags: JSON.parse(updatedItem.tags),
    };

    console.log(`  → 옷 수정 성공: ${id}`);

    res.json({ item: formattedItem });
  } catch (error: any) {
    console.error('❌ PUT /api/data/closet/:id error:', error);
    res.status(500).json({ error: '옷 수정 실패', message: error.message });
  }
});

/**
 * DELETE /api/data/closet/:id
 * 옷장 아이템 삭제 API (소유자 확인 포함)
 * 
 * Request params:
 *   - id: ClothingItem ID
 * 
 * Request body:
 *   - email (string, required): 권한 확인용 이메일
 * 
 * Response:
 *   - success: true
 */
router.delete('/closet/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: '이메일이 필요합니다' });
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DELETE] /api/data/closet/${id} email=${email}`);

    // 사용자 찾기
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 아이템 소유자 확인
    const existingItem = await prisma.clothingItem.findUnique({ where: { id } });
    if (!existingItem) {
      return res.status(404).json({ error: '옷을 찾을 수 없습니다' });
    }

    if (existingItem.userId !== user.id) {
      return res.status(403).json({ error: '삭제 권한이 없습니다' });
    }

    // 삭제 실행
    await prisma.clothingItem.delete({ where: { id } });

    console.log(`  → 옷 삭제 성공: ${id}`);

    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ DELETE /api/data/closet/:id error:', error);
    res.status(500).json({ error: '옷 삭제 실패', message: error.message });
  }
});

// ============================================
// 쓰기 API - 룩 (Look)
// ============================================

/**
 * POST /api/data/looks
 * 새 룩을 저장하는 API (사용자 이메일 기준)
 * 
 * Request body:
 *   - email (string, required): 현재 로그인한 사용자의 이메일
 *   - displayName (string, optional): 사용자 표시 이름
 *   - look (object, required): Look 필드들 (id, userId, createdAt 제외)
 *     - name: 룩 이름
 *     - itemIds: 옷 ID 배열
 *     - layers: FittingLayer 배열
 *     - snapshotUrl: 스냅샷 이미지 URL
 *     - isPublic: 공개 여부
 *     - tags: 태그 배열
 * 
 * Response:
 *   - look: Look (frontend 타입, items 포함)
 */
router.post('/looks', async (req: Request, res: Response) => {
  try {
    const { email, displayName, look } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: '이메일이 필요합니다' });
    }

    if (!look || typeof look !== 'object') {
      return res.status(400).json({ error: '룩 정보가 필요합니다' });
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [POST] /api/data/looks email=${email}`);

    // 사용자 찾기 또는 생성
    const user = await getOrCreateUserByEmail(email, displayName);

    // Look 생성
    const newLook = await prisma.look.create({
      data: {
        userId: user.id,
        name: look.name,
        itemIds: JSON.stringify(look.itemIds || []),
        layers: JSON.stringify(look.layers || []),
        snapshotUrl: look.snapshotUrl || null,
        isPublic: look.isPublic ?? false,
        tags: JSON.stringify(look.tags || []),
      },
    });

    // 연관 아이템 조회
    const itemIds = JSON.parse(newLook.itemIds);
    const items = await prisma.clothingItem.findMany({
      where: { id: { in: itemIds } },
    });

    const formattedItems = items.map(item => ({
      id: item.id,
      userId: item.userId,
      imageUrl: item.imageUrl,
      originalImageUrl: item.originalImageUrl,
      category: item.category,
      color: item.color,
      season: item.season || undefined,
      brand: item.brand || undefined,
      size: item.size || undefined,
      memo: item.memo || undefined,
      isFavorite: item.isFavorite,
      shoppingUrl: item.shoppingUrl || undefined,
      price: item.price || undefined,
      isPurchased: item.isPurchased,
      createdAt: item.createdAt.getTime(),
      tags: JSON.parse(item.tags),
    }));

    // Frontend 형식으로 변환
    const formattedLook = {
      id: newLook.id,
      userId: newLook.userId,
      name: newLook.name,
      items: formattedItems,
      layers: JSON.parse(newLook.layers),
      snapshotUrl: newLook.snapshotUrl || undefined,
      isPublic: newLook.isPublic,
      publicId: undefined,
      tags: JSON.parse(newLook.tags),
      createdAt: newLook.createdAt.getTime(),
    };

    console.log(`  → 룩 저장 성공: ${newLook.id}`);

    res.status(201).json({ look: formattedLook });
  } catch (error: any) {
    console.error('❌ POST /api/data/looks error:', error);
    res.status(500).json({ error: '룩 저장 실패', message: error.message });
  }
});

/**
 * DELETE /api/data/looks/:id
 * 룩 삭제 API (소유자 확인 포함)
 * 
 * Request params:
 *   - id: Look ID
 * 
 * Request body:
 *   - email (string, required): 권한 확인용 이메일
 * 
 * Response:
 *   - success: true
 */
router.delete('/looks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: '이메일이 필요합니다' });
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DELETE] /api/data/looks/${id} email=${email}`);

    // 사용자 찾기
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 룩 소유자 확인
    const existingLook = await prisma.look.findUnique({ where: { id } });
    if (!existingLook) {
      return res.status(404).json({ error: '룩을 찾을 수 없습니다' });
    }

    if (existingLook.userId !== user.id) {
      return res.status(403).json({ error: '삭제 권한이 없습니다' });
    }

    // 삭제 실행
    await prisma.look.delete({ where: { id } });

    console.log(`  → 룩 삭제 성공: ${id}`);

    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ DELETE /api/data/looks/:id error:', error);
    res.status(500).json({ error: '룩 삭제 실패', message: error.message });
  }
});

export default router;
