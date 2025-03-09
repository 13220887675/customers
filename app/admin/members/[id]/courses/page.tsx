'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Member = Database['public']['Tables']['users']['Row']
type CoursePurchase = Database['public']['Tables']['course_purchases']['Row']

// 修改组件参数类型定义，使其与Next.js期望的类型匹配
export default function MemberCoursesPage({ params }: { 
  params: Promise<{ id: string }>;
}) {
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [purchases, setPurchases] = useState<CoursePurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')
  const [memberId, setMemberId] = useState<string>('')

  useEffect(() => {
    // 检查用户是否已登录
    const checkAuth = async (resolvedId: string) => {
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
        const { data: member, error: memberError } = await supabase
          .from('users')
          .select('*')
          .eq('id', resolvedId)
          .single()

        if (memberError) throw memberError
        setMember(member)

        // 获取购课记录
        const { data: purchases, error: purchasesError } = await supabase
          .from('course_purchases')
          .select('*')
          .eq('user_id', resolvedId)
          .order('purchase_date', { ascending: false })

        if (purchasesError) throw purchasesError
        setPurchases(purchases || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    // 解析params参数
    const resolveParams = async () => {
      try {
        // 由于params类型定义为Promise<{id: string}>，我们总是需要等待它解析
        const resolvedParams = await params;
        setMemberId(resolvedParams.id);
        checkAuth(resolvedParams.id);
      } catch (error) {
        console.error('Error resolving params:', error);
        setLoading(false);
      }
    };

    resolveParams();
  }, [params, router])

  const handleAddCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setAdding(true)

    try {
      const formData = new FormData(e.currentTarget)
      const amount = parseFloat(formData.get('amount') as string) || 0
      const quantity = parseInt(formData.get('quantity') as string) || 0
      const validDays = parseInt(formData.get('validDays') as string) || 0
      const purchaseDate = formData.get('purchaseDate') as string

      if (amount <= 0 || quantity <= 0 || validDays <= 0 || !purchaseDate) {
        throw new Error('请填写所有必填字段，且金额、课程数量和有效期必须大于0')
      }

      // 计算到期日期
      const expiryDate = new Date(purchaseDate)
      expiryDate.setDate(expiryDate.getDate() + validDays)
      const expiryDateStr = expiryDate.toISOString().split('T')[0]

      // 添加购课记录
      const { error: purchaseError } = await supabase.from('course_purchases').insert([
        {
          user_id: memberId,
          amount,
          quantity,
          purchase_date: purchaseDate,
          valid_days: validDays,
          expiry_date: expiryDateStr
        }
      ])

      if (purchaseError) throw purchaseError

      // 更新会员剩余课程数
      if (member) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            remaining_classes: member.remaining_classes + quantity
          })
          .eq('id', memberId)

        if (updateError) throw updateError
      }

      // 刷新页面数据
      const { data: updatedMember } = await supabase
        .from('users')
        .select('*')
        .eq('id', memberId)
        .single()

      const { data: updatedPurchases } = await supabase
        .from('course_purchases')
        .select('*')
        .eq('user_id', memberId)
        .order('purchase_date', { ascending: false })

      setMember(updatedMember || null)
      setPurchases(updatedPurchases || [])
      setShowAddForm(false)
    } catch (error: unknown) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setAdding(false)
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
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{member.name} - 购课记录</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/admin/members')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              返回会员列表
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {showAddForm ? '取消添加' : '添加购课'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 会员信息卡片 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">会员信息</h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">姓名</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{member.name}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">手机号</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{member.phone}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">剩余课程</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{member.remaining_classes} 节</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* 添加购课表单 */}
          {showAddForm && (
            <div className="bg-white shadow sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">添加购课记录</h3>
                <form onSubmit={handleAddCourse} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        金额 (元)
                      </label>
                      <input
                        type="number"
                        name="amount"
                        id="amount"
                        required
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                        课程数量
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        id="quantity"
                        required
                        min="1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="validDays" className="block text-sm font-medium text-gray-700">
                        有效期 (天)
                      </label>
                      <input
                        type="number"
                        name="validDays"
                        id="validDays"
                        required
                        min="1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">
                        购买日期
                      </label>
                      <input
                        type="date"
                        name="purchaseDate"
                        id="purchaseDate"
                        required
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={adding}
                      className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                    >
                      {adding ? '保存中...' : '保存'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 购课记录列表 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">购课记录</h3>
            </div>
            <div className="border-t border-gray-200">
              {purchases.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          购买日期
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          金额
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          课程数量
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          有效期
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          到期日期
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchases.map((purchase) => (
                        <tr key={purchase.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {purchase.purchase_date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ¥{purchase.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {purchase.quantity} 节
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {purchase.valid_days} 天
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {purchase.expiry_date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                  暂无购课记录
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}