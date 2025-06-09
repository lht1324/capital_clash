'use client'

import { useState, useEffect } from 'react'
import { useContinentStore } from '@/store/continentStore'
import ContinentWizard from '@/components/admin/ContinentWizard'
import CameraPathEditor from '@/components/admin/CameraPathEditor'
import NotificationSystem from '@/components/admin/NotificationSystem'
import AccessibilityHelper from '@/components/admin/AccessibilityHelper'
import SupabaseManager from '@/components/admin/SupabaseManager'
import Link from 'next/link'
import { 
  ChartBarIcon, 
  UsersIcon, 
  CogIcon, 
  PhotoIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'

interface AdminStats {
  totalUsers: number
  totalInvestment: number
  totalTiles: number
  pendingImages: number
  averageInvestment: number
  topContinent: string
  recentActivity: ActivityItem[]
}

interface ActivityItem {
  id: string
  type: 'investment' | 'image_upload' | 'user_join' | 'admin_action'
  user: string
  action: string
  timestamp: Date
  amount?: number
}

export default function AdminDashboard() {
  const { continents } = useContinentStore()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showContinentWizard, setShowContinentWizard] = useState(false)
  const [showCameraEditor, setShowCameraEditor] = useState(false)
  const [showSupabaseManager, setShowSupabaseManager] = useState(false)

  // Calculate real-time statistics
  useEffect(() => {
    const calculateStats = () => {
      let totalUsers = 0
      let totalInvestment = 0
      let totalTiles = 0
      let pendingImages = 0
      let continentInvestments: Record<string, number> = {}

      Object.entries(continents).forEach(([continentId, continent]) => {
        const investors = Object.values(continent.investors)
        totalUsers += investors.length
        totalInvestment += continent.totalInvestment
        totalTiles += investors.length
        continentInvestments[continent.name] = continent.totalInvestment

        investors.forEach(investor => {
          if (investor.imageStatus === 'pending') {
            pendingImages++
          }
        })
      })

      const averageInvestment = totalUsers > 0 ? totalInvestment / totalUsers : 0
      const topContinent = Object.entries(continentInvestments)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'

      // Generate recent activity (mock data for now)
      const recentActivity: ActivityItem[] = [
        {
          id: '1',
          type: 'investment',
          user: 'investor_42',
          action: 'invested in Northwest Continent',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          amount: 1500
        },
        {
          id: '2',
          type: 'image_upload',
          user: 'investor_23',
          action: 'uploaded new territory image',
          timestamp: new Date(Date.now() - 15 * 60 * 1000)
        },
        {
          id: '3',
          type: 'investment',
          user: 'investor_15',
          action: 'invested in Southeast Continent',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          amount: 750
        },
        {
          id: '4',
          type: 'user_join',
          user: 'investor_89',
          action: 'joined the platform',
          timestamp: new Date(Date.now() - 45 * 60 * 1000)
        }
      ]

      return {
        totalUsers,
        totalInvestment,
        totalTiles,
        pendingImages,
        averageInvestment,
        topContinent,
        recentActivity
      }
    }

    setStats(calculateStats())
    setIsLoading(false)

    // Update stats every 30 seconds
    const interval = setInterval(() => {
      setStats(calculateStats())
    }, 30000)

    return () => clearInterval(interval)
  }, [continents])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'investment': return '💰'
      case 'image_upload': return '📷'
      case 'user_join': return '👤'
      case 'admin_action': return '⚙️'
      default: return '📝'
    }
  }

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">CC</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-gray-900">
                  <span className="hidden md:inline">Capital Clash Admin</span>
                  <span className="md:hidden">CC Admin</span>
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden lg:inline text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
              <Link 
                href="/"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm"
              >
                <span className="hidden sm:inline">Back to Site</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor and manage the Capital Clash platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 animate-fade-in-up focus-enhanced" tabIndex={0}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 animate-fade-in-up focus-enhanced" tabIndex={0} style={{animationDelay: '0.1s'}}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Investment</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalInvestment)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 animate-fade-in-up focus-enhanced" tabIndex={0} style={{animationDelay: '0.2s'}}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GlobeAltIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Tiles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTiles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 animate-fade-in-up focus-enhanced" tabIndex={0} style={{animationDelay: '0.3s'}}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Images</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingImages}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Average Investment</span>
                <span className="font-medium">{formatCurrency(stats.averageInvestment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Top Performing Continent</span>
                <span className="font-medium">{stats.topContinent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform Status</span>
                <span className="font-medium text-green-600">🟢 Operational</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 4).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <span className="text-sm">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                      {activity.amount && (
                        <span className="text-green-600 font-medium"> ({formatCurrency(activity.amount)})</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowCameraEditor(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 sm:px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors text-sm"
              >
                <VideoCameraIcon className="h-4 w-4" />
                <span className="hidden sm:inline">카메라 편집</span>
                <span className="sm:hidden">카메라</span>
              </button>
              <button
                onClick={() => setShowContinentWizard(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">새 대륙 생성</span>
                <span className="sm:hidden">대륙 생성</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Link 
              href="/admin/users"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UsersIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-500">View and edit user accounts</p>
              </div>
            </Link>

            <Link 
              href="/admin/tiles"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <GlobeAltIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Manage Tiles</p>
                <p className="text-sm text-gray-500">Territory management</p>
              </div>
            </Link>

            <Link 
              href="/admin/images"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PhotoIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Image Approval</p>
                <p className="text-sm text-gray-500">{stats.pendingImages} pending</p>
              </div>
            </Link>

            <Link 
              href="/admin/vip"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="h-8 w-8 text-yellow-600 mr-3 flex items-center justify-center">
                👑
              </div>
              <div>
                <p className="font-medium text-gray-900">VIP Management</p>
                <p className="text-sm text-gray-500">Auto-promotion system</p>
              </div>
            </Link>

            <Link 
              href="/admin/continents"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="h-8 w-8 text-indigo-600 mr-3 flex items-center justify-center">
                🗺️
              </div>
              <div>
                <p className="font-medium text-gray-900">Continent Editor</p>
                <p className="text-sm text-gray-500">Position & properties</p>
              </div>
            </Link>

            <button 
              onClick={() => setShowSupabaseManager(true)}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
            >
              <div className="h-8 w-8 text-emerald-600 mr-3 flex items-center justify-center">
                🗄️
              </div>
              <div>
                <p className="font-medium text-gray-900">Supabase 관리</p>
                <p className="text-sm text-gray-500">데이터 동기화</p>
              </div>
            </button>

            <Link 
              href="/admin/settings"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CogIcon className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">System Settings</p>
                <p className="text-sm text-gray-500">Configure platform</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Continent Wizard Modal */}
      <ContinentWizard 
        isOpen={showContinentWizard}
        onClose={() => setShowContinentWizard(false)}
      />

      {/* Camera Path Editor Modal */}
      <CameraPathEditor 
        isOpen={showCameraEditor}
        onClose={() => setShowCameraEditor(false)}
      />

      {/* Supabase Manager Modal */}
      <SupabaseManager 
        isOpen={showSupabaseManager}
        onClose={() => setShowSupabaseManager(false)}
      />

      {/* Notification System */}
      <NotificationSystem />

      {/* Accessibility Helper */}
      <AccessibilityHelper 
        enableKeyboardHelp={true}
        enableFocusIndicator={true}
        enableHighContrast={false}
      />
    </div>
  )
} 