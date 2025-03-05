import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { X } from 'lucide-react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function ImageUploader({ onUpdate, initialImage }) {
  const [previewImage, setPreviewImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 80,
    aspect: 1,
    x: 10,
    y: 10
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSrc(reader.result);
        setShowModal(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoaded = (img) => {
    imgRef.current = img;
    return false;
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

    // 绘制圆形裁剪区域
    ctx.beginPath();
    ctx.arc(
      crop.width / 2,
      crop.height / 2,
      Math.min(crop.width, crop.height) / 2,
      0,
      2 * Math.PI
    );
    ctx.clip();

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
    if (!completedCrop || !previewCanvasRef.current) {
      return;
    }

    const canvas = previewCanvasRef.current;
    const dataUrl = canvas.toDataURL('image/jpeg');
    onUpdate(dataUrl);
    setPreviewImage(dataUrl);
    setShowModal(false);
    setSrc(null);
    setCompletedCrop(null);
  };

  const handleCancel = () => {
    setShowModal(false);
    setSrc(null);
    setCompletedCrop(null);
  };

  return (
    <>
      <div className="relative">
        <div 
          className="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-700 mb-4 flex items-center justify-center text-gray-500 dark:text-gray-400 overflow-hidden"
        >
          {initialImage ? (
            <img 
              src={initialImage} 
              alt="个人头像" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span>照片</span>
          )}
        </div>
        <div 
          className="absolute bottom-4 right-0 bg-primary text-white rounded-full p-2 cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
          onClick={() => document.getElementById('image-upload').click()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18 2l4 4-10 10H8v-4L18 2z"></path>
          </svg>
        </div>
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
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>裁剪图片</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                {src && (
                  <div className="mb-4 max-w-full">
                    <ReactCrop
                      src={src}
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                      circularCrop
                      keepSelection
                      ruleOfThirds
                    >
                      <img 
                        src={src} 
                        ref={imgRef} 
                        alt="裁剪图片" 
                        onLoad={(e) => {
                          imgRef.current = e.currentTarget;
                        }}
                      />
                    </ReactCrop>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      拖动或调整圆形区域来裁剪您的头像
                    </p>
                  </div>
                )}
                <div className="hidden">
                  <canvas
                    ref={previewCanvasRef}
                    className="rounded-full"
                  />
                </div>
                {completedCrop && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 text-center">
                      裁剪后的效果预览
                    </p>
                    <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mt-2 border-2 border-primary">
                      <canvas
                        ref={previewCanvasRef}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>取消</Button>
              <Button onClick={handleSave} disabled={!completedCrop}>确认</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
} 