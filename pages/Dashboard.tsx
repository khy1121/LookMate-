
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Season } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const clothes = useStore((state) => state.clothes);
  const looks = useStore((state) => state.looks);
  const deleteLook = useStore((state) => state.deleteLook);
  const setActiveLookFromLook = useStore((state) => state.setActiveLookFromLook);
  
  // Recommendation
  const recommendedItems = useStore((state) => state.recommendedItems);
  const generateRecommendedItems = useStore((state) => state.generateRecommendedItems);
  const clearRecommendedItems = useStore((state) => state.clearRecommendedItems);
  const applyRecommendedToActive = useStore((state) => state.applyRecommendedToActive);

  const [selectedSeason, setSelectedSeason] = useState<Season | 'all'>('all');

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

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          안녕하세요, {user?.name}님! 👋
        </h2>
        <p className="text-gray-500">오늘의 옷장 상태를 확인해보세요.</p>
      </header>

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
          <div className="text-gray-400 text-sm mb-1">아바타</div>
          <div className="text-lg font-medium text-gray-600">
            {user?.avatarUrl ? '설정됨' : '미설정'}
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
        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 자주 사용하는 아이템 TOP 3</h3>
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
                      <img src={stat.item.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
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
        <h3 className="text-xl font-bold text-gray-800 mb-4">저장된 코디 (Looks)</h3>
        {looks.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 flex flex-col items-center justify-center">
            <span className="text-4xl mb-2">🧥</span>
            <p>아직 저장된 코디가 없습니다.</p>
            <p className="text-sm">피팅룸에서 나만의 룩을 만들어 저장해보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {looks.map((look) => (
              <div key={look.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                
                {/* Snapshot Thumbnail */}
                <div className="mb-3 aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {look.snapshotUrl ? (
                    <img
                      src={look.snapshotUrl}
                      alt={look.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">미리보기 없음</span>
                  )}
                </div>

                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">{look.name}</h4>
                    <span className="text-xs text-gray-400">
                      {new Date(look.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="bg-gray-100 text-xs px-2 py-1 rounded text-gray-500">
                    {look.items.length} items
                  </div>
                </div>

                {/* Items Preview (Mini Thumbnails) */}
                <div className="flex gap-1 mb-4 overflow-hidden h-10">
                  {look.items.slice(0, 5).map((item) => (
                    <div key={item.id} className="w-10 h-10 bg-gray-50 rounded p-1 border border-gray-100">
                      <img src={item.imageUrl} alt="" className="w-full h-full object-contain" />
                    </div>
                  ))}
                  {look.items.length > 5 && (
                    <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center text-xs text-gray-400">
                      +{look.items.length - 5}
                    </div>
                  )}
                </div>

                <div className="mt-auto flex gap-2">
                  <button 
                    onClick={() => handleLoadLook(look.id)}
                    className="flex-1 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-sm hover:bg-indigo-100 transition-colors"
                  >
                    입어보기
                  </button>
                  <button 
                    onClick={() => { if(confirm('이 코디를 삭제하시겠습니까?')) deleteLook(look.id); }}
                    className="px-3 py-2 bg-white border border-gray-200 text-gray-400 rounded-lg hover:text-red-500 hover:border-red-200 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
