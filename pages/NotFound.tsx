import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.currentUser);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-8xl mb-4">😢</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-gray-600">
            주소가 잘못되었거나, 이동한 페이지일 수 있어요.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            홈으로 가기
          </button>
          
          {currentUser && (
            <button
              onClick={() => navigate('/app/dashboard')}
              className="w-full py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              대시보드로 가기
            </button>
          )}
        </div>

        <p className="mt-6 text-sm text-gray-500">
          문제가 계속되면 홈페이지에서 다시 시작해보세요.
        </p>
      </div>
    </div>
  );
};
