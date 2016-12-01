import { EmojiPipe } from "../emoji.pipe";

describe("EmojiPipe", () => {

  const emojiPipe = new EmojiPipe();
  it("should return empty string when passed empty string", () => {
     const result = emojiPipe.transform("");
     expect(result).toBe("");
  });

});