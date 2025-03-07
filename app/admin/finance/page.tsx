'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

type FinanceRecord = {
  id: string
  type: 'income' | 'expense'
  category: 'course' | 'coach_fee' | 'other'
  name: string
  amount: number
  record_date: string
}

export default function FinancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [startDate, setStartDate] = useState(format(new Date().setDate(1), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all')
  const [category, setCategory] = useState<'all' | 'course' | 'coach_fee' | 'other'>('all')
  const [timeRange, setTimeRange] = useState<'month' | 'year'>('month')
  const [courseIncome, setCourseIncome] = useState(0)
  const [coachExpense, setCoachExpense] = useState(0)
  const [otherIncome, setOtherIncome] = useState(0)
  const [otherExpense, setOtherExpense] = useState(0)

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

        await fetchRecords()
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const fetchRecords = async () => {
    try {
      let query = supabase
        .from('finance_records')
        .select('*')
        .is('deleted_at', null)
        .gte('record_date', startDate)
        .lte('record_date', endDate)
        .order('record_date', { ascending: false })

      if (type !== 'all') {
        query = query.eq('type', type)
      }

      if (category !== 'all') {
        query = query.eq('category', category)
      }

      const { data } = await query
      setRecords(data || [])

      // 计算各类收支
      let income = 0
      let expense = 0
      let courseInc = 0
      let coachExp = 0
      let otherInc = 0
      let otherExp = 0

      data?.forEach(record => {
        if (record.type === 'income') {
          income += record.amount
          if (record.category === 'course') {
            courseInc += record.amount
          } else if (record.category === 'other') {
            otherInc += record.amount
          }
        } else {
          expense += record.amount
          if (record.category === 'coach_fee') {
            coachExp += record.amount
          } else if (record.category === 'other') {
            otherExp += record.amount
          }
        }
      })

      setTotalIncome(income)
      setTotalExpense(expense)
      setCourseIncome(courseInc)
      setCoachExpense(coachExp)
      setOtherIncome(otherInc)
      setOtherExpense(otherExp)
    } catch (error) {
      console.error('Error fetching records:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const formData = new FormData(e.currentTarget)
      const type = formData.get('type') as 'income' | 'expense'
      const category = formData.get('category') as 'course' | 'coach_fee' | 'other'
      const name = formData.get('name') as string
      const amount = parseFloat(formData.get('amount') as string)
      const record_date = formData.get('record_date') as string

      const { error } = await supabase.from('finance_records').insert([
        { type, category, name, amount, record_date }
      ])

      if (error) throw error

      setShowAddForm(false)
      await fetchRecords()
    } catch (error) {
      console.error('Error adding record:', error)
      alert('添加记录失败，请重试')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return

    try {
      const { error } = await supabase
        .from('finance_records')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      await fetchRecords()
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('删除失败，请重试')
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [startDate, endDate, type, category])

  useEffect(() => {
    // 根据时间维度自动设置日期范围
    const today = new Date()
    if (timeRange === 'month') {
      setStartDate(format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd'))
      setEndDate(format(today, 'yyyy-MM-dd'))
    } else {
      setStartDate(format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd'))
      setEndDate(format(today, 'yyyy-MM-dd'))
    }
  }, [timeRange])

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
          <h1 className="text-3xl font-bold text-gray-900">收支管理</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showAddForm ? '取消' : '添加记录'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 筛选条件 */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  开始日期
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  结束日期
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  时间维度
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as 'month' | 'year')}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                >
                  <option value="month">按月</option>
                  <option value="year">按年</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  类型
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'all' | 'income' | 'expense')}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                >
                  <option value="all">全部</option>
                  <option value="income">收入</option>
                  <option value="expense">支出</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'all' | 'course' | 'coach_fee' | 'other')}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                >
                  <option value="all">全部</option>
                  <option value="course">卖课收入</option>
                  <option value="coach_fee">教练费支出</option>
                  <option value="other">其他</option>
                </select>
              </div>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">总收入</h3>
              <p className="text-2xl font-bold text-green-600">¥{totalIncome.toFixed(2)}</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">卖课收入：</span>
                  <span className="text-sm text-green-600">¥{courseIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">其他收入：</span>
                  <span className="text-sm text-green-600">¥{otherIncome.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">总支出</h3>
              <p className="text-2xl font-bold text-red-600">¥{totalExpense.toFixed(2)}</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">教练费支出：</span>
                  <span className="text-sm text-red-600">¥{coachExpense.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">其他支出：</span>
                  <span className="text-sm text-red-600">¥{otherExpense.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">结余</h3>
              <p className="text-2xl font-bold text-blue-600">¥{(totalIncome - totalExpense).toFixed(2)}</p>
            </div>
          </div>

          {/* 添加表单 */}
          {showAddForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">添加记录</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    类型
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  >
                    <option value="income">收入</option>
                    <option value="expense">支出</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  >
                    <option value="course">卖课收入</option>
                    <option value="coach_fee">教练费支出</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名称
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    金额
                  </label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    日期
                  </label>
                  <input
                    type="date"
                    name="record_date"
                    required
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 记录列表 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.record_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.type === 'income' ? '收入' : '支出'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={record.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        ¥{record.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}