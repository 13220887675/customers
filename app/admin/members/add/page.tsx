'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AddMemberPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [purchaseAmount, setPurchaseAmount] = useState(0)
  const [purchaseQuantity, setPurchaseQuantity] = useState(0)
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [validDays, setValidDays] = useState(365)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get('name') as string
      const phone = formData.get('phone') as string
      const birthDate = formData.get('birthDate') as string

      if (!name || !phone || !birthDate) {
        throw new Error('请填写所有必填字段')
      }

      const expiryDate = new Date(purchaseDate)
      expiryDate.setDate(expiryDate.getDate() + validDays)

      // 创建会员记录
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          name,
          phone,
          birth_date: birthDate,
          remaining_classes: purchaseQuantity,
          role: 'member',
          password: phone.slice(-6)
        }])
        .select()
        .single()

      if (userError) throw userError

      // 创建购课记录
      const { error: purchaseError } = await supabase.from('course_purchases').insert([
        {
          user_id: userData.id,
          amount: purchaseAmount,
          quantity: purchaseQuantity,
          purchase_date: purchaseDate,
          valid_days: validDays,
          expiry_date: expiryDate.toISOString().split('T')[0]
        }
      ])

      if (purchaseError) throw purchaseError

      router.push('/admin/members')
    } catch (error: unknown) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">添加会员</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* 基本信息部分 */}
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h3 className="text-base font-semibold text-gray-900">基本信息</h3>
                      <p className="mt-1 text-sm text-gray-500">会员基础信息录入</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        姓名
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 invalid:border-red-500 invalid:text-red-600"
                        placeholder="请输入会员姓名"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        手机号
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        pattern="[0-9]{11}"
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 invalid:border-red-500 invalid:text-red-600"
                        placeholder="请输入11位手机号码"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        出生日期
                      </label>
                      <input
                        type="date"
                        name="birthDate"
                        required
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 invalid:border-red-500 invalid:text-red-600"
                      />
                    </div>
                  </div>

                  {/* 购课信息部分 */}
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h3 className="text-base font-semibold text-gray-900">购课信息</h3>
                      <p className="mt-1 text-sm text-gray-500">课程购买详细信息</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        购买金额（元）
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 invalid:border-red-500 invalid:text-red-600"
                        placeholder="请输入购买金额"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        课程数量
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 invalid:border-red-500 invalid:text-red-600"
                        placeholder="请输入购买课程数量"
                        value={purchaseQuantity}
                        onChange={(e) => setPurchaseQuantity(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        购买日期
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 invalid:border-red-500 invalid:text-red-600"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        有效期（天）
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 invalid:border-red-500 invalid:text-red-600"
                        placeholder="请输入课程有效期"
                        value={validDays}
                        onChange={(e) => setValidDays(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}

                {/* 按钮组 */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/members')}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                  >
                    {loading ? '保存中...' : '保存'}
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