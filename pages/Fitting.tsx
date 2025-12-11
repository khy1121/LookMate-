
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';

export const Fitting: React.FC = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const clothes = useStore((state) => state.clothes);
  const activeLook = useStore((state) => state.activeLook);
  const updateLayer = useStore((state) => state.updateLayer);
  const removeItemFromActiveLook = useStore((state) => state.removeItemFromActiveLook);
  const clearActiveLook = useStore((state) => state.clearActiveLook);
  const createLookFromActive = useStore((state) => state.createLookFromActive);

  const layers = activeLook?.layers || [];
  
  // Local state for Look Name input
  const [lookName, setLookName] = useState('');
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // activeLook이 바뀌거나 로드되면 이름을 동기화
  useEffect(() => {
    if (activeLook?.name) {
      setLookName(activeLook.name);
    } else {
      setLookName('');
    }
  }, [activeLook?.name]);

  const handleSaveLook = async () => {
    if (!activeLook || layers.length === 0) {
      alert('저장할 코디가 없습니다.');
      return;
    }
    if (!lookName.trim()) {
      alert('코디 이름을 입력해주세요.');
      return;
    }

    if (!canvasRef.current) {
      // 캔버스 ref를 못 찾으면 snapshot 없이 저장
      createLookFromActive(lookName.trim(), null);
      setLookName('');
      alert('현재 코디가 저장되었습니다! 💾');
      return;
    }

    setSaving(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: null,
        useCORS: true,
        scale: 2, // 고해상도 캡처
      });
      const dataUrl = canvas.toDataURL('image/png');
      createLookFromActive(lookName.trim(), dataUrl);
      setLookName('');
      alert('현재 코디가 저장되었습니다! 💾');
    } catch (err) {
      console.error('스냅샷 생성 실패', err);
      // 실패 시에도 최소한 데이터는 저장되도록 fallback
      createLookFromActive(lookName.trim(), null);
      setLookName('');
      alert('코디가 저장되었습니다 (미리보기 생성 실패)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 pb-20 lg:pb-0">
      
      {/* 1. Canvas Area (Left) */}
      <div className="flex-1 bg-gray-100 rounded-3xl shadow-inner border border-gray-200 overflow-hidden relative flex items-center justify-center min-h-[50vh] lg:h-auto">
        {/* Avatar Container with fixed aspect ratio */}
        <div ref={canvasRef} className="relative w-full max-w-md aspect-[3/4] bg-white shadow-xl rounded-lg overflow-hidden group">
          
          {/* Avatar Base Layer */}
          {user?.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt="Avatar" 
              className="absolute inset-0 w-full h-full object-cover z-0" 
            />
          ) : (
            <div className="absolute inset-0 bg-gray-200 flex flex-col items-center justify-center text-gray-400 z-0">
               <span className="text-6xl mb-4">👤</span>
               <p>아바타가 설정되지 않았습니다.</p>
               <Link to="/app/avatar" className="mt-2 text-indigo-600 underline text-sm">
                 설정하러 가기
               </Link>
            </div>
          )}

          {/* User Info Overlay (Visible on Hover/Empty) */}
          <div className="absolute top-4 left-4 z-0 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
            {user?.height ? `${user.height}cm` : '-'} / {user?.bodyType || 'normal'}
          </div>

          {/* Clothing Layers */}
          {layers.map((layer) => {
            const item = clothes.find(c => c.id === layer.clothingId);
            if (!item || !layer.visible) return null;

            return (
              <img
                key={layer.clothingId}
                src={item.imageUrl}
                alt={item.category}
                className="absolute transition-transform duration-75 ease-out origin-center pointer-events-none select-none"
                style={{
                  top: '50%',
                  left: '50%',
                  width: '60%', // 초기 기준 크기
                  transform: `translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                  zIndex: 10,
                }}
              />
            );
          })}
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400 pointer-events-none">
          AI Virtual Fitting Room
        </div>
      </div>

      {/* 2. Control Panel (Right) */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        
        {/* Save & Reset Actions */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex gap-2">
            <input 
              type="text"
              value={lookName}
              onChange={(e) => setLookName(e.target.value)}
              placeholder="예: 데일리 출근룩"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              onClick={handleSaveLook}
              disabled={saving}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-50">
            <span>현재 {layers.length}개 아이템 착용 중</span>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  if(confirm('피팅룸을 초기화하시겠습니까?')) {
                    clearActiveLook();
                    setLookName('');
                  }
                }}
                className="hover:text-red-500 hover:underline"
              >
                초기화
              </button>
              <button 
               onClick={() => navigate('/app/closet')}
               className="text-indigo-600 font-bold hover:underline"
             >
               + 옷 더 입기
             </button>
            </div>
          </div>
        </div>

        {/* Layer List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {layers.length === 0 ? (
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 flex flex-col items-center justify-center min-h-[200px]">
               <div className="text-4xl mb-2">🕴️</div>
               <p className="mb-4">입고 있는 옷이 없습니다.</p>
               <button 
                 onClick={() => navigate('/app/closet')}
                 className="text-indigo-600 font-medium hover:underline text-sm"
               >
                 옷장에서 옷 골라오기
               </button>
             </div>
          ) : (
            layers.map((layer) => {
              const item = clothes.find(c => c.id === layer.clothingId);
              if (!item) return null;

              return (
                <div key={layer.clothingId} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 transition-colors hover:border-indigo-200">
                  <div className="flex gap-3 mb-3 border-b border-gray-50 pb-3">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 bg-gray-50 rounded-lg p-1 flex items-center justify-center">
                      <img src={item.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
                    </div>
                    
                    {/* Title & Toggle */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-gray-800 truncate">{item.category}</p>
                          <p className="text-xs text-gray-500 truncate">{item.color} {item.brand}</p>
                        </div>
                        <button 
                          onClick={() => removeItemFromActiveLook(layer.clothingId)}
                          className="text-gray-300 hover:text-red-500 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-3">
                    {/* Visible Toggle */}
                    <div className="flex items-center justify-between text-xs">
                       <span className="text-gray-500">표시 여부</span>
                       <button 
                        onClick={() => updateLayer(layer.clothingId, { visible: !layer.visible })}
                        className={`w-10 h-5 rounded-full relative transition-colors ${layer.visible ? 'bg-indigo-500' : 'bg-gray-300'}`}
                       >
                         <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${layer.visible ? 'left-6' : 'left-1'}`} />
                       </button>
                    </div>

                    {/* Scale */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-8 text-gray-500">크기</span>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="2.0" 
                        step="0.05"
                        value={layer.scale}
                        onChange={(e) => updateLayer(layer.clothingId, { scale: parseFloat(e.target.value) })}
                        className="flex-1 accent-indigo-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="w-8 text-right text-gray-400">{layer.scale.toFixed(1)}x</span>
                    </div>

                    {/* X Position */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-8 text-gray-500">가로</span>
                      <input 
                        type="range" 
                        min="-150" 
                        max="150" 
                        value={layer.x}
                        onChange={(e) => updateLayer(layer.clothingId, { x: parseInt(e.target.value) })}
                        className="flex-1 accent-indigo-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Y Position */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-8 text-gray-500">세로</span>
                      <input 
                        type="range" 
                        min="-200" 
                        max="200" 
                        value={layer.y}
                        onChange={(e) => updateLayer(layer.clothingId, { y: parseInt(e.target.value) })}
                        className="flex-1 accent-indigo-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
