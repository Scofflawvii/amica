import { describe, expect, test } from "@jest/globals";
import { Talk } from "../src/features/chat/messages";
import { cleanTalk } from "../src/utils/cleanTalk";

function makeTalk(message: string): Talk {
  return {
    style: "talk",
    message,
  };
}

describe("Cleaning Talk Tests", () => {
  test("should return same thing", () => {
    const t = makeTalk("Hello");
    expect(cleanTalk(t).message).toBe("Hello");
  });
  test("should remove emoji", () => {
    const t = makeTalk("Hello 😊 Goodbye");
    expect(cleanTalk(t).message).toBe("Hello Goodbye");
  });
  test("should remove smiley", () => {
    const t = makeTalk("Hello :) how are you");
    expect(cleanTalk(t).message).toBe("Hello how are you");
  });
  test("should not remove non smiley", () => {
    const t = makeTalk("(WOOD)");
    expect(cleanTalk(t).message).toBe("(WOOD)");
  });
  test("should remove smiley start of sentence", () => {
    const t = makeTalk(":D");
    expect(cleanTalk(t).message).toBe("");
  });
  test("should remove multiple emoji + collapse spaces", () => {
    const t = makeTalk("Hi 😀😀   there 🚀 friend");
    expect(cleanTalk(t).message).toBe("Hi there friend");
  });
  test("should remove flags", () => {
    const t = makeTalk("Hello 🇺🇸 friend");
    expect(cleanTalk(t).message).toBe("Hello friend");
  });
  test("should remove pictographs", () => {
    const t = makeTalk("Check this out ✨ star");
    expect(cleanTalk(t).message).toBe(
      "Check this out  star".replace(/ {2}/g, " "),
    );
  });
  test("should not mutate style", () => {
    const t = makeTalk("Hello :) world");
    const cleaned = cleanTalk(t);
    expect(cleaned.style).toBe("talk");
  });
});
