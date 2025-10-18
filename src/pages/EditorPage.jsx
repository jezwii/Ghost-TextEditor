import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  EditorContent,
  useEditor,
  BubbleMenu,
  FloatingMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
// Removed: import { FloatingMenu } from "@tiptap/extension-floating-menu";
import usePostStore from "../store/postStore";
import {
  Plus,
  Image as ImgIcon,
  Code,
  Minus,
  Youtube,
  Twitter,
  Bookmark,
} from "lucide-react";

const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { posts, updatePost, getPostById } = usePostStore();

  const [post, setPost] = useState(null);
  const [uploading, setUploading] = useState(false);
  // Robust hovering '+' button beside block
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [plusPos, setPlusPos] = useState({ top: 0, left: 0 });
  const plusTimeout = useRef(); // This line remains unchanged
  useLayoutEffect(() => {
    const editorEl = document.querySelector(".ProseMirror");
    if (!editorEl) return;
    let lastBlock = null;
    const handleMouseMove = (e) => {
      const block = e.target.closest(
        "p, pre, blockquote, img, h1, h2, h3, h4, h5, h6, ul, ol"
      );
      if (block && editorEl.contains(block)) {
        if (lastBlock !== block) {
          lastBlock = block;
          setHoveredBlock(block);
          const rect = block.getBoundingClientRect();
          setPlusPos({
            top: Math.max(rect.top + window.scrollY + rect.height / 2 - 16, 0),
            left: Math.max(rect.left - 40, 0),
          });
        }
        if (plusTimeout.current) clearTimeout(plusTimeout.current);
      } else {
        if (plusTimeout.current) clearTimeout(plusTimeout.current);
        plusTimeout.current = setTimeout(() => {
          setHoveredBlock(null);
        }, 100);
      }
    };
    editorEl.addEventListener("mousemove", handleMouseMove);
    editorEl.addEventListener("mouseleave", () => setHoveredBlock(null));
    return () => {
      editorEl.removeEventListener("mousemove", handleMouseMove);
      editorEl.removeEventListener("mouseleave", () => setHoveredBlock(null));
      if (plusTimeout.current) clearTimeout(plusTimeout.current);
    };
  }, []);
  const [saveTimer, setSaveTimer] = useState(null);
  const [saveStatus, setSaveStatus] = useState("All changes saved");

  // Load post
  useEffect(() => {
    const existingPost = getPostById(Number(id));
    if (existingPost) setPost(existingPost);
    else navigate("/");
  }, [id, posts, getPostById, navigate]);

  // Debounced autosave
  const handleEditorUpdate = useCallback(
    (editor) => {
      if (!post) return;
      if (saveTimer) clearTimeout(saveTimer);
      setSaveStatus("Saving...");

      const newTimer = setTimeout(() => {
        const content = editor.getHTML();
        updatePost(post.id, { content });
        setSaveStatus("All changes saved");
      }, 1500);

      setSaveTimer(newTimer);
    },
    [post, updatePost, saveTimer]
  );

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline" },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") return "Heading";
          return "Write your content...";
        },
        emptyEditorClass: "is-editor-empty",
      }),
      // Remove FloatingMenu extension config, handled by React component
    ],
    content: "",
    onUpdate: ({ editor }) => handleEditorUpdate(editor),
  });

  // Load existing content
  useEffect(() => {
    if (editor && post?.content) {
      editor.commands.setContent(post.content);
    }
  }, [editor, post]);

  // Removed custom hover tracking for floating menu

  // Image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      updatePost(post.id, { featuredImage: reader.result });
      setUploading(false);
      setSaveStatus("All changes saved");
    };
    reader.readAsDataURL(file);
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setPost((prev) => ({ ...prev, title }));
    setSaveStatus("Saving...");
    updatePost(post.id, { title });
    setTimeout(() => setSaveStatus("All changes saved"), 1000);
  };

  // Insert blocks
  const insertBlock = (type) => {
    if (!editor) return;
    switch (type) {
      case "image":
        document.getElementById("hiddenImageUpload").click();
        break;
      case "divider":
        editor.chain().focus().setHorizontalRule().run();
        break;
      case "html":
        editor
          .chain()
          .focus()
          .insertContent("<pre><code>Write code...</code></pre>")
          .run();
        break;
      case "youtube":
        editor
          .chain()
          .focus()
          .insertContent("<p>🎥 Embed YouTube URL...</p>")
          .run();
        break;
      case "twitter":
        editor
          .chain()
          .focus()
          .insertContent("<p>🐦 Embed Tweet URL...</p>")
          .run();
        break;
      case "bookmark":
        editor
          .chain()
          .focus()
          .insertContent("<p>🔖 Add bookmark URL...</p>")
          .run();
        break;
      default:
        break;
    }
    // setShowMenu(false); // removed, no longer needed
  };

  if (!post) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 text-sm text-gray-500">
        <button
          onClick={() => navigate("/")}
          className="hover:text-black transition"
        >
          ← Posts
        </button>
        <div>{saveStatus}</div>
      </div>

      {/* Cover Image */}
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 mb-8 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
        <label className="cursor-pointer">
          <input
            id="hiddenImageUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div className="text-gray-500 space-y-2">
            {uploading ? (
              <p>Uploading...</p>
            ) : post.featuredImage ? (
              <img
                src={post.featuredImage}
                alt="cover"
                className="w-full max-h-80 object-cover rounded-lg mx-auto"
              />
            ) : (
              <>
                <p className="text-sm font-medium">Click to upload cover</p>
                <p className="text-xs text-gray-400">
                  SVG, PNG, JPG or GIF (max. 800×400px)
                </p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Title */}
      <input
        value={post.title}
        onChange={handleTitleChange}
        className="text-5xl font-bold w-full mb-8 border-none outline-none placeholder-gray-400 bg-transparent"
        placeholder="Post title..."
        spellCheck={false}
        autoComplete="off"
      />

      {/* Editor */}
      <div className="relative">
        {editor && (
          <BubbleMenu
            editor={editor}
            className="flex gap-2 bg-white shadow-md rounded-md px-2 py-1"
          >
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className="font-bold"
            >
              B
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className="italic"
            >
              I
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className="underline"
            >
              U
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className="line-through"
            >
              S
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              H2
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              H3
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              UL
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              OL
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              ❝
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              ―
            </button>
            <button
              onClick={() => {
                const url = window.prompt("Enter URL") || "";
                if (!url) {
                  editor.chain().focus().unsetLink().run();
                  return;
                }
                editor.chain().focus().setLink({ href: url }).run();
              }}
            >
              🔗
            </button>
          </BubbleMenu>
        )}

        {/* Hovering "+" button beside block */}
        {hoveredBlock && (
          <button
            className="fixed z-50 p-1 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm"
            style={{
              top: plusPos.top,
              left: plusPos.left,
              transition: "top 0.1s, left 0.1s",
            }}
            onClick={() => {
              if (!editor) return;
              const pos = editor.view.posAtDOM(hoveredBlock, 0);
              editor.chain().focus().setTextSelection(pos).run();
            }}
            tabIndex={-1}
            aria-label="Add block"
          >
            <Plus size={16} />
          </button>
        )}

        {/* Floating Menu using TipTap's FloatingMenu component */}
        {editor && (
          <FloatingMenu
            editor={editor}
            tippyOptions={{
              placement: "right-start", // makes it appear beside the text
              offset: [0, 10], // slight gap between cursor and menu
              duration: 100,
            }}
            shouldShow={({ editor }) => {
              const { $from } = editor.state.selection;
              return (
                $from.parent.type.name === "paragraph" &&
                $from.parent.textContent.length === 0
              );
            }}
          >
            <div className="bg-white shadow-lg border border-gray-200 rounded-lg w-48 py-2">
              <button
                onClick={() => insertBlock("image")}
                className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
              >
                <ImgIcon size={16} /> Photo
              </button>
              <button
                onClick={() => insertBlock("html")}
                className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
              >
                <Code size={16} /> Code block
              </button>
              <button
                onClick={() => insertBlock("divider")}
                className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
              >
                <Minus size={16} /> Divider
              </button>
              <button
                onClick={() => insertBlock("bookmark")}
                className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
              >
                <Bookmark size={16} /> Bookmark
              </button>
              <button
                onClick={() => insertBlock("youtube")}
                className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
              >
                <Youtube size={16} /> YouTube
              </button>
              <button
                onClick={() => insertBlock("twitter")}
                className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
              >
                <Twitter size={16} /> Tweet
              </button>
            </div>
          </FloatingMenu>
        )}

        {/* EditorContent */}
        <EditorContent
          editor={editor}
          className="prose prose-lg max-w-none min-h-[500px] text-lg leading-relaxed is-editor-content bg-white border border-gray-200 rounded-md px-4 py-4 transition-shadow focus:shadow-none"
        />
        <style>{`
          .is-editor-empty:before {
            content: attr(data-placeholder);
            color: #a0aec0;
            pointer-events: none;
            position: absolute;
            left: 0.75rem;
            top: 0.75rem;
            font-size: 1.125rem;
          }
          .is-editor-content:focus {
            outline: none !important;
            box-shadow: none !important;
            border-color: #2563eb;
          }
        `}</style>

        {/* Removed custom floating menu and overlay */}
      </div>
    </div>
  );
};

export default EditorPage;
