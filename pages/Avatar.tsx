
import React, { useState, ChangeEvent } from 'react';
import { useStore } from '../store/useStore';
import { aiService } from '../services/aiService';
import { BodyType, Gender } from '../types';

export const Avatar: React.FC = () => {
  const user = useStore((state) => state.user);
  const updateUser = useStore((state) => state.updateUser);

  // Form State
  const [height, setHeight] = useState<number>(user?.height || 170);
  const [bodyType, setBodyType] = useState<BodyType>(user?.bodyType || 'normal');
  const [gender, setGender] = useState<Gender>(user?.gender || 'unisex');
  
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [fullBodyFile, setFullBodyFile] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(user?.avatarUrl || null);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerate = async () => {
    setIsProcessing(true);
    try {
      // AI Service 호출
      const newAvatarUrl = await aiService.generateAvatar({
        faceImage: faceFile,
        fullBodyImage: fullBodyFile,
        height,
        bodyType,
        gender
      });

      // Store 업데이트
      updateUser({
        avatarUrl: newAvatarUrl,
        height,
        bodyType,
        gender
      });
      
      setPreviewAvatar(newAvatarUrl);
      alert('아바타가 성공적으로 생성되었습니다!');
    } catch (e) {
      console.error(e);
      alert('아바타 생성 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'face' | 'body') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'face') setFaceFile(e.target.files[0]);
      else setFullBodyFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">내 아바타 설정</h2>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Preview */}
        <div className="flex-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center min-h-[400px]">
            <h3 className="text-lg font-bold mb-4 text-gray-700">현재 아바타</h3>
            <div className="relative w-full max-w-sm aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">
              {previewAvatar ? (
                <img src={previewAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 text-center">
                  <span className="text-6xl block mb-2">👤</span>
                  <p>설정된 아바타가 없습니다.</p>
                </div>
              )}
              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
                   <svg className="animate-spin h-10 w-10 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="font-bold text-indigo-600">AI가 아바타를 생성 중입니다...</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-gray-500 text-center">
              {height}cm, {bodyType}, {gender}
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex-1">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-6 text-gray-700">신체 정보 입력</h3>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">키 (cm)</label>
                  <input 
                    type="number" 
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                    <option value="unisex">공용</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">체형</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['slim', 'normal', 'athletic', 'chubby'] as BodyType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setBodyType(type)}
                      className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                        bodyType === type 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {type === 'slim' && '슬림함'}
                      {type === 'normal' && '보통'}
                      {type === 'athletic' && '탄탄함'}
                      {type === 'chubby' && '통통함'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 my-4"></div>

              {/* Image Uploads */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">전신 사진 업로드 (권장)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'body')}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs text-gray-400 mt-1">본인의 전신 사진을 올리면 가장 정확합니다.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">얼굴 사진 업로드 (선택)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'face')}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs text-gray-400 mt-1">얼굴만 합성하고 싶을 때 사용하세요.</p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isProcessing}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? '생성 중...' : '아바타 생성/업데이트'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
