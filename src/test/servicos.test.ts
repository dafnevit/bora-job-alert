import { describe, expect, it } from "vitest";
import { CATEGORIAS } from "../lib/bora";

describe("serviços oferecidos", () => {
  it("oferece exclusivamente faxina, diarista, eletricista e hidráulica", () => {
    expect(CATEGORIAS.map(({ id }) => id).sort()).toEqual([
      "diarista", "eletricista", "faxina", "hidraulica",
    ]);
  });
});