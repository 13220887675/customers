'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

type DateRange = 'month' | 'year'
type ChartType = 'bar' | 'line'

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [members, setMembers] = useState<any[]>([])
  const [classData, setClassData] = useState<any>(null)
  const [ageGroupData, setAgeGroupData] = useState<any>(null)
  const [genderData, setGenderData] = useState<any>(null)

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

        // 获取所有会员列表
        const { data: membersData } = await supabase
          .from('users')
          .select('id, name')
          .eq('role', 'member')

        setMembers(membersData || [])
        await fetchAnalyticsData()
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('class_records')
        .select(`
          *,
          users!class_records_user_id_fkey(birth_date, gender)
        `)
        .gte('class_date', startDate)
        .lte('class_date', endDate)

      if (selectedMember !== 'all') {
        query = query.eq('user_id', selectedMember)
      }

      const { data: records } = await query

      // 处理上课记录数据
      const classCountByDate: Record<string, number> = {}
      records?.forEach(record => {
        const date = dateRange === 'month' 
          ? format(new Date(record.class_date), 'yyyy-MM-dd')
          : format(new Date(record.class_date), 'yyyy-MM')
        classCountByDate[date] = (classCountByDate[date] || 0) + 1
      })

      // 处理年龄段数据
      const ageGroups = {
        '0-18': 0,
        '19-30': 0,
        '31-45': 0,
        '46-60': 0,
        '60+': 0
      }

      records?.forEach(record => {
        const birthDate = new Date(record.users.birth_date)
        const age = new Date().getFullYear() - birthDate.getFullYear()
        if (age <= 18) ageGroups['0-18']++
        else if (age <= 30) ageGroups['19-30']++
        else if (age <= 45) ageGroups['31-45']++
        else if (age <= 60) ageGroups['46-60']++
        else ageGroups['60+']++
      })

      // 处理性别数据
      const genderCount = {
        male: 0,
        female: 0
      }

      records?.forEach(record => {
        if (record.users.gender === 'male') genderCount.male++
        else if (record.users.gender === 'female') genderCount.female++
      })

      // 设置图表数据
      setClassData({
        labels: Object.keys(classCountByDate),
        datasets: [{
          label: '上课次数',
          data: Object.values(classCountByDate),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      })

      setAgeGroupData({
        labels: Object.keys(ageGroups),
        datasets: [{
          label: '年龄分布',
          data: Object.values(ageGroups),
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      })

      setGenderData({
        labels: ['男', '女'],
        datasets: [{
          label: '性别分布',
          data: [genderCount.male, genderCount.female],
          backgroundColor: [
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 99, 132, 0.2)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }]
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
    const today = new Date()
    if (range === 'month') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'))
      setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'))
    } else {
      setStartDate(format(startOfYear(today), 'yyyy-MM-dd'))
      setEndDate(format(endOfYear(today), 'yyyy-MM-dd'))
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedMember, startDate, endDate])

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
          <h1 className="text-3xl font-bold text-gray-900">统计分析</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 筛选条件 */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择会员
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                >
                  <option value="all">所有会员</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  时间范围
                </label>
                <div className="flex space-x-4">
                  <button
                    className={`px-4 py-2 rounded-md ${dateRange === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => handleDateRangeChange('month')}
                  >
                    本月
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md ${dateRange === 'year' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => handleDateRangeChange('year')}
                  >
                    本年
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图表类型
                </label>
                <div className="flex space-x-4">
                  <button
                    className={`px-4 py-2 rounded-md ${chartType === 'bar' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setChartType('bar')}
                  >
                    柱状图
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md ${chartType === 'line' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setChartType('line')}
                  >
                    折线图
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 图表展示 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 上课记录统计 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                上课记录统计
              </h2>
              <div className="h-80">
                {classData && (
                  chartType === 'bar' ? (
                    <Bar data={classData} options={{
                      responsive: true,
                      maintainAspectRatio: false
                    }} />
                  ) : (
                    <Line data={classData} options={{
                      responsive: true,
                      maintainAspectRatio: false
                    }} />
                  )
                )}
              </div>
            </div>

            {/* 年龄分布 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                年龄分布
              </h2>
              <div className="h-80">
                {ageGroupData && (
                  <Bar data={ageGroupData} options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }} />
                )}
              </div>
            </div>

            {/* 性别分布 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                性别分布
              </h2>
              <div className="h-80">
                {genderData && (
                  <Bar data={genderData} options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}