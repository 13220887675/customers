'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AddCoachPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // 检查管理员权限
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) {
          router.push('/admin/login')
          return
        }

        const parsedUser = JSON.parse(userData)
        if (parsedUser.role !== 'admin') {
          router.push('/admin/login')
          return
        }
      } catch (error) {
        console.error('权限检查错误:', error)
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // 表单验证
      if (!name.trim()) {
        throw new Error('请输入教练姓名');
      }

      if (!/^1[3-9]\d{9}$/.test(phone)) {
        throw new Error('请输入有效的11位手机号码');
      }
      
      if (!password) {
        throw new Error('请设置密码');
      }

      if (password.length < 6) {
        throw new Error('密码长度不能少于6位');
      }

      // 检查手机号是否已存在
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('phone', phone)
        .is('deleted_at', null);
        
      if (countError) {
        console.error('检查手机号错误:', countError);
        throw new Error('系统错误，请稍后重试');
      }

      if (count && count > 0) {
        throw new Error('该手机号已被注册');
      }

      // 创建教练账号
      const { data, error: supabaseError } = await supabase
        .from('users')
        .insert([{
          name,
          phone,
          password,
          role: 'coach',
          created_at: new Date().toISOString(),
          remaining_classes: 0 // 教练不需要课程数，设为0
        }])
        .select()

      if (supabaseError) {
        console.error('创建教练账号错误:', supabaseError);
        throw new Error('创建账号失败，请稍后重试');
      }

      if (data) {
        // 创建成功，跳转到教练列表页
        router.push('/admin/coaches');
      } else {
        throw new Error('创建账号失败，请稍后重试');
      }
    } catch (err) {
      console.error('添加教练错误:', err);
      setError(err instanceof Error ? err.message : '添加失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">加载中...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">添加新教练</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    姓名
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入教练姓名"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    手机号
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    pattern="[0-9]{11}"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="请输入11位手机号码"
                    maxLength={11}
                  />
                  <p className="mt-1 text-xs text-gray-500">手机号将作为教练的登录账号</p>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    密码
                  </label>
                  <input
                    type="password"
                    id="password"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请设置登录密码"
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-gray-500">密码长度不少于6位</p>
                </div>

                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}