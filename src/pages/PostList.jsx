import React from "react";
import { Link, useNavigate } from "react-router-dom";
import usePostStore from "../store/postStore";

const PostsList = () => {
  const { posts, addPost, deletePost } = usePostStore();
  const navigate = useNavigate();

  const createNew = () => {
    const id = Date.now();
    addPost({ id, title: "Untitled Post", content: "", featuredImage: "" });
    navigate(`/editor/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Posts</h1>
        <button
          onClick={createNew}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Post
        </button>
      </div>
      <div className="grid gap-4">
        {posts.map((p) => (
          <div key={p.id} className="border rounded p-4 flex justify-between">
            <Link
              to={`/editor/${p.id}`}
              className="font-semibold hover:underline"
            >
              {p.title}
            </Link>
            <button onClick={() => deletePost(p.id)} className="text-red-500">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostsList;
