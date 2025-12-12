
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useUiStore } from '../store/useUiStore';
import { useNavigate } from 'react-router-dom';
import { Season } from '../types';
import { LookCard } from '../components/common/LookCard';
import { SectionHeader } from '../components/common/SectionHeader';
import { dataService } from '../services/dataService';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const currentUser = useStore((state) => state.currentUser);
  const clothes = useStore((state) => state.clothes);
  const looks = useStore((state) => state.looks);
  const myPublicLooks = useStore((state) => state.myPublicLooks);
  const isMyPublicLooksLoading = useStore((state) => state.isMyPublicLooksLoading);
  const deleteLook = useStore((state) => state.deleteLook);
  const setActiveLookFromLook = useStore((state) => state.setActiveLookFromLook);
  const publishLook = useStore((state) => state.publishLook);
  const unpublishPublicLook = useStore((state) => state.unpublishPublicLook);
  const showToast = useUiStore((state) => state.showToast);
  
  // Recommendation
  const recommendedItems = useStore((state) => state.recommendedItems);
  const generateRecommendedItems = useStore((state) => state.generateRecommendedItems);
  const clearRecommendedItems = useStore((state) => state.clearRecommendedItems);
  const applyRecommendedToActive = useStore((state) => state.applyRecommendedToActive);

  const USE_BACKEND_DATA = !!import.meta.env.VITE_API_BASE_URL;

  const [selectedSeason, setSelectedSeason] = useState<Season | 'all'>('all');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [unpublishingMap, setUnpublishingMap] = useState<Record<string, boolean>>({});

  // 사용 통계 계산
  const itemUsageStats = useMemo(() => {
    const usageMap = new Map<string, { item: any; count: number; lastUsedAt: number | null }>();

    // looks를 순회하면서 아이템 사용 횟수 계산
    looks.forEach((look) => {
      look.items.forEach((item) => {
        const existing = usageMap.get(item.id);
        if (existing) {
          existing.count += 1;
          existing.lastUsedAt = Math.max(existing.lastUsedAt || 0, look.createdAt);
        } else {
          usageMap.set(item.id, {
            item,
            count: 1,
            lastUsedAt: look.createdAt,
          });
        }
      });
    });

    // count 기준 내림차순 정렬
    return Array.from(usageMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // TOP 3만
  }, [looks]);

  // 쇼핑 통계 계산
  const shoppingStats = useMemo(() => {
    const totalItems = clothes.length;
    const purchasedCount = clothes.filter(item => item.isPurchased).length;
    const unpurchasedCount = totalItems - purchasedCount;
    const purchaseRate = totalItems > 0 ? Math.round((purchasedCount / totalItems) * 100) : 0;

    return { totalItems, purchasedCount, unpurchasedCount, purchaseRate };
  }, [clothes]);

  const handleLoadLook = (lookId: string) => {
    setActiveLookFromLook(lookId);
    navigate('/app/fitting');
  };

  const handleGenerateRecommendation = () => {
    if (selectedSeason === 'all') {
      generateRecommendedItems();
    } else {
      generateRecommendedItems({ season: selectedSeason });
    }
  };

  const handleApplyRecommendation = () => {
    applyRecommendedToActive();
    navigate('/app/fitting');
  };

  const handlePublishLook = async (lookId: string, tags?: string[]) => {
    setPublishingId(lookId);
    try {
      await publishLook(lookId, tags);
    } finally {
      setPublishingId(null);
    }
  };

  const handleUnpublishPublicLook = async (publicId: string) => {
    if (!currentUser) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }
    const confirmed = window.confirm('정말로 공개를 해제하고 삭제할까요?');
    if (!confirmed) return;

    setUnpublishingMap((prev) => ({ ...prev, [publicId]: true }));
    try {
      if (USE_BACKEND_DATA) {
        await dataService.deletePublicLook(publicId, currentUser.email);
      }
      unpublishPublicLook(publicId);
      showToast('공개 코디가 삭제되었습니다.', 'success');
    } catch (error) {
      console.error('[Dashboard] 공개 코디 삭제 실패:', error);
      showToast('삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    } finally {
      setUnpublishingMap((prev) => {
        const next = { ...prev };
        delete next[publicId];
        return next;
      });
    }
  };

  const profileDisplayName = currentUser?.displayName ?? user?.displayName ?? user?.name ?? '이름 없음';
  const profileEmail = currentUser?.email ?? user?.email ?? '이메일 없음';
  const profileHeight = (currentUser as any)?.height ?? (user as any)?.height;
  const profileBodyType = (currentUser as any)?.bodyType ?? (user as any)?.bodyType;
  const profileGender = (currentUser as any)?.gender ?? (user as any)?.gender;
  const bodyTypeLabelMap: Record<string, string> = {
    slim: '슬림형',
    normal: '보통 체형',
    athletic: '탄탄한 체형',
    chubby: '통통한 체형',
  };
  const genderLabelMap: Record<string, string> = {
    male: '남성',
    female: '여성',
    unisex: '공용',
  };
  const hasProfileDetail = Boolean(profileHeight || profileBodyType || profileGender);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          안녕하세요, {user?.name}님! 👋
        </h2>
        <p className="text-gray-500">오늘의 옷장 상태를 확인해보세요.</p>
      </header>

      {/* 내 프로필 요약 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">내 프로필</h3>
            <p className="text-sm text-gray-500">로그인 정보와 저장된 신체 정보를 확인하세요.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-gray-500 text-xs mb-1">사용자 이름</div>
            <div className="font-semibold text-gray-800 truncate">{profileDisplayName}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-gray-500 text-xs mb-1">이메일</div>
            <div className="font-semibold text-gray-800 truncate">{profileEmail}</div>
          </div>
        </div>

        {hasProfileDetail ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-gray-500 text-xs mb-1">키</div>
              <div className="font-semibold text-gray-800">{profileHeight ? `${profileHeight}cm` : '미입력'}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-gray-500 text-xs mb-1">체형</div>
              <div className="font-semibold text-gray-800">
                {profileBodyType ? bodyTypeLabelMap[profileBodyType] ?? profileBodyType : '미입력'}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-gray-500 text-xs mb-1">성별</div>
              <div className="font-semibold text-gray-800">
                {profileGender ? genderLabelMap[profileGender] ?? profileGender : '미입력'}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-600">
            아직 프로필 정보가 없습니다. 아바타 화면에서 몸 정보를 저장해보세요.
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-400 text-sm mb-1">총 의류</div>
          <div className="text-3xl font-bold text-gray-800">{clothes.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-400 text-sm mb-1">즐겨찾기</div>
          <div className="text-3xl font-bold text-pink-500">
            {clothes.filter(c => c.isFavorite).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-400 text-sm mb-1">생성한 룩</div>
          <div className="text-3xl font-bold text-indigo-500">{looks.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-400 text-sm mb-1">구매 현황</div>
          <div className="text-lg font-bold text-blue-600">
            {shoppingStats.purchasedCount} / {shoppingStats.totalItems}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            구매율 {shoppingStats.purchaseRate}%
          </div>
        </div>
      </div>

      {/* Shopping Summary */}
      {shoppingStats.unpurchasedCount > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">🛒 쇼핑 상태 요약</h3>
              <p className="text-sm text-gray-600">
                전체 <strong>{shoppingStats.totalItems}벌</strong> 중 
                <strong className="text-blue-600"> {shoppingStats.purchasedCount}벌 구매 완료</strong>, 
                <strong className="text-green-600"> {shoppingStats.unpurchasedCount}벌 관심 상품</strong>
              </p>
            </div>
            <button
              onClick={() => navigate('/app/closet')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
            >
              관심상품 보기
            </button>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 bg-white rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${shoppingStats.purchaseRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Explore & Discover Quick Links */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">🌐 인기 코디 둘러보기</h3>
              <p className="text-sm text-gray-600 mb-3">
                인기 코디에서 유사 상품을 찾고, 내 옷장에 바로 추가해보세요.
              </p>
              <button
                onClick={() => navigate('/app/explore')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                Explore 바로가기
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-orange-50 p-6 rounded-2xl border border-pink-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">📷 이미지로 유사 상품 찾기</h3>
              <p className="text-sm text-gray-600 mb-3">
                스크린샷만 올리면 비슷한 상품을 찾고, 한 번에 옷장에 담을 수 있어요.
              </p>
              <button
                onClick={() => navigate('/app/discover')}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-bold hover:bg-pink-700 transition-colors"
              >
                Discover 바로가기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 오늘의 추천 코디 섹션 */}
      <div className="my-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🎨 오늘의 추천 코디</h3>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value as Season | 'all')}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">전체 시즌</option>
              <option value="spring">봄</option>
              <option value="summer">여름</option>
              <option value="fall">가을</option>
              <option value="winter">겨울</option>
            </select>
            <button
              onClick={handleGenerateRecommendation}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              추천 코디 생성
            </button>
            {recommendedItems && recommendedItems.length > 0 && (
              <>
                <button
                  onClick={handleApplyRecommendation}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
                >
                  피팅룸에서 입어보기
                </button>
                <button
                  onClick={clearRecommendedItems}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                >
                  초기화
                </button>
              </>
            )}
          </div>

          {!recommendedItems ? (
            <div className="text-center py-8 text-gray-400">
              <span className="text-4xl mb-2 block">✨</span>
              <p>시즌을 선택하고 '추천 코디 생성' 버튼을 눌러보세요.</p>
              <p className="text-sm mt-1">AI가 옷장에서 조화로운 코디를 추천해드립니다.</p>
            </div>
          ) : recommendedItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <span className="text-4xl mb-2 block">🤷</span>
              <p>추천할 수 있는 코디가 없습니다.</p>
              <p className="text-sm mt-1">옷을 더 업로드하거나 다른 시즌을 선택해보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {recommendedItems.map((item) => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="aspect-square bg-white rounded-lg mb-2 p-2 flex items-center justify-center overflow-hidden">
                    <img src={item.imageUrl} alt={item.category} className="max-w-full max-h-full object-contain" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700 truncate">{item.category}</p>
                  <p className="text-xs text-gray-500 truncate">{item.color}</p>
                  {item.season && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">
                      {item.season === 'spring' && '봄'}
                      {item.season === 'summer' && '여름'}
                      {item.season === 'fall' && '가을'}
                      {item.season === 'winter' && '겨울'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 사용 통계 섹션 */}
      <div className="my-8">
        <SectionHeader title="📊 자주 사용하는 아이템 TOP 3" />
        {itemUsageStats.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400">
            <span className="text-4xl mb-2 block">📈</span>
            <p>아직 저장된 룩이 없어 통계를 표시할 수 없습니다.</p>
            <p className="text-sm mt-1">피팅룸에서 코디를 만들고 저장해보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {itemUsageStats.map((stat, index) => (
              <div key={stat.item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex gap-3 mb-3">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg p-2 flex items-center justify-center">
                      <img src={stat.item.imageUrl} alt={`${stat.item.category} - ${stat.item.color}`} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{stat.item.category}</p>
                    <p className="text-sm text-gray-500 truncate">{stat.item.color}</p>
                    {stat.item.brand && (
                      <p className="text-xs text-gray-400 truncate">{stat.item.brand}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">사용 횟수</span>
                    <span className="font-bold text-indigo-600">{stat.count}회</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">마지막 사용</span>
                    <span className="text-gray-700">
                      {stat.lastUsedAt
                        ? new Date(stat.lastUsedAt).toLocaleDateString()
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="my-8">
        <SectionHeader title="저장된 코디 (Looks)" />
        {looks.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 flex flex-col items-center justify-center">
            <span className="text-4xl mb-2">🧥</span>
            <p>아직 저장된 코디가 없습니다.</p>
            <p className="text-sm">피팅룸에서 나만의 룩을 만들어 저장해보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {looks.map((look) => (
              <LookCard
                key={look.id}
                snapshotUrl={look.snapshotUrl}
                name={look.name}
                tags={[]}
                onClick={() => handleLoadLook(look.id)}
                footerSlot={
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleLoadLook(look.id); }}
                      className="flex-1 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-sm hover:bg-indigo-100 transition-colors"
                    >
                      입어보기
                    </button>
                <button
                  type="button"
                  disabled={!!look.isPublic || publishingId === look.id}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handlePublishLook(look.id, look.tags || []); 
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    look.isPublic
                      ? 'bg-green-50 text-green-600 cursor-not-allowed'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-200'
                  } ${publishingId === look.id ? 'opacity-60 cursor-wait' : ''}`}
                >
                  {look.isPublic ? '이미 공개됨' : publishingId === look.id ? '올리는 중...' : '공개 피드에 올리기'}
                </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); if(confirm('이 코디를 삭제하시겠습니까?')) deleteLook(look.id); }}
                      className="px-3 py-2 bg-white border border-gray-200 text-gray-400 rounded-lg hover:text-red-500 hover:border-red-200 transition-colors"
                      aria-label={`${look.name} 삭제`}
                    >
                      🗑️
                    </button>
                  </div>
                }
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <span className="text-xs text-gray-400 block">
                      {new Date(look.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="bg-gray-100 text-xs px-2 py-1 rounded text-gray-500">
                    {look.items.length} items
                  </div>
                </div>
                <div className="flex gap-1 overflow-hidden h-10">
                  {look.items.slice(0, 5).map((item) => (
                    <div key={item.id} className="w-10 h-10 bg-gray-50 rounded p-1 border border-gray-100">
                      <img src={item.imageUrl} alt={item.category} className="w-full h-full object-contain" />
                    </div>
                  ))}
                  {look.items.length > 5 && (
                    <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center text-xs text-gray-400">
                      +{look.items.length - 5}
                    </div>
                  )}
                </div>
              </LookCard>
            ))}
          </div>
        )}
      </div>

      {/* 내 공개 코디 Section */}
      {currentUser && (
        <div className="my-8">
          <SectionHeader 
            title="내 공개 코디"
            subtitle="내가 공개한 코디를 한눈에 모아봅니다"
            actionSlot={
              <button
                onClick={() => navigate('/app/explore')}
                className="text-indigo-600 text-sm font-medium hover:underline"
              >
                공개 피드 보기 →
              </button>
            }
          />

          {isMyPublicLooksLoading ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
              내 공개 코디를 불러오는 중입니다...
            </div>
          ) : myPublicLooks.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400">
              <div className="text-4xl mb-3">🌐</div>
              <p className="mb-2">아직 공개한 코디가 없어요.</p>
              <p className="text-sm mb-4">피팅룸에서 코디를 저장한 뒤 공개 피드로 올려보세요.</p>
              <button
                onClick={() => navigate('/app/fitting')}
                className="text-indigo-600 font-medium hover:underline"
              >
                피팅룸으로 이동하기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPublicLooks.map((publicLook) => (
                <LookCard
                  key={publicLook.publicId}
                  snapshotUrl={publicLook.snapshotUrl}
                  name={publicLook.name || '이름 없는 코디'}
                  tags={publicLook.tags}
                  createdAt={publicLook.createdAt}
                  onClick={() => navigate(`/look/${publicLook.publicId}`)}
                  footerSlot={
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">
                        좋아요 {publicLook.likesCount} · 북마크 {publicLook.bookmarksCount}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleUnpublishPublicLook(publicLook.publicId); }}
                        disabled={!!unpublishingMap[publicLook.publicId]}
                        className={`w-full py-2 rounded-lg text-sm font-bold transition-colors border ${
                          unpublishingMap[publicLook.publicId]
                            ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                        }`}
                      >
                        {unpublishingMap[publicLook.publicId] ? '삭제 중...' : '공개 해제 / 삭제'}
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
