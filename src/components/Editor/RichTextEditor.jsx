import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Toolbar from "./Toolbar";
import { debounceSave } from "../../utils/debounceSave";
import usePostStore from "../../store/postStore";

const RichTextEditor = ({ postId }) => {
  const { updatePost, posts } = usePostStore();
  const post = posts.find((p) => p.id === postId);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true }),
      Placeholder.configure({ placeholder: "Start writing your post..." }),
    ],
    content: post?.content || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debounceSave(() => updatePost(postId, { content: html }));
    },
  });

  useEffect(() => {
    if (post?.content) editor?.commands.setContent(post.content);
  }, [post?.content]);

  return (
    <div className="max-w-3xl mx-auto my-8">
      <Toolbar editor={editor} />
      <div className="border rounded-md p-4 min-h-[400px] prose prose-lg max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
