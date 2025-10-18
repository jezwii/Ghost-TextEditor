import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import ImageEmbed from "./Extensions/ImageEmbed";
import Youtube from "./Extensions/Youtube";
import Bookmark from "./Extensions/Bookmark";
import Toolbar from "./Toolbar";
import { usePostStore } from "../../store/postStore";
import { debounceSave } from "../../utils/debounceSave";

const RichTextEditor = () => {
  const { content, setContent } = usePostStore();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Type '/' for commands..." }),
      ImageEmbed,
      Youtube,
      Bookmark,
    ],
    content,
    onUpdate: debounceSave(({ editor }) => {
      setContent(editor.getHTML());
    }, 500),
  });

  return (
    <div className="border rounded-2xl p-4 bg-white">
      {editor && <Toolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="min-h-[300px] prose prose-gray max-w-none focus:outline-none"
      />
    </div>
  );
};

export default RichTextEditor;
