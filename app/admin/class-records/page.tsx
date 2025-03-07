'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Member = Database['public']['Tables']['users']['Row']
type Coach = Database['public']['Tables']['coaches']['Row']

export default function ClassRecordsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [selectedMember, setSelectedMember] = useState('')
  const [selectedCoach, setSelectedCoach] = useState('')
  const [coachFee, setCoachFee] = useState(0)
  const [classDate, setClassDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
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

        // 获取会员列表
        const { data: members, error: membersError } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'member')
          .order('name')

        if (membersError) throw membersError
        setMembers(members || [])

        // 获取教练列表
        const { data: coaches, error: coachesError } = await supabase
          .from('coaches')
          .select('*')
          .order('name')

        if (coachesError) throw coachesError
        setCoaches(coaches || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (!selectedMember || !selectedCoach || coachFee <= 0) {
        throw new Error('请填写所有必填字段')
      }

      // 获取会员信息
      const { data: member, error: memberError } = await supabase
        .from('users')
        .select('*')
        .eq('id', selectedMember)
        .single()

      if (memberError) throw memberError

      if (!member || member.remaining_classes <= 0) {
        throw new Error('会员剩余课程数不足')
      }

      // 创建上课记录
      const { error: recordError } = await supabase.from('class_records').insert([
        {
          user_id: selectedMember,
          coach_id: selectedCoach,
          class_date: classDate,
          coach_fee: coachFee
        }
      ])

      if (recordError) throw recordError

      // 更新会员剩余课程数
      const { error: updateError } = await supabase
        .from('users')
        .update({
          remaining_classes: member.remaining_classes - 1
        })
        .eq('id', selectedMember)

      if (updateError) throw updateError

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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">课程记录</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="member" className="block text-sm font-medium text-gray-700">
                    选择会员
                  </label>
                  <select
                    id="member"
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">请选择会员</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} (剩余课程: {member.remaining_classes})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="coach" className="block text-sm font-medium text-gray-700">
                    选择教练
                  </label>
                  <select
                    id="coach"
                    value={selectedCoach}
                    onChange={(e) => setSelectedCoach(e.target.value)}
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">请选择教练</option>
                    {coaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="coachFee" className="block text-sm font-medium text-gray-700">
                    教练费用
                  </label>
                  <input
                    type="number"
                    id="coachFee"
                    min="0"
                    step="0.01"
                    required
                    value={coachFee}
                    onChange={(e) => setCoachFee(Number(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="classDate" className="block text-sm font-medium text-gray-700">
                    上课日期
                  </label>
                  <input
                    type="date"
                    id="classDate"
                    required
                    value={classDate}
                    onChange={(e) => setClassDate(e.target.value)}
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