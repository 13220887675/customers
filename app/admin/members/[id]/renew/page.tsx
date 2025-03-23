'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { addDays, format } from 'date-fns'

type Member = Database['public']['Tables']['users']['Row']

// 修改组件参数类型定义，使其与Next.js期望的类型匹配
export default function MemberRenewPage({ params }: { 
  params: Promise<{ id: string }>;
}) {
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [memberId, setMemberId] = useState<string>('')
  const [classes, setClasses] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
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
        const { data: member, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', resolvedId)
          .single()

        if (error) throw error
        if (!member) {
          router.push('/admin/members')
          return
        }

        setMember(member)
      } catch (error) {
        console.error('Error:', error)
        router.push('/admin/members')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classes || !amount) return

    setSubmitting(true)
    try {
      const classesNum = parseInt(classes)
      const amountNum = parseFloat(amount)

      // 获取最新的会员信息
      const { data: currentMember, error: memberError } = await supabase
        .from('users')
        .select('*')
        .eq('id', memberId)
        .single()

      if (memberError) throw memberError

      // 计算新的有效期
      const currentDate = new Date()
      const newExpiryDate = addDays(currentDate, 30)
      const formattedExpiryDate = format(newExpiryDate, 'yyyy-MM-dd')

      // 更新会员信息
      const { error: updateError } = await supabase
        .from('users')
        .update({
          remaining_classes: (currentMember.remaining_classes || 0) + classesNum,
          expiry_date: formattedExpiryDate
        })
        .eq('id', memberId)

      if (updateError) throw updateError

      // 记录购课记录
      const { error: purchaseError } = await supabase
        .from('course_purchases')
        .insert([{
          user_id: memberId,
          classes: classesNum,
          amount: amountNum,
          purchase_date: format(currentDate, 'yyyy-MM-dd'),
          valid_days: 30,
          expiry_date: formattedExpiryDate
        }])

      if (purchaseError) throw purchaseError

      router.push('/admin/members')
    } catch (error) {
      console.error('Error:', error)
      alert('续费失败，请重试')
    } finally {
      setSubmitting(false)
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
          <h1 className="text-3xl font-bold text-gray-900">会员续费</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                会员信息
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">姓名</dt>
                  <dd className="mt-1 text-sm text-gray-900">{member?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">手机号</dt>
                  <dd className="mt-1 text-sm text-gray-900">{member?.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">当前剩余课程</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {member?.remaining_classes || 0} 节
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">当前有效期至</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {member?.expiry_date || '未设置'}
                  </dd>
                </div>
              </dl>

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div>
                  <label
                    htmlFor="classes"
                    className="block text-sm font-medium text-gray-700"
                  >
                    续费课程数
                  </label>
                  <input
                    type="number"
                    name="classes"
                    id="classes"
                    required
                    min="1"
                    value={classes}
                    onChange={(e) => setClasses(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    续费金额
                  </label>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    required
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

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
                    disabled={submitting}
                    className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {submitting ? '提交中...' : '确认续费'}
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