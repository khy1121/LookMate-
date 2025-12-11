import express, { Request, Response } from 'express';
import { prisma } from '../db';

const router = express.Router();

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

export default router;
