import React, { useState, useEffect } from 'react';
import { PublicLook, Product, ClothingItem } from '../types';
import { fetchPopularLooks } from '../services/publicLookService';
import { searchSimilarProductsByItem } from '../services/productService';
import { useStore } from '../store/useStore';

type SortOption = 'recommend' | 'likes' | 'recent';
type ProductSortOption = 'recommend' | 'priceAsc' | 'priceDesc' | 'sales';

export const Explore: React.FC = () => {
  const [looks, setLooks] = useState<PublicLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recommend');
  const [selectedLook, setSelectedLook] = useState<PublicLook | null>(null);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Product filters
  const [productSortBy, setProductSortBy] = useState<ProductSortOption>('recommend');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const addClothingFromProduct = useStore((s) => s.addClothingFromProduct);

  useEffect(() => {
    loadLooks();
  }, []);

  const loadLooks = async () => {
    setLoading(true);
    try {
      const data = await fetchPopularLooks();
      setLooks(data);
    } catch (error) {
      console.error('Failed to load looks', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedLooks = [...looks].sort((a, b) => {
    switch (sortBy) {
      case 'likes':
        return b.likeCount - a.likeCount;
      case 'recent':
        return b.createdAt - a.createdAt;
      case 'recommend':
      default:
        return b.likeCount - a.likeCount;
    }
  });

  const handleViewSimilarProducts = async (item: ClothingItem) => {
    setSelectedItem(item);
    setLoadingProducts(true);
    setProductSortBy('recommend');
    setMinPrice('');
    setMaxPrice('');
    try {
      const products = await searchSimilarProductsByItem(item, {
        sortBy: 'recommend',
        limit: 8,
      });
      setSimilarProducts(products);
    } catch (error) {
      console.error('Failed to search products', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleRefreshProducts = async () => {
    if (!selectedItem) return;
    setLoadingProducts(true);
    try {
      const products = await searchSimilarProductsByItem(selectedItem, {
        sortBy: productSortBy,
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        limit: 8,
      });
      setSimilarProducts(products);
    } catch (error) {
      console.error('Failed to search products', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddToCloset = (product: Product) => {
    addClothingFromProduct(product);
    alert(`"${product.name}"이(가) 옷장에 추가되었습니다!`);
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🌐 인기 코디 Explore</h2>
        <p className="text-gray-500">다른 사람들의 코디를 보고 내 옷장/쇼핑에 참고해보세요.</p>
      </header>

      {/* Sort Options */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSortBy('recommend')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sortBy === 'recommend'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          추천순
        </button>
        <button
          onClick={() => setSortBy('likes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sortBy === 'likes'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          좋아요순
        </button>
        <button
          onClick={() => setSortBy('recent')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sortBy === 'recent'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          최신순
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-gray-400">로딩 중...</div>
        </div>
      ) : (
        <>
          {/* Looks Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedLooks.map((look) => (
              <div
                key={look.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedLook(look)}
              >
                <div className="aspect-[3/4] bg-gray-100">
                  <img src={look.snapshotUrl} alt={look.ownerName} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {look.ownerAvatarUrl && (
                      <img src={look.ownerAvatarUrl} alt="" className="w-6 h-6 rounded-full" />
                    )}
                    <span className="text-sm font-medium text-gray-800 truncate">{look.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>❤️ {look.likeCount}</span>
                    <span>🔖 {look.bookmarkCount}</span>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {look.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail Modal */}
          {selectedLook && (
            <div
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => {
                setSelectedLook(null);
                setSelectedItem(null);
                setSimilarProducts([]);
              }}
            >
              <div
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {selectedLook.ownerAvatarUrl && (
                        <img src={selectedLook.ownerAvatarUrl} alt="" className="w-10 h-10 rounded-full" />
                      )}
                      <div>
                        <h3 className="font-bold text-gray-800">{selectedLook.ownerName}</h3>
                        <div className="flex gap-3 text-sm text-gray-500">
                          <span>❤️ {selectedLook.likeCount}</span>
                          <span>🔖 {selectedLook.bookmarkCount}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLook(null);
                        setSelectedItem(null);
                        setSimilarProducts([]);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Snapshot */}
                  <div className="mb-6">
                    <img src={selectedLook.snapshotUrl} alt="" className="w-full rounded-lg" />
                  </div>

                  {/* Tags */}
                  <div className="flex gap-2 mb-6">
                    {selectedLook.tags.map((tag, idx) => (
                      <span key={idx} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Items */}
                  <h4 className="font-bold text-gray-800 mb-3">이 코디에 포함된 아이템</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {selectedLook.items.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="aspect-square bg-white rounded mb-2 flex items-center justify-center">
                          <img src={item.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
                        </div>
                        <p className="text-xs font-semibold text-gray-700">{item.category}</p>
                        <p className="text-xs text-gray-500">{item.color}</p>
                        <button
                          onClick={() => handleViewSimilarProducts(item)}
                          className="mt-2 w-full bg-indigo-600 text-white text-xs py-1.5 rounded hover:bg-indigo-700 transition-colors"
                        >
                          유사 상품 보기
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Similar Products */}
                  {selectedItem && (
                    <div className="border-t pt-6">
                      <h4 className="font-bold text-gray-800 mb-3">
                        '{selectedItem.category}' 유사 상품 추천
                      </h4>

                      {/* Price Filters & Sort */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">최소 가격:</label>
                            <input
                              type="number"
                              value={minPrice}
                              onChange={(e) => setMinPrice(e.target.value)}
                              placeholder="0"
                              className="w-28 px-3 py-1.5 border border-gray-300 rounded text-sm"
                            />
                            <span className="text-sm text-gray-500">원</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">최대 가격:</label>
                            <input
                              type="number"
                              value={maxPrice}
                              onChange={(e) => setMaxPrice(e.target.value)}
                              placeholder="∞"
                              className="w-28 px-3 py-1.5 border border-gray-300 rounded text-sm"
                            />
                            <span className="text-sm text-gray-500">원</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <label className="text-sm text-gray-600">정렬:</label>
                          <select
                            value={productSortBy}
                            onChange={(e) => setProductSortBy(e.target.value as ProductSortOption)}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                          >
                            <option value="recommend">추천순</option>
                            <option value="priceAsc">가격 낮은순</option>
                            <option value="priceDesc">가격 높은순</option>
                            <option value="sales">판매량순</option>
                          </select>
                          <button
                            onClick={handleRefreshProducts}
                            className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                          >
                            필터 적용
                          </button>
                        </div>
                      </div>

                      {loadingProducts ? (
                        <div className="text-center py-8 text-gray-400">상품 검색 중...</div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {similarProducts.map((product) => (
                            <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                              <img src={product.thumbnailUrl} alt="" className="w-full aspect-[3/4] object-cover" />
                              <div className="p-2">
                                <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
                                <p className="text-xs text-gray-500 truncate">{product.brand}</p>
                                <p className="text-sm font-bold text-gray-900 mt-1">
                                  ₩{product.price.toLocaleString()}
                                </p>
                                <div className="flex gap-1 mt-2">
                                  <button
                                    onClick={() => handleAddToCloset(product)}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 rounded transition-colors"
                                  >
                                    + 옷장에 추가
                                  </button>
                                  <button
                                    onClick={() => window.open(product.productUrl, '_blank', 'noopener,noreferrer')}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1.5 rounded transition-colors"
                                  >
                                    구매하기
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
