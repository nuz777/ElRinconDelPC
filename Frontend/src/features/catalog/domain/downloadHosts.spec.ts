import { describe, expect, it } from "vitest";
import { normalizeDownloadHosts, summarizeDownloadHosts } from "./downloadHosts";

describe("downloadHosts", () => {
  it("resume 1 parte, varias en el mismo sitio y partes mezcladas", () => {
    expect(summarizeDownloadHosts(null)).toBeNull();
    expect(summarizeDownloadHosts([])).toBeNull();
    expect(summarizeDownloadHosts(["mega"])).toEqual({ kind: "single", host: "mega" });
    expect(summarizeDownloadHosts(["mediafire", "mediafire", "mediafire"])).toEqual({
      kind: "same",
      host: "mediafire",
      parts: 3,
    });
    expect(summarizeDownloadHosts(["mega", "mediafire"])).toEqual({ kind: "mixed", parts: ["mega", "mediafire"] });
  });

  it("descarta ids desconocidos al normalizar", () => {
    expect(normalizeDownloadHosts(["mega", "rapidgator", 3])).toEqual(["mega"]);
    expect(normalizeDownloadHosts(["nada"])).toBeNull();
    expect(normalizeDownloadHosts("mega")).toBeNull();
  });
});
