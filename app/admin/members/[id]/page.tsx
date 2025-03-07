'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Member = Database['public']['Tables']['users']['Row']

export default function EditMemberPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // 检查用户是否已登录
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

        // 获取会员信息
        const { data: member, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error
        setMember(member)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get('name') as string
      const phone = formData.get('phone') as string
      const birthDate = formData.get('birthDate') as string
      const remainingClasses = parseInt(formData.get('remainingClasses') as string) || 0
      const courseAmount = parseInt(formData.get('courseAmount') as string) || 0
      const validityDays = parseInt(formData.get('validityDays') as string) || 0

      if (!name || !phone || !birthDate) {
        throw new Error('请填写所有必填字段')
      }

      // 更新会员信息
      const { error } = await supabase
        .from('users')
        .update({
          name,
          phone,
          birth_date: birthDate,
          remaining_classes: remainingClasses,
          course_amount: courseAmount,
          validity_days: validityDays
        })
        .eq('id', params.id)

      if (error) throw error

      router.push('/admin/members')
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">加载中...</div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">会员不存在</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">编辑会员</h1>
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
                    name="name"
                    id="name"
                    required
                    defaultValue={member.name}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    手机号
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    pattern="[0-9]{11}"
                    defaultValue={member.phone}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                    出生日期
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    id="birthDate"
                    required
                    defaultValue={member.birth_date}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="remainingClasses" className="block text-sm font-medium text-gray-700">
                    剩余课程
                  </label>
                  <input
                    type="number"
                    name="remainingClasses"
                    id="remainingClasses"
                    required
                    min="0"
                    defaultValue={member.remaining_classes}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="courseAmount" className="block text-sm font-medium text-gray-700">
                    购课金额
                  </label>
                  <input
                    type="number"
                    name="courseAmount"
                    id="courseAmount"
                    required
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="validityDays" className="block text-sm font-medium text-gray-700">
                    有效期天数
                  </label>
                  <input
                    type="number"
                    name="validityDays"
                    id="validityDays"
                    required
                    min="1"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
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