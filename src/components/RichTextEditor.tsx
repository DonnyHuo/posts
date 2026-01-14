import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect, useState } from 'react';
import { Bold, Italic, List, Link as LinkIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write your content here...',
}: RichTextEditorProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[200px] sm:min-h-[300px] px-3 sm:px-4 py-2 sm:py-3 text-slate-900 dark:text-white',
        'data-placeholder': placeholder,
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const handleAddLink = () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    // 检查是否已经选中了链接
    const linkAttrs = editor.getAttributes('link');
    if (linkAttrs.href) {
      setLinkUrl(linkAttrs.href);
      setLinkText(selectedText || '');
    } else {
      setLinkText(selectedText || '');
      setLinkUrl('');
    }
    setShowLinkModal(true);
  };

  const confirmLink = () => {
    if (linkUrl.trim()) {
      const text = linkText.trim() || linkUrl;
      const { from, to } = editor.state.selection;
      
      if (from !== to && linkText.trim()) {
        // 如果有选中文本，替换为链接
        editor.chain().focus().deleteRange({ from, to }).insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`).run();
      } else {
        // 如果没有选中文本，插入链接
        editor.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`).run();
      }
      
      setShowLinkModal(false);
      setLinkUrl('');
      setLinkText('');
    }
  };


  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-black">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1.5 sm:p-2 border-b border-slate-200 dark:border-slate-700 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('bold')
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('italic')
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
        <button
          type="button"
          onClick={handleAddLink}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('link')
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Add Link"
        >
          <LinkIcon size={16} />
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Link Modal */}
      <AnimatePresence>
        {showLinkModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#161616] rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <LinkIcon size={20} />
                  Add Link
                </h3>
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkUrl('');
                    setLinkText('');
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Link Text
                  </label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Link text (optional)"
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-black dark:ring-slate-800 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-black dark:ring-slate-800 focus:border-transparent outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmLink();
                      }
                    }}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkModal(false);
                      setLinkUrl('');
                      setLinkText('');
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmLink}
                    disabled={!linkUrl.trim()}
                    className="flex-1 px-4 py-2 bg-black dark:bg-white dark:text-black hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    Add Link
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

