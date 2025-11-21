// src/App.tsx
import { useEffect, useState, useMemo, useRef } from 'react';
import { fetchStory, getApiBase } from './lib/fetcher';
import { Story, HeroSection } from './lib/types';
import VideoPlayer from './components/VideoPlayer';
import Paragraph from './components/Paragraph';
import PullQuote from './components/PullQuote';
import ImageGIF from './components/ImageGIF';
import ImageGroup from './components/ImageGroup';
import GlobalLightbox from './components/GlobalLightbox';
import Scrollytelling from './components/Scrollytelling';
import PostEditor from './components/PostEditor';
import HeroBlock from './components/HeroBlock';
import './App.css';

type PreviewMode = 'desktop' | 'tablet' | 'mobile';

const PREVIEW_OPTIONS: Array<{ value: PreviewMode; label: string; widthLabel: string }> = [
  { value: 'desktop', label: 'Desktop', widthLabel: '1200px' },
  { value: 'tablet', label: 'Tablet', widthLabel: '834px' },
  { value: 'mobile', label: 'Mobile', widthLabel: '428px' }
];

function App() {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDrawerMode, setIsDrawerMode] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [previewMenuOpen, setPreviewMenuOpen] = useState(false);
  const previewMenuRef = useRef<HTMLDivElement | null>(null);

  // === Iframe embed support ===
  const isEmbedMode = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      return u.searchParams.get('embed') === '1';
    } catch {
      return false;
    }
  }, []);

  const [showIframeModal, setShowIframeModal] = useState(false);
  const [iframeCode, setIframeCode] = useState('');

  // 保留当前 URL 的 ?api= 参数并添加 embed=1
  const buildEmbedUrl = () => {
    const url = new URL(window.location.href);
    ['preview', 'edit', 't'].forEach(k => url.searchParams.delete(k));
    url.searchParams.set('embed', '1');
    url.hash = '';
    return url.toString();
  };

  const openIframeModal = () => {
    const embedUrl = buildEmbedUrl();
    const code = `<iframe src="${embedUrl}" width="100%" height="1000" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    setIframeCode(code);
    setShowIframeModal(true);
  };

  const copyIframeCode = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      alert('Iframe code copied!');
    } catch {
      const el = document.getElementById('iframe-code-textarea') as HTMLTextAreaElement | null;
      if (el) {
        el.select();
        alert('Select all done. Press Ctrl/Cmd+C to copy.');
      }
    }
  };

  // Global Lightbox Status
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Loading story.json
  useEffect(() => {
    setLoading(true);
    fetchStory()
      .then(data => {
        setStory(data);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setStory(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [refreshKey]);

  useEffect(() => {
    const updateDrawerMode = () => {
      setIsDrawerMode(window.innerWidth <= 1024);
    };
    updateDrawerMode();
    window.addEventListener('resize', updateDrawerMode);
    return () => window.removeEventListener('resize', updateDrawerMode);
  }, []);

  useEffect(() => {
    if (isDrawerMode && showEditor) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [isDrawerMode, showEditor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (previewMenuRef.current && !previewMenuRef.current.contains(event.target as Node)) {
        setPreviewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditorToggle = () => setShowEditor(prev => !prev);
  const handleEditorClose = () => setShowEditor(false);
  const handleStoryRefresh = () => setRefreshKey(prev => prev + 1);

  // 安全拿 sections（后端异常时可能不是数组）
  const safeSections = useMemo(() => {
    if (!story || !Array.isArray((story as any).sections)) return [] as any[];
    return (story as any).sections as any[];
  }, [story]);

  const heroSection = useMemo(() => {
    if (!story) return null;
    const hero = safeSections.find((section) => section.type === 'hero') as HeroSection | undefined;
    return hero || null;
  }, [story, safeSections]);

  const contentSections = useMemo(() => {
    if (!story) return [];
    return safeSections.filter((section) => section.type !== 'hero');
  }, [story, safeSections]);

  // Collect all the pictures and calculate the global index
  const allImages = useMemo(() => {
    if (!story) return [];
    const images: Array<{
      src: string;
      alt: string;
      caption?: string;
      credit?: string;
      globalIndex: number;
    }> = [];
    contentSections.forEach((section: any) => {
      if (section.type === 'imagegroup' && Array.isArray(section.images)) {
        section.images.forEach((img: any) => {
          images.push({ ...img, globalIndex: images.length });
        });
      }
    });
    return images;
  }, [story, contentSections]);

  // Calculate the global starting index for each section
  const sectionsWithGlobalIndex = useMemo(() => {
    if (!story) return [];
    let globalIndex = 0;
    return contentSections.map((section: any) => {
      if (section.type === 'imagegroup' && Array.isArray(section.images)) {
        const sectionWithIndex = {
          ...section,
          globalStartIndex: globalIndex,
          totalImages: allImages.length
        };
        globalIndex += section.images.length;
        return sectionWithIndex;
      }
      return section;
    });
  }, [story, contentSections, allImages.length]);

  // Turn on/off the global Lightbox
  const openGlobalLightbox = (globalIndex: number) => {
    setLightboxIndex(globalIndex);
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);

  // Import "story.json" into the database
  const handleImportStory = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        alert('Importing ' + file.name + ' into the database...');
        const formData = new FormData();
        formData.append('file', file);

        // 使用 fetcher 的后端基址，而不是写死 localhost
        const response = await fetch(`${getApiBase()}/import/story_upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          alert(`Import succeeded!\nArticle ID: ${result.id}\nTitle: ${result.title}\nThe page will refresh automatically.`);
          window.location.reload();
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error((errorData as any).detail || 'Import failed');
        }
      } catch (error) {
        alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Import error:', error);
      }
    };
    input.click();
  };

  if (!story) {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading story...</p>
        </div>
      );
    }

    if (showEditor) {
      return <PostEditor onClose={handleEditorClose} />;
    }

    return (
      <div className="error-container">
        <h1>{error ? '⚠️ Unable to reach the backend' : '📝 No content yet'}</h1>
        <p style={{ margin: '20px 0', color: '#666' }}>
          {error
            ? `Error: ${error}\nPlease make sure the backend service (python main.py --port 8888) is running.`
            : 'Please import story.json data or create new content.'}
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button className="edit-button" onClick={handleImportStory}>📤 Import Data</button>
          <button className="edit-button" onClick={() => setShowEditor(true)}>✏️ Start Editing</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        'app-shell',
        showEditor ? 'editor-open' : '',
        isDrawerMode ? 'drawer-mode' : '',
        showEditor && isDrawerMode ? 'drawer-active' : ''
      ].filter(Boolean).join(' ')}
    >
      <div className={`preview-frame preview-${previewMode}`}>
        <div
          className="story-container"
          style={{
            fontFamily: story.theme?.font,
            '--primary-color': (story.theme as any)?.primaryColor
          } as React.CSSProperties}
        >
          <header className={`story-header${heroSection ? ' story-header--with-hero' : ''}`}>
            <div className="header-top">
              <div className="header-placeholder"></div>
              <div className="header-actions">
                <button className="edit-button" onClick={handleImportStory}>Import Data</button>
                <button
                  className="edit-button"
                  onClick={handleEditorToggle}
                  aria-pressed={showEditor}
                >
                  {showEditor ? 'Close Editor' : 'Edit'}
                </button>
                <button className="edit-button" onClick={openIframeModal}>Iframe</button>
                <div className="preview-control" ref={previewMenuRef}>
                  <button
                    className="edit-button preview-button"
                    onClick={() => setPreviewMenuOpen(prev => !prev)}
                    aria-expanded={previewMenuOpen}
                    aria-haspopup="listbox"
                  >
                    Preview
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path
                        d="M4 6l4 4 4-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {previewMenuOpen && (
                    <div className="preview-menu" role="listbox">
                      {PREVIEW_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          className={`preview-menu-item${previewMode === option.value ? ' active' : ''}`}
                          onClick={() => {
                            setPreviewMode(option.value);
                            setPreviewMenuOpen(false);
                          }}
                          role="option"
                          aria-selected={previewMode === option.value}
                        >
                          <span>{option.label}</span>
                          <small>{option.widthLabel}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {heroSection ? (
              <HeroBlock
                {...heroSection}
                fallbackTitle={story.title}
                fallbackStandfirst={story.standfirst}
              />
            ) : (
              <>
                <h1 className="story-title">{story.title}</h1>
                <p className="story-standfirst">{story.standfirst}</p>
              </>
            )}
          </header>

          <main className="story-content">
            {sectionsWithGlobalIndex.map((section: any, index: number) => {
              switch (section.type) {
                case 'video':
                  return <VideoPlayer key={`video-${index}`} {...section} />;
                case 'paragraph':
                  return <Paragraph key={`paragraph-${index}`} {...section} />;
                case 'pullquote':
                  return <PullQuote key={`quote-${index}`} {...section} />;
                case 'image':
                  return <ImageGIF key={`image-${index}`} {...section} onImageClick={openGlobalLightbox} />;
                case 'imagegroup':
                  return (
                    <ImageGroup
                      key={`imagegroup-${index}`}
                      images={section.images || []}
                      globalStartIndex={section.globalStartIndex}
                      totalImages={section.totalImages}
                      onImageClick={openGlobalLightbox}
                    />
                  );
                case 'scrollytelling':
                  return <Scrollytelling key={`scrollytelling-${index}`} {...section} />;
                default:
                  return null;
              }
            })}
          </main>

          <footer className="story-footer">
            <p>© 2025 Newsworthy - UNSW Student Journalism</p>
          </footer>

          {lightboxOpen && (
            <GlobalLightbox
              images={allImages}
              currentIndex={lightboxIndex}
              onClose={closeLightbox}
            />
          )}
        </div>
      </div>

      {showEditor && (
        <aside className="editor-sidebar">
          <PostEditor
            embedded
            onClose={handleEditorClose}
            onSectionsUpdated={handleStoryRefresh}
          />
        </aside>
      )}

      {showEditor && isDrawerMode && (
        <div
          className="editor-backdrop"
          aria-hidden="true"
          onClick={handleEditorClose}
        />
      )}

      {/* Iframe code modal */}
      {showIframeModal && (
        <div className="modal-backdrop" onClick={() => setShowIframeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>Embed this page</h3>
            <p style={{ marginBottom: 10, color: '#555' }}>
              Copy the snippet below to embed the current page elsewhere.
            </p>
            <textarea
              id="iframe-code-textarea"
              className="code-textarea"
              readOnly
              value={iframeCode}
              onFocus={(e) => e.currentTarget.select()}
              rows={5}
            />
            <div className="modal-actions">
              <button className="edit-button" onClick={copyIframeCode}>Copy</button>
              <button className="edit-button" onClick={() => setShowIframeModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
