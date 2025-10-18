import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { EditorContent, useEditor, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { FloatingMenu } from "@tiptap/extension-floating-menu";
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
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
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
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline" },
      }),
      Placeholder.configure({ placeholder: "Type '/' for commands..." }),
      FloatingMenu.configure({
        element: document.createElement("div"), // invisible, we'll handle our own
      }),
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

  // Hover tracking for floating “+” icon
  useEffect(() => {
    const editorEl = document.querySelector(".ProseMirror");
    if (!editorEl) return;
    const handleHover = (e) => {
      const block = e.target.closest("p, pre, blockquote, img");
      setHoveredBlock(block);
    };
    editorEl.addEventListener("mousemove", handleHover);
    return () => editorEl.removeEventListener("mousemove", handleHover);
  }, []);

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
    setShowMenu(false);
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
        className="text-5xl font-bold w-full mb-8 focus:outline-none placeholder-gray-300"
        placeholder="Post title..."
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
          </BubbleMenu>
        )}

        {/* Floating “+” beside blocks */}
        {hoveredBlock && (
          <button
            className="absolute p-1 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm"
            style={{
              top:
                hoveredBlock.getBoundingClientRect().top + window.scrollY + 4,
              left: hoveredBlock.getBoundingClientRect().left - 40,
            }}
            onClick={() => {
              const rect = hoveredBlock.getBoundingClientRect();
              setMenuPos({ x: rect.left + 10, y: rect.bottom });
              setShowMenu(true);
            }}
          >
            <Plus size={16} />
          </button>
        )}

        {/* EditorContent */}
        <EditorContent
          editor={editor}
          className="prose prose-lg max-w-none focus:outline-none min-h-[500px] text-lg leading-relaxed"
        />

        {/* Floating Menu */}
        {showMenu && (
          <div
            className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-64"
            style={{ top: menuPos.y, left: menuPos.x }}
          >
            <div className="p-2 space-y-1">
              <button
                onClick={() => insertBlock("image")}
                className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-100 rounded-md text-left text-sm"
              >
                <ImgIcon size={18} className="text-gray-500" /> Photo
              </button>
              <button
                onClick={() => insertBlock("html")}
                className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-100 rounded-md text-left text-sm"
              >
                <Code size={18} className="text-gray-500" /> Code block
              </button>
              <button
                onClick={() => insertBlock("divider")}
                className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-100 rounded-md text-left text-sm"
              >
                <Minus size={18} className="text-gray-500" /> Divider
              </button>
              <button
                onClick={() => insertBlock("bookmark")}
                className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-100 rounded-md text-left text-sm"
              >
                <Bookmark size={18} className="text-gray-500" /> Bookmark
              </button>
              <button
                onClick={() => insertBlock("youtube")}
                className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-100 rounded-md text-left text-sm"
              >
                <Youtube size={18} className="text-gray-500" /> YouTube
              </button>
              <button
                onClick={() => insertBlock("twitter")}
                className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-100 rounded-md text-left text-sm"
              >
                <Twitter size={18} className="text-gray-500" /> Tweet
              </button>
            </div>
          </div>
        )}

        {/* Overlay to close menu */}
        {showMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>
    </div>
  );
};

export default EditorPage;
