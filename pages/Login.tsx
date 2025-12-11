
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useStore((state) => state.login);

  const handleLogin = () => {
    // Mock Login
    login({
      id: 'user-1',
      name: 'Demo User',
      email: 'demo@example.com',
      avatarUrl: null,
      height: 175,
      bodyType: 'normal',
      gender: 'unisex',
    });
    navigate('/app/dashboard');
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl text-center max-w-md w-full">
        <div className="mb-6 text-6xl">👗</div>
        <h1 className="text-3xl font-bold mb-3 text-gray-800">AI Virtual Closet</h1>
        <p className="mb-8 text-gray-500">
          당신의 옷장을 디지털로 관리하고<br />
          AI 아바타로 미리 입어보세요.
        </p>
        <button
          onClick={handleLogin}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          체험하기 (로그인)
        </button>
        <p className="mt-4 text-xs text-gray-400">
          * 실제 인증 없이 데모 계정으로 시작됩니다.
        </p>
      </div>
    </div>
  );
};
