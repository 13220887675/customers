'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Member = Database['public']['Tables']['users']['Row']
type ClassRecord = Database['public']['Tables']['class_records']['Row'] & {
  coaches?: { name: string }
}
type CoursePurchase = Database['public']['Tables']['course_purchases']['Row']

export default function MemberDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [classRecords, setClassRecords] = useState<ClassRecord[]>([])
  const [coursePurchases, setCoursePurchases] = useState<CoursePurchase[]>([])

  useEffect(() => {
    // 检查用户是否已登录
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) {
          router.push('/login')
          return
        }

        const parsedUser = JSON.parse(userData)
        if (parsedUser.role !== 'member') {
          router.push('/login')
          return
        }

        setUser(parsedUser)

        // 获取会员上课记录
        const { data: records, error: recordsError } = await supabase
          .from('class_records')
          .select('*, coaches(name)')
          .eq('user_id', parsedUser.id)
          .order('class_date', { ascending: false })

        if (recordsError) throw recordsError
        setClassRecords(records || [])

        // 获取会员购课记录
        const { data: purchases, error: purchasesError } = await supabase
          .from('course_purchases')
          .select('*')
          .eq('user_id', parsedUser.id)
          .order('purchase_date', { ascending: false })

        if (purchasesError) throw purchasesError
        setCoursePurchases(purchases || [])
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

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
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">会员中心</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">欢迎，{user?.name}</span>
            <button
              onClick={() => {
                localStorage.removeItem('user')
                router.push('/login')
              }}
              className="text-sm text-red-600 hover:text-red-800"
            >
              退出登录
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
              <p className="mt-1 max-w-2xl text-sm text-gray-500">个人信息和课程详情</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">姓名</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.name}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">手机号</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.phone}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">出生日期</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.birth_date}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">剩余课程</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.remaining_classes} 节</dd>
                </div>
                {coursePurchases.length > 0 && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">有效期至</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {coursePurchases[0]?.expiry_date}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* 上课记录 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">上课记录</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">您的历史上课记录</p>
            </div>
            <div className="border-t border-gray-200">
              {classRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          日期
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          教练
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {classRecords.map((record) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.class_date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.coaches?.name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-4 py-5 sm:px-6 text-center text-gray-500">暂无上课记录</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}