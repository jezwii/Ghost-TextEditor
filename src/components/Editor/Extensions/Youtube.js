import { Node, mergeAttributes } from "@tiptap/core";
import axios from "axios";

export const Bookmark = Node.create({
  name: "bookmark",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      url: { default: null },
      title: { default: "Loading..." },
      description: { default: "" },
      image: { default: "" },
    };
  },

  async renderHTML({ node }) {
    return [
      "div",
      { class: "bookmark-card border rounded-lg overflow-hidden my-4 shadow" },
      [
        "a",
        { href: node.attrs.url, target: "_blank", class: "flex gap-4 p-4" },
        node.attrs.image
          ? [
              "img",
              {
                src: node.attrs.image,
                class: "w-24 h-24 rounded object-cover",
              },
            ]
          : "",
        [
          "div",
          {},
          ["h3", { class: "font-semibold" }, node.attrs.title],
          ["p", { class: "text-sm text-gray-500" }, node.attrs.description],
          ["span", { class: "text-xs text-blue-500" }, node.attrs.url],
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setBookmark:
        (url) =>
        async ({ chain }) => {
          try {
            const res = await axios.get(
              "https://my-json-server.typicode.com/typicode/demo/posts/1"
            ); // mock
            return chain()
              .insertContent({
                type: "bookmark",
                attrs: {
                  url,
                  title: res.data.title,
                  description: "Mocked metadata description.",
                  image: "https://picsum.photos/200",
                },
              })
              .run();
          } catch (e) {
            console.error(e);
          }
        },
    };
  },
});
