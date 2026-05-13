'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { login } from './actions';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await login(fd);
        if (result.ok) {
          router.push('/');
          router.refresh();
        } else {
          setError('用户名或密码错误');
        }
      } catch (e) {
        console.error('login error', e);
        setError('登录失败，请联系管理员（' + String(e) + '）');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div>
        <label className="block text-[13px] text-gray-500 mb-1.5">手机号</label>
        <input
          name="username"
          type="tel"
          autoComplete="tel"
          required
          className="w-full h-11 px-3 rounded-xl border border-gray-200 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3370FF]/40 focus:border-[#3370FF]"
        />
      </div>
      <div>
        <label className="block text-[13px] text-gray-500 mb-1.5">密码</label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full h-11 px-3 rounded-xl border border-gray-200 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3370FF]/40 focus:border-[#3370FF]"
        />
      </div>
      {error && <p className="text-[13px] text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 bg-[#3370FF] hover:bg-[#245BDB] text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
      >
        {isPending ? '登录中…' : '登录'}
      </button>
    </form>
  );
}
