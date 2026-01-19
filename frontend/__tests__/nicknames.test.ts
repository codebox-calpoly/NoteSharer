import { generateRandomNickname, generateRandomNicknames } from "@/lib/nicknames";

describe("nicknames", () => {
  it("generates a nickname with letters and digits", () => {
    const nickname = generateRandomNickname();
    expect(nickname).toMatch(/^[A-Za-z]+[A-Za-z]+[0-9]{1,2}$/);
  });

  it("generates the requested count", () => {
    const nicknames = generateRandomNicknames(3);
    expect(nicknames).toHaveLength(3);
  });
});
