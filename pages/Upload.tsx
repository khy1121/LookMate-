import React, { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { aiService } from '../services/aiService';
import { Category } from '../types';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const addClothing = useStore((state) => state.addClothing);
  const user = useStore((state) => state.user);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>('top');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [memo, setMemo] = useState('');
  
  // UI State
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      
      // (Optional) AI 자동 분석 시뮬레이션
      try {
        const analysis = await aiService.detectAttributes(selectedFile);
        if (analysis) {
          setCategory(analysis.category);
          setColor(analysis.color);
        }
      } catch (error) {
        console.error('Analysis failed', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setIsProcessing(true);
    try {
      // 1. 배경 제거 (Mock API 호출)
      const processedImageUrl = await aiService.removeBackground(file);

      // 2. 스토어에 추가
      addClothing({
        userId: user.id,
        imageUrl: processedImageUrl, // 실제로는 서버 업로드 후 URL이어야 함
        originalImageUrl: URL.createObjectURL(file), // 원본 미리보기용
        category,
        color: color || 'Unknown',
        brand,
        size,
        memo,
      });

      // 3. 이동
      navigate('/app/closet');
    } catch (error) {
      console.error('Upload failed', error);
      alert('옷 등록 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">새 옷 등록하기</h2>
      
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Image Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">옷 사진</label>
            <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
              {previewUrl ? (
                <div className="flex flex-col items-center">
                  <img src={previewUrl} alt="Preview" className="h-64 object-contain rounded-lg shadow-sm bg-white" />
                  <p className="mt-2 text-sm text-indigo-600 font-medium">이미지 변경하려면 클릭</p>
                </div>
              ) : (
                <div className="py-8">
                  <span className="text-4xl block mb-2">📸</span>
                  <span className="font-medium text-gray-600">클릭하여 사진 업로드</span>
                  <p className="text-xs text-gray-400 mt-2">JPG, PNG 파일 지원</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="top">상의 (Top)</option>
                <option value="bottom">하의 (Bottom)</option>
                <option value="outer">아우터 (Outer)</option>
                <option value="onepiece">원피스 (Onepiece)</option>
                <option value="shoes">신발 (Shoes)</option>
                <option value="accessory">액세서리 (Accessory)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
              <input 
                type="text" 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="예: 블랙, 네이비"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">브랜드 (선택)</label>
              <input 
                type="text" 
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="브랜드명"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">사이즈 (선택)</label>
              <input 
                type="text" 
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="예: M, 100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">메모 (선택)</label>
            <textarea 
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="가격, 구매처 등 메모"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!file || isProcessing}
            className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg 
              ${isProcessing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
              }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                배경 제거 및 저장 중...
              </span>
            ) : (
              '배경 제거 후 옷장에 추가'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};