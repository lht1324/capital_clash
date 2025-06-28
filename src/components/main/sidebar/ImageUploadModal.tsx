'use client'

import {ChangeEvent, DragEvent, useCallback, useRef, useState} from 'react'
import {AlertCircle, Check, Image as ImageIcon, Upload, X} from 'lucide-react'
import {ImageStatus} from "@/api/types/supabase/Players";

export default function ImageUploadModal({
    onClose,
    onUpload,
    currentImageStatus = ImageStatus.PENDING
}: {
    onClose: () => void
    onUpload: (file: File) => void
    currentImageStatus?: ImageStatus
}) {
    const [dragActive, setDragActive] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDrag = useCallback((e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const files = e.dataTransfer.files
        if (files && files[0]) {
            handleFileSelection(files[0])
        }
    }, [])

    const handleFileSelection = useCallback((file: File) => {
        // File validation
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        const maxSize = 2 * 1024 * 1024 // 2MB

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            alert('Only JPG, PNG, and GIF files are allowed.')
            return
        }

        // Create preview and check aspect ratio
        const reader = new FileReader()
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string
            setPreview(dataUrl)

            // Check aspect ratio (1:1)
            const image = new Image()
            image.onload = () => {
                const aspectRatio = image.width / image.height

                if (image.width !== image.height || aspectRatio !== 1) {
                    alert('Image must have a 1:1 aspect ratio (square format).')
                    setSelectedFile(null)
                    setPreview(null)
                    return
                }

                // Check file size again
                const maxSize = 2 * 1024 * 1024; // 2MB
                if (file.size > maxSize) {
                    alert('File size must be less than 2MB.');
                    return;
                }

                // If all validations pass, set the selected file
                setSelectedFile(file)
            }
            image.onerror = () => {
                alert('Failed to load image. Please try another file.')
                setSelectedFile(null)
                setPreview(null)
            }
            image.src = dataUrl
        }
        reader.readAsDataURL(file)
    }, []);

    const handleFileInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]

        if (file) {
            handleFileSelection(file)
        }
    }, []);

    const handleUpload = useCallback(async () => {
        if (!selectedFile) return

        // Additional validation before upload
        const validateImage = (): Promise<boolean> => {
            return new Promise((resolve) => {
                const image = new Image();

                image.onload = () => {
                    // Check aspect ratio (1:1)
                    const aspectRatio = image.width / image.height;
                    console.log(`width = ${image.width}, height = ${image.height}, aspectRatio = ${aspectRatio}`)
                    if (image.width !== image.height || aspectRatio !== 1) {
                        alert('Image must have a 1:1 aspect ratio (square format).');
                        resolve(false);
                        return;
                    }

                    // Check file size again
                    const maxSize = 2 * 1024 * 1024; // 2MB
                    if (selectedFile.size > maxSize) {
                        alert('File size must be less than 2MB.');
                        resolve(false);
                        return;
                    }

                    resolve(true);
                };
                image.onerror = () => {
                    alert('Failed to load image. Please try another file.');
                    resolve(false);
                };
                image.src = preview as string;
            });
        };

        const isValid = await validateImage();

        if (!isValid) {
            setUploading(false);
            return;
        }

        setUploading(true);

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        onUpload(selectedFile);
        setUploading(false);
        setSelectedFile(null);
        setPreview(null);
        onClose();
    }, [selectedFile]);

    const resetSelection = useCallback(() => {
        setSelectedFile(null)
        setPreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{currentImageStatus === ImageStatus.APPROVED ? "Replace" : "Upload"} Territory Image</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Guidelines */}
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="text-blue-400 mt-1 flex-shrink-0" size={20} />
                        <div className="text-sm text-blue-200 space-y-2">
                            <p className="font-medium">Review Process Notice</p>
                            <ul className="space-y-1 text-xs">
                                <li>• Your image will be reviewed for approval</li>
                                <li>• Review process may take up to 24 hours</li>
                                <li>• Images must be in 1:1 aspect ratio (square format)</li>
                                <li>• Images containing inappropriate content will be rejected</li>
                                <li>• Ensure your image follows community guidelines</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Upload Area */}
                {!selectedFile ? (
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                            dragActive
                                ? 'border-purple-400 bg-purple-900/20'
                                : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                        <p className="text-white mb-2">Drag & drop your image here{currentImageStatus === ImageStatus.APPROVED ? " to replace" : ""}</p>
                        <p className="text-gray-400 text-sm mb-4">or</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Choose File
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />
                        <p className="text-xs text-gray-500 mt-4">
                            Supports: JPG, PNG, GIF (Max 2MB, 1:1 aspect ratio)
                        </p>
                    </div>
                ) : selectedFile ? (
                    /* Preview Area */
                    <div className="space-y-4">
                        <div className="relative aspect-square w-full">
                            <img
                                src={preview!}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-lg border border-gray-600"
                            />
                            <button
                                onClick={resetSelection}
                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                                <ImageIcon size={16} className="text-blue-400" />
                                <span className="text-sm font-medium text-white">{selectedFile.name}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                                Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={resetSelection}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        <span>Upload Image</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
