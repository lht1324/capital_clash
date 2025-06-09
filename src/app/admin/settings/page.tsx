'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeftIcon, CogIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface SystemSettings {
  platform: {
    name: string
    description: string
    maintenance: boolean
    registrationEnabled: boolean
    maxUsersPerContinent: number
  }
  pricing: {
    minimumInvestment: number
    maximumInvestment: number
    platformFee: number
    withdrawalFee: number
  }
  tiles: {
    maxImageSize: number
    allowedFileTypes: string[]
    approvalRequired: boolean
    autoRejectAfterDays: number
  }
  notifications: {
    emailNotifications: boolean
    realTimeNotifications: boolean
    maintenanceAlerts: boolean
    investmentAlerts: boolean
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    platform: {
      name: 'Capital Clash',
      description: 'Strategic investment platform with territory management',
      maintenance: false,
      registrationEnabled: true,
      maxUsersPerContinent: 50
    },
    pricing: {
      minimumInvestment: 10,
      maximumInvestment: 10000,
      platformFee: 2.5,
      withdrawalFee: 1.0
    },
    tiles: {
      maxImageSize: 5,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'],
      approvalRequired: true,
      autoRejectAfterDays: 7
    },
    notifications: {
      emailNotifications: true,
      realTimeNotifications: true,
      maintenanceAlerts: true,
      investmentAlerts: true
    }
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSettingChange = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
    setHasChanges(true)
    setSaveMessage('')
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSaving(false)
    setHasChanges(false)
    setSaveMessage('Settings saved successfully!')
    
    // Clear message after 3 seconds
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
      // Reset to default values
      setSettings({
        platform: {
          name: 'Capital Clash',
          description: 'Strategic investment platform with territory management',
          maintenance: false,
          registrationEnabled: true,
          maxUsersPerContinent: 50
        },
        pricing: {
          minimumInvestment: 10,
          maximumInvestment: 10000,
          platformFee: 2.5,
          withdrawalFee: 1.0
        },
        tiles: {
          maxImageSize: 5,
          allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'],
          approvalRequired: true,
          autoRejectAfterDays: 7
        },
        notifications: {
          emailNotifications: true,
          realTimeNotifications: true,
          maintenanceAlerts: true,
          investmentAlerts: true
        }
      })
      setHasChanges(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="flex items-center space-x-3 text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {hasChanges && (
                <span className="text-sm text-orange-600 font-medium">
                  Unsaved changes
                </span>
              )}
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure platform settings and operational parameters
          </p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">{saveMessage}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Platform Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.platform.name}
                  onChange={(e) => handleSettingChange('platform', 'name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Users per Continent
                </label>
                <input
                  type="number"
                  value={settings.platform.maxUsersPerContinent}
                  onChange={(e) => handleSettingChange('platform', 'maxUsersPerContinent', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Description
                </label>
                <textarea
                  value={settings.platform.description}
                  onChange={(e) => handleSettingChange('platform', 'description', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="maintenance"
                    checked={settings.platform.maintenance}
                    onChange={(e) => handleSettingChange('platform', 'maintenance', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="maintenance" className="ml-3 text-sm text-gray-700">
                    Maintenance Mode
                    {settings.platform.maintenance && (
                      <span className="ml-2 text-red-600 font-medium">(Platform will be unavailable)</span>
                    )}
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="registration"
                    checked={settings.platform.registrationEnabled}
                    onChange={(e) => handleSettingChange('platform', 'registrationEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="registration" className="ml-3 text-sm text-gray-700">
                    Allow New User Registration
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Pricing & Fees</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Investment ($)
                </label>
                <input
                  type="number"
                  value={settings.pricing.minimumInvestment}
                  onChange={(e) => handleSettingChange('pricing', 'minimumInvestment', parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Investment ($)
                </label>
                <input
                  type="number"
                  value={settings.pricing.maximumInvestment}
                  onChange={(e) => handleSettingChange('pricing', 'maximumInvestment', parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Fee (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.pricing.platformFee}
                  onChange={(e) => handleSettingChange('pricing', 'platformFee', parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Fee (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.pricing.withdrawalFee}
                  onChange={(e) => handleSettingChange('pricing', 'withdrawalFee', parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Tile Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tile & Image Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Image Size (MB)
                </label>
                <input
                  type="number"
                  value={settings.tiles.maxImageSize}
                  onChange={(e) => handleSettingChange('tiles', 'maxImageSize', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-reject After (days)
                </label>
                <input
                  type="number"
                  value={settings.tiles.autoRejectAfterDays}
                  onChange={(e) => handleSettingChange('tiles', 'autoRejectAfterDays', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed File Types
                </label>
                <input
                  type="text"
                  value={settings.tiles.allowedFileTypes.join(', ')}
                  onChange={(e) => handleSettingChange('tiles', 'allowedFileTypes', e.target.value.split(', '))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="jpg, jpeg, png, gif"
                />
                <p className="text-xs text-gray-500 mt-1">Separate file types with commas</p>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="approval"
                    checked={settings.tiles.approvalRequired}
                    onChange={(e) => handleSettingChange('tiles', 'approvalRequired', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="approval" className="ml-3 text-sm text-gray-700">
                    Require Manual Approval for Images
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="email" className="ml-3 text-sm text-gray-700">
                  Email Notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="realtime"
                  checked={settings.notifications.realTimeNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'realTimeNotifications', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="realtime" className="ml-3 text-sm text-gray-700">
                  Real-time Investment Notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintenance-alerts"
                  checked={settings.notifications.maintenanceAlerts}
                  onChange={(e) => handleSettingChange('notifications', 'maintenanceAlerts', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="maintenance-alerts" className="ml-3 text-sm text-gray-700">
                  Maintenance Alerts
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="investment-alerts"
                  checked={settings.notifications.investmentAlerts}
                  onChange={(e) => handleSettingChange('notifications', 'investmentAlerts', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="investment-alerts" className="ml-3 text-sm text-gray-700">
                  Large Investment Alerts
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Save Settings</h3>
                <p className="text-sm text-gray-600">
                  Changes will take effect immediately after saving
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset to Default
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
                <p className="text-sm text-red-700 mt-1 mb-4">
                  These actions are irreversible and can cause significant disruption to the platform.
                </p>
                <div className="space-y-3">
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Reset All User Data
                  </button>
                  <button className="ml-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Clear All Tiles
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 