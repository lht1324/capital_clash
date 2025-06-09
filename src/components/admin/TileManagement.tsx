'use client'

import { useState, useEffect, useMemo } from 'react'
import { useContinentStore } from '@/store/continentStore'
import { 
  MapIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface TileData {
  id: string
  investorName: string
  continentId: string
  continentName: string
  investment: number
  share: number
  position: { x: number; y: number; size: number }
  imageStatus: 'none' | 'pending' | 'approved' | 'rejected'
  imageUrl?: string
  createdAt: Date
  lastUpdate: Date
  status: 'active' | 'suspended' | 'maintenance'
}

interface ContinentStats {
  id: string
  name: string
  totalTiles: number
  totalInvestment: number
  averageInvestment: number
  pendingImages: number
  suspendedTiles: number
}

export default function TileManagement() {
  const { continents, updateImageStatus } = useContinentStore()
  const [tiles, setTiles] = useState<TileData[]>([])
  const [continentStats, setContinentStats] = useState<ContinentStats[]>([])
  const [selectedContinent, setSelectedContinent] = useState<string>('all')
  const [selectedTile, setSelectedTile] = useState<TileData | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [actionFilter, setActionFilter] = useState<string>('all')

  // Extract tiles data from continents
  useEffect(() => {
    const extractedTiles: TileData[] = []
    const stats: ContinentStats[] = []
    
    Object.entries(continents).forEach(([continentId, continent]) => {
      let continentTotalInvestment = 0
      let pendingImages = 0
      let suspendedTiles = 0
      
      Object.values(continent.investors).forEach((investor) => {
        const tileStatus = Math.random() > 0.95 ? 'suspended' : Math.random() > 0.98 ? 'maintenance' : 'active'
        
        if (tileStatus === 'suspended') suspendedTiles++
        if (investor.imageStatus === 'pending') pendingImages++
        continentTotalInvestment += investor.investment
        
        extractedTiles.push({
          id: `${continentId}-${investor.id}`,
          investorName: investor.name,
          continentId,
          continentName: continent.name,
          investment: investor.investment,
          share: investor.share,
          position: investor.tilePosition || { x: 0, y: 0, size: 1 },
          imageStatus: investor.imageStatus || 'none',
          imageUrl: investor.imageUrl,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          lastUpdate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          status: tileStatus
        })
      })
      
      const investorCount = Object.values(continent.investors).length
      
      stats.push({
        id: continentId,
        name: continent.name,
        totalTiles: investorCount,
        totalInvestment: continentTotalInvestment,
        averageInvestment: investorCount > 0 ? continentTotalInvestment / investorCount : 0,
        pendingImages,
        suspendedTiles
      })
    })
    
    setTiles(extractedTiles)
    setContinentStats(stats)
  }, [continents])

  // Filter tiles based on selected continent and action filter
  const filteredTiles = useMemo(() => {
    let filtered = tiles

    if (selectedContinent !== 'all') {
      filtered = filtered.filter(tile => tile.continentId === selectedContinent)
    }

    if (actionFilter !== 'all') {
      switch (actionFilter) {
        case 'pending_images':
          filtered = filtered.filter(tile => tile.imageStatus === 'pending')
          break
        case 'suspended':
          filtered = filtered.filter(tile => tile.status === 'suspended')
          break
        case 'maintenance':
          filtered = filtered.filter(tile => tile.status === 'maintenance')
          break
        case 'no_image':
          filtered = filtered.filter(tile => tile.imageStatus === 'none')
          break
      }
    }

    return filtered
  }, [tiles, selectedContinent, actionFilter])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: TileData['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getImageStatusBadge = (status: TileData['imageStatus']) => {
    const styles = {
      none: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    
    const labels = {
      none: 'No Image',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const handleImageAction = (tileId: string, action: 'approve' | 'reject') => {
    const tile = tiles.find(t => t.id === tileId)
    if (!tile) return

    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    updateImageStatus('center', tile.investorName.split('_')[1], newStatus)
    
    // Update local state
    setTiles(prev => prev.map(t => 
      t.id === tileId ? { ...t, imageStatus: newStatus } : t
    ))
  }

  const handleTileAction = (tileId: string, action: 'suspend' | 'activate' | 'maintenance' | 'delete') => {
    if (action === 'delete') {
      if (confirm('Are you sure you want to delete this tile? This action cannot be undone.')) {
        setTiles(prev => prev.filter(t => t.id !== tileId))
      }
      return
    }

    const newStatus = action === 'suspend' ? 'suspended' : action === 'maintenance' ? 'maintenance' : 'active'
    setTiles(prev => prev.map(t => 
      t.id === tileId ? { ...t, status: newStatus } : t
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tile Management</h2>
          <p className="mt-1 text-gray-600">
            Manage {tiles.length} tiles across {continentStats.length} continents
          </p>
        </div>
      </div>

      {/* Continent Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {continentStats.map((stat) => (
          <div key={stat.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.totalTiles}</p>
                <p className="text-sm text-gray-600">tiles</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{formatCurrency(stat.totalInvestment)}</p>
                {stat.pendingImages > 0 && (
                  <p className="text-xs text-orange-600">{stat.pendingImages} pending images</p>
                )}
                {stat.suspendedTiles > 0 && (
                  <p className="text-xs text-red-600">{stat.suspendedTiles} suspended</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Continent</label>
            <select
              value={selectedContinent}
              onChange={(e) => setSelectedContinent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Continents</option>
              {continentStats.map((stat) => (
                <option key={stat.id} value={stat.id}>
                  {stat.name} ({stat.totalTiles} tiles)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action Required</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tiles</option>
              <option value="pending_images">Pending Images</option>
              <option value="suspended">Suspended Tiles</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="no_image">No Image Uploaded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tiles Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Continent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tile Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTiles.map((tile) => (
                <tr key={tile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                          <MapIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{tile.investorName}</div>
                        <div className="text-sm text-gray-500">{(tile.share * 100).toFixed(2)}% share</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{tile.continentName}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(tile.investment)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      ({tile.position.x}, {tile.position.y}) - {tile.position.size}×{tile.position.size}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getImageStatusBadge(tile.imageStatus)}
                      {tile.imageStatus === 'pending' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleImageAction(tile.id, 'approve')}
                            className="text-green-600 hover:text-green-900 text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleImageAction(tile.id, 'reject')}
                            className="text-red-600 hover:text-red-900 text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(tile.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(tile.lastUpdate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedTile(tile)
                          setIsDetailModalOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {tile.status === 'active' ? (
                        <button 
                          onClick={() => handleTileAction(tile.id, 'suspend')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleTileAction(tile.id, 'activate')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Activate
                        </button>
                      )}
                      <button 
                        onClick={() => handleTileAction(tile.id, 'delete')}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tile Detail Modal */}
      {isDetailModalOpen && selectedTile && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Tile Details</h3>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Investor</label>
                  <p className="text-sm text-gray-900">{selectedTile.investorName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Continent</label>
                  <p className="text-sm text-gray-900">{selectedTile.continentName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Investment</label>
                  <p className="text-sm text-gray-900">{formatCurrency(selectedTile.investment)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Share</label>
                  <p className="text-sm text-gray-900">{(selectedTile.share * 100).toFixed(2)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Position</label>
                  <p className="text-sm text-gray-900">
                    ({selectedTile.position.x}, {selectedTile.position.y}) - {selectedTile.position.size}×{selectedTile.position.size}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedTile.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Update</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedTile.lastUpdate)}</p>
                </div>
                {selectedTile.imageUrl && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Image</label>
                    <div className="mt-2">
                      <img 
                        src={selectedTile.imageUrl} 
                        alt="Tile image" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Edit Tile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 