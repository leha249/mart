import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  ImageIcon,
  Loader2,
  AlertCircle,
  Plus,
  Star,
} from 'lucide-react';
import { storageService } from '../services/storage';
import { useToast } from '../context/ToastContext';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

interface SingleProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: string;
  disabled?: boolean;
  multiple?: false;
}

interface MultiProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  aspect?: string;
  disabled?: boolean;
  multiple: true;
  maxImages?: number;
}

type Props = SingleProps | MultiProps;

const ImageUploader = (props: Props) => {
  const { label = 'Изображение', aspect = '3/4', disabled = false } = props;

  const isMultiple = props.multiple === true;
  const { addToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const currentImages = isMultiple ? props.value : [props.value].filter(Boolean);
  const maxImages = isMultiple ? props.maxImages ?? 8 : 1;

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (uploading || disabled) return;

      const fileArr = Array.from(files);
      const remaining = maxImages - currentImages.length;

      if (remaining <= 0) {
        addToast(`Максимум ${maxImages} фото`, 'error');
        return;
      }

      const toUpload = fileArr.slice(0, remaining);

      setUploading(true);
      setError(null);
      setProgress(0);

      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 12, 90));
      }, 150);

      try {
        const urls: string[] = [];
        for (let i = 0; i < toUpload.length; i++) {
          const { url } = await storageService.upload(toUpload[i]);
          urls.push(url);
          setProgress(Math.round(((i + 1) / toUpload.length) * 100));
        }

        if (isMultiple) {
          props.onChange([...props.value, ...urls]);
        } else {
          props.onChange(urls[0]);
        }

        addToast(
          urls.length === 1 ? 'Изображение загружено' : `Загружено: ${urls.length}`,
          'success'
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Ошибка загрузки';
        setError(msg);
        addToast(msg, 'error');
      } finally {
        clearInterval(interval);
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
        }, 300);
      }
    },
    [uploading, disabled, maxImages, currentImages.length, isMultiple, props, addToast]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFiles(files);
    e.target.value = '';
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (!uploading && !disabled) setDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragging(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    if (uploading || disabled) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleFiles(files);
  };

  const handleRemove = async (url: string) => {
    if (uploading || disabled) return;
    if (storageService.isOurFile(url)) {
      try {
        await storageService.removeByUrl(url);
      } catch {}
    }
    if (isMultiple) {
      props.onChange(props.value.filter((u) => u !== url));
    } else {
      props.onChange('');
    }
    setError(null);
  };

  const handleMakePrimary = (url: string) => {
    if (!isMultiple || props.value[0] === url) return;
    props.onChange([url, ...props.value.filter((u) => u !== url)]);
    addToast('Главное фото обновлено', 'success');
  };

  const handleClick = () => {
    if (!uploading && !disabled && currentImages.length < maxImages) {
      inputRef.current?.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          fontSize: 12,
          color: 'var(--muted)',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}
      >
        {label}
        {isMultiple && ` (${currentImages.length}/${maxImages})`}
      </div>

      {isMultiple ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 12,
          }}
        >
          {currentImages.map((url, idx) => (
            <div
              key={url}
              style={{
                position: 'relative',
                aspectRatio: aspect,
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
              className="upload-tile"
            >
              <img
                src={url}
                alt={`Фото ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {idx === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    background: 'var(--accent)',
                    color: '#000',
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 100,
                    letterSpacing: '0.5px',
                  }}
                >
                  ГЛАВНОЕ
                </div>
              )}

              <div
                className="upload-tile-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
              >
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleMakePrimary(url)}
                    aria-label="Сделать главным"
                    title="Сделать главным"
                    style={{
                      background: 'rgba(232,255,90,0.9)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                    }}
                  >
                    <Star size={13} fill="#000" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  aria-label="Удалить"
                  title="Удалить"
                  style={{
                    background: 'rgba(255,77,77,0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}

          {currentImages.length < maxImages && (
            <div
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label="Добавить фото"
              style={{
                aspectRatio: aspect,
                borderRadius: 12,
                border: '2px dashed',
                borderColor: dragging
                  ? 'var(--accent)'
                  : error
                  ? 'var(--danger)'
                  : 'var(--border)',
                background: dragging ? 'rgba(232,255,90,0.05)' : 'var(--surface)',
                cursor: uploading ? 'wait' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                color: 'var(--muted)',
                transition: 'all 0.25s',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {uploading ? (
                <>
                  <Loader2
                    size={24}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  <span
                    className="price-num"
                    style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}
                  >
                    {Math.round(progress)}%
                  </span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span style={{ fontSize: 11 }}>
                    {dragging ? 'Отпусти' : 'Добавить'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={
            currentImages[0] ? 'Заменить изображение' : 'Загрузить изображение'
          }
          aria-disabled={disabled}
          style={{
            position: 'relative',
            aspectRatio: aspect,
            maxWidth: 260,
            borderRadius: 16,
            border: '2px dashed',
            borderColor: disabled
              ? 'var(--border)'
              : dragging
              ? 'var(--accent)'
              : error
              ? 'var(--danger)'
              : 'var(--border)',
            background: dragging ? 'rgba(232,255,90,0.05)' : 'var(--surface)',
            cursor: disabled ? 'not-allowed' : uploading ? 'wait' : 'pointer',
            overflow: 'hidden',
            transition: 'border-color 0.25s, background 0.25s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {uploading ? (
            <>
              {currentImages[0] && (
                <img
                  src={currentImages[0]}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'blur(4px) brightness(0.5)',
                  }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  color: '#fff',
                }}
              >
                <Loader2
                  size={28}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {Math.round(progress)}%
                </div>
                <div
                  style={{
                    width: 100,
                    height: 3,
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: 'var(--accent)',
                      transition: 'width 0.15s',
                    }}
                  />
                </div>
              </div>
            </>
          ) : currentImages[0] ? (
            <>
              <img
                src={currentImages[0]}
                alt="Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={() => setError('Не удалось загрузить изображение')}
              />
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(currentImages[0]);
                }}
                disabled={disabled}
                aria-label="Удалить изображение"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}
              >
                <X size={16} />
              </motion.button>
              <div
                className="upload-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.25s',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  gap: 8,
                }}
              >
                <Upload size={16} /> Заменить
              </div>
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                color: 'var(--muted)',
                padding: 20,
                textAlign: 'center',
              }}
            >
              {error ? (
                <AlertCircle size={28} color="var(--danger)" />
              ) : (
                <ImageIcon size={28} />
              )}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 4,
                    color: error ? 'var(--danger)' : 'var(--text)',
                  }}
                >
                  {dragging ? 'Отпусти файл' : 'Нажми или перетащи'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  JPG, PNG, WEBP · до 5 МБ
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple={isMultiple}
        onChange={onInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      <AnimatePresence>
        {error && !uploading && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              fontSize: 12,
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertCircle size={12} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .upload-tile:hover .upload-tile-overlay { opacity: 1 !important; }
        div[role="button"]:hover .upload-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export default ImageUploader;