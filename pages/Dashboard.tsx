
import React from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const clothes = useStore((state) => state.clothes);
  const looks = useStore((state) => state.looks);
  const deleteLook = useStore((state) => state.deleteLook);
  const setActiveLookFromLook = useStore((state) => state.setActiveLookFromLook);

  const handleLoadLook = (lookId: string) => {
    setActiveLookFromLook(lookId);
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
