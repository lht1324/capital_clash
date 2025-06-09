'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { ArrowLeftIcon, PhotoIcon, CheckIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline'
import { useContinentStore, ContinentId } from '@/store/continentStore'

interface PendingImage {
  id: string
  investorId: string
  continentId: string
  investorName: string
  continentName: string
  imageUrl: string
  uploadedAt: Date
  fileSize: number
  dimensions: { width: number; height: number }
  status: 'pending' | 'approved' | 'rejected'
}

export default function AdminImagesPage() {
  const { continents, updateImageStatus } = useContinentStore()
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [selectedImage, setSelectedImage] = useState<PendingImage | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedImages, setSelectedImages] = useState<string[]>([])

  // Extract pending images from continents data
  useEffect(() => {
    const images: PendingImage[] = []
    
    Object.entries(continents).forEach(([continentId, continent]) => {
      Object.values(continent.investors).forEach((investor) => {
        if (investor.imageStatus && investor.imageStatus !== 'none') {
          images.push({
            id: `${continentId}-${investor.id}`,
            investorId: investor.id,
            continentId: continentId,
            investorName: investor.name,
            continentName: continent.name,
            imageUrl: '/test.jpg', // Mock image URL
            uploadedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            fileSize: Math.floor(Math.random() * 2000000) + 100000, // 100KB - 2MB
            dimensions: { 
              width: Math.floor(Math.random() * 500) + 800, 
              height: Math.floor(Math.random() * 500) + 800 
            },
            status: investor.imageStatus
          })
        }
      })
    })
    
    setPendingImages(images)
  }, [continents])

  const filteredImages = useMemo(() => {
    if (filter === 'all') return pendingImages
    return pendingImages.filter(img => img.status === filter)
  }, [pendingImages, filter])

  const handleImageAction = (imageId: string, action: 'approve' | 'reject') => {
    const image = pendingImages.find(img => img.id === imageId)
    if (!image) return

    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    updateImageStatus(image.continentId as ContinentId, image.investorId, newStatus)
    
    setPendingImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, status: newStatus } : img
    ))
  }

  const handleBulkAction = (action: 'approve' | 'reject') => {
    selectedImages.forEach(imageId => {
      handleImageAction(imageId, action)
    })
    setSelectedImages([])
  }

  const handleSelectImage = (imageId: string) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const handleSelectAll = () => {
    const filteredIds = filteredImages.map(img => img.id)
    setSelectedImages(
      selectedImages.length === filteredIds.length ? [] : filteredIds
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: PendingImage['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const pendingCount = pendingImages.filter(img => img.status === 'pending').length

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
              <span className="text-sm text-gray-500">
                {pendingCount} pending approval
              </span>
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Image Approval</h1>
          <p className="mt-2 text-gray-600">
            Review and moderate uploaded territory images
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex space-x-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status === 'pending' && pendingCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {selectedImages.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Approve Selected ({selectedImages.length})
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Reject Selected ({selectedImages.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Images Grid */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No images to review</p>
            </div>
          ) : (
            <>
              {/* Select All Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedImages.length === filteredImages.length && filteredImages.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                  />
                  <span className="text-sm text-gray-700">
                    {selectedImages.length > 0
                      ? `${selectedImages.length} of ${filteredImages.length} selected`
                      : `${filteredImages.length} images`
                    }
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {filteredImages.map((image) => (
                  <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image.id)}
                        onChange={() => handleSelectImage(image.id)}
                        className="absolute top-3 left-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 z-10"
                      />
                      <img
                        src={image.imageUrl}
                        alt={`${image.investorName}'s territory image`}
                        className="w-full h-48 object-cover cursor-pointer"
                        onClick={() => {
                          setSelectedImage(image)
                          setIsPreviewOpen(true)
                        }}
                      />
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(image.status)}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{image.investorName}</h3>
                        <button
                          onClick={() => {
                            setSelectedImage(image)
                            setIsPreviewOpen(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{image.continentName}</p>
                      <p className="text-xs text-gray-500 mb-3">
                        {image.dimensions.width}×{image.dimensions.height} • {formatFileSize(image.fileSize)}
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Uploaded {formatDate(image.uploadedAt)}
                      </p>
                      
                      {image.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleImageAction(image.id, 'approve')}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleImageAction(image.id, 'reject')}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Image Preview Modal */}
        {isPreviewOpen && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="max-w-4xl max-h-full p-4">
              <div className="bg-white rounded-lg overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                  <div>
                    <h3 className="text-lg font-medium">{selectedImage.investorName}</h3>
                    <p className="text-sm text-gray-600">{selectedImage.continentName}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(selectedImage.status)}
                    <button
                      onClick={() => setIsPreviewOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <img
                    src={selectedImage.imageUrl}
                    alt={`${selectedImage.investorName}'s territory image`}
                    className="w-full max-h-96 object-contain"
                  />
                </div>
                
                <div className="p-4 border-t bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Dimensions:</span>
                      <span className="ml-2">{selectedImage.dimensions.width}×{selectedImage.dimensions.height}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">File Size:</span>
                      <span className="ml-2">{formatFileSize(selectedImage.fileSize)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Uploaded:</span>
                      <span className="ml-2">{formatDate(selectedImage.uploadedAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2">{selectedImage.status}</span>
                    </div>
                  </div>
                  
                  {selectedImage.status === 'pending' && (
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={() => {
                          handleImageAction(selectedImage.id, 'approve')
                          setIsPreviewOpen(false)
                        }}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleImageAction(selectedImage.id, 'reject')
                          setIsPreviewOpen(false)
                        }}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 