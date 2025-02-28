import { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';

export default function ImageUploader({ onImageUpdate, currentImage }) {
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 100, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setSrc(reader.result));
      reader.readAsDataURL(e.target.files[0]);
      setShowModal(true);
    }
  };

  const onLoad = (img) => {
    imgRef.current = img;
  };

  useEffect(() => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
  }, [completedCrop]);

  const handleSave = () => {
    if (!previewCanvasRef.current) return;
    
    const dataUrl = previewCanvasRef.current.toDataURL('image/jpeg');
    onImageUpdate(dataUrl);
    setShowModal(false);
    setSrc(null);
  };

  const handleCancel = () => {
    setShowModal(false);
    setSrc(null);
  };

  return (
    <>
      <div 
        className="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-700 mb-4 flex items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer overflow-hidden"
        onClick={() => document.getElementById('image-upload').click()}
      >
        {currentImage ? (
          <img 
            src={currentImage} 
            alt="个人头像" 
            className="w-full h-full object-cover"
          />
        ) : (
          <span>上传照片</span>
        )}
      </div>
      <input
        type="file"
        id="image-upload"
        accept="image/*"
        onChange={onSelectFile}
        className="hidden"
      />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>裁剪图片</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                {src && (
                  <ReactCrop
                    src={src}
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    circularCrop
                    className="max-h-[60vh]"
                  >
                    <img
                      ref={imgRef}
                      alt="裁剪预览"
                      src={src}
                      onLoad={(e) => onLoad(e.currentTarget)}
                      className="max-h-[60vh]"
                    />
                  </ReactCrop>
                )}
                <div className="hidden">
                  <canvas
                    ref={previewCanvasRef}
                    style={{
                      width: completedCrop?.width ?? 0,
                      height: completedCrop?.height ?? 0
                    }}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>取消</Button>
              <Button onClick={handleSave}>确认</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
} 