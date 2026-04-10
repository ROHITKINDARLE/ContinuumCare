import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { uploadFile, generateFilePath, getSignedUrl } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';

export default function FileUpload({ bucket, onUploadComplete, accept = '.pdf,.png,.jpg,.jpeg' }) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragover, setDragover] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file || !user) return;
    setUploading(true);
    try {
      console.log('Uploading file:', file.name);
      const filePath = generateFilePath(user.id, file.name);
      
      const uploadResult = await uploadFile(bucket, filePath, file);
      console.log('Upload result:', uploadResult);
      
      const url = await getSignedUrl(bucket, filePath, 86400 * 7); // 7 day signed URL
      console.log('Signed URL generated');

      if (onUploadComplete) {
        await onUploadComplete({ url, fileName: file.name, filePath });
      }
    } catch (err) {
      console.error('Upload failed with error:', err);
      alert('Upload failed: ' + (err.message || JSON.stringify(err)));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div
      className={`file-upload-zone ${dragover ? 'dragover' : ''}`}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
      onDragLeave={() => setDragover(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <Upload size={32} className="file-upload-icon" />
      {uploading ? (
        <div className="file-upload-text">Uploading...</div>
      ) : (
        <>
          <div className="file-upload-text">
            <span>Click to upload</span> or drag and drop
          </div>
          <div className="file-upload-hint">PDF, PNG, JPG up to 10MB</div>
        </>
      )}
    </div>
  );
}
