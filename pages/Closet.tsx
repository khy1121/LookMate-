
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import { Category } from '../types';

const CATEGORIES: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'top', label: '상의' },
  { value: 'bottom', label: '하의' },
  { value: 'outer', label: '아우터' },
  { value: 'onepiece', label: '원피스' },
  { value: 'shoes', label: '신발' },
  { value: 'accessory', label: '액세서리' },
];

export const Closet: React.FC = () => {
  const navigate = useNavigate();
  const clothes = useStore((state) => state.clothes);
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const removeClothing = useStore((state) => state.removeClothing);
  const startLookWithItem = useStore((state) => state.startLookWithItem);

  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchText, setSearchText] = useState('');

  // Filtering Logic
  const filteredClothes = clothes.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = 
      item.color.toLowerCase().includes(searchText.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.memo?.toLowerCase().includes(searchText.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const handleTryOn = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    startLookWithItem(itemId);
    navigate('/app/fitting');
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">내 옷장</h2>
        <div className="flex gap-2">
           <input 
              type="text"
              placeholder="색상, 브랜드 검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
           />
          <Link 
            to="/app/upload"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap flex items-center"
          >
            <span className="mr-1 text-lg">+</span> 옷 추가
          </Link>
        </div>
      </header>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button 
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${
              selectedCategory === cat.value
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid Content */}
      {clothes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 p-12">
          <div className="text-4xl mb-4">👕</div>
          <p className="mb-2 text-lg font-medium text-gray-600">옷장이 비어있어요.</p>
          <p className="mb-6 text-sm">가지고 있는 옷을 등록하고 코디를 시작해보세요.</p>
          <Link to="/app/upload" className="text-indigo-600 font-bold hover:underline">
            첫 번째 옷 등록하기 &rarr;
          </Link>
        </div>
      ) : filteredClothes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-20">
          <p>검색 결과가 없습니다. 🤔</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-10">
          {filteredClothes.map((item) => (
            <div key={item.id} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative">
              
              {/* Image Area */}
              <div className="aspect-[3/4] bg-gray-50 p-4 relative flex items-center justify-center">
                <img src={item.imageUrl} alt={item.category} className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300" />
                
                {/* Overlay Actions */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                   <button 
                    onClick={(e) => { e.preventDefault(); toggleFavorite(item.id); }}
                    className={`p-2 rounded-full shadow-sm ${item.isFavorite ? 'bg-pink-50 text-pink-500' : 'bg-white text-gray-400 hover:text-pink-500'}`}
                  >
                    ♥
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); if(confirm('삭제하시겠습니까?')) removeClothing(item.id); }}
                    className="p-2 bg-white text-gray-400 rounded-full shadow-sm hover:text-red-500"
                  >
                    🗑️
                  </button>
                </div>

                {/* Try On Button Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleTryOn(e, item.id)}
                    className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-indigo-50 transform hover:scale-105 transition-all"
                  >
                    입어보기 🕴️
                  </button>
                </div>
              </div>

              {/* Info Area */}
              <div className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{item.category}</span>
                  {item.size && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.size}</span>}
                </div>
                <div className="text-sm font-medium text-gray-800 truncate">{item.color} {item.brand ? item.brand : 'Item'}</div>
                <div className="text-xs text-gray-400 mt-1 truncate">{item.memo || '-'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
