import { create } from "zustand";
import { persist } from "zustand/middleware";

const usePostStore = create(
  persist(
    (set, get) => ({
      posts: [],

      addPost: (post) =>
        set((state) => ({
          posts: [...state.posts, post],
        })),

      updatePost: (id, updatedPost) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, ...updatedPost } : p
          ),
        })),

      deletePost: (id) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
        })),

      getPostById: (id) => get().posts.find((p) => p.id === id),
    }),
    {
      name: "posts-storage", // localStorage key
    }
  )
);

export default usePostStore;
