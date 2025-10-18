import Image from "@tiptap/extension-image";

export const ImageEmbed = Image.extend({
  addOptions() {
    return {
      inline: false,
      HTMLAttributes: {
        class: "rounded-lg mx-auto my-4",
      },
    };
  },
});
