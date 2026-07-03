import { describe, it, expect } from "vitest";
import { audioEmbed, isWebUrl, videoEmbed, vimeoEmbed, youtubeEmbed } from "../src/utils/embed";

describe("embed helpers", () => {
  it("classifies web URLs vs vault paths", () => {
    expect(isWebUrl("https://example.com/a.mp3")).toBe(true);
    expect(isWebUrl("HTTP://x.y/z")).toBe(true);
    expect(isWebUrl("Media/song.mp3")).toBe(false);
    expect(isWebUrl("[[clip.mp4]]")).toBe(false);
  });

  it("rewrites YouTube page URLs to the embed player", () => {
    expect(youtubeEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
    expect(youtubeEmbed("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(youtubeEmbed("https://www.youtube.com/shorts/abcdef12345")).toBe(
      "https://www.youtube.com/embed/abcdef12345"
    );
    // Timestamp survives.
    expect(youtubeEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?start=42"
    );
    expect(youtubeEmbed("https://example.com/watch?v=nope")).toBeNull();
  });

  it("rewrites Vimeo page URLs to the player", () => {
    expect(vimeoEmbed("https://vimeo.com/76979871")).toBe("https://player.vimeo.com/video/76979871");
    expect(vimeoEmbed("https://vimeo.com/video/76979871")).toBe("https://player.vimeo.com/video/76979871");
    expect(vimeoEmbed("https://example.com/76979871")).toBeNull();
  });

  it("videoEmbed: local paths and direct files are native, services are iframes", () => {
    expect(videoEmbed("Media/clip.mp4")).toEqual({ kind: "file" });
    expect(videoEmbed("https://cdn.example.com/clip.webm?x=1")).toEqual({ kind: "file" });
    expect(videoEmbed("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      kind: "iframe",
      src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    });
    // Unknown pages fall back to framing the page itself.
    expect(videoEmbed("https://example.com/some-player")).toEqual({
      kind: "iframe",
      src: "https://example.com/some-player",
    });
  });

  it("audioEmbed: files are native; Spotify/SoundCloud become players", () => {
    expect(audioEmbed("Media/song.mp3")).toEqual({ kind: "file" });
    expect(audioEmbed("https://cdn.example.com/song.ogg")).toEqual({ kind: "file" });
    expect(audioEmbed("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")).toEqual({
      kind: "iframe",
      src: "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC",
    });
    expect(audioEmbed("https://soundcloud.com/artist/track")).toEqual({
      kind: "iframe",
      src: "https://w.soundcloud.com/player/?url=" + encodeURIComponent("https://soundcloud.com/artist/track"),
    });
    // Unknown URL: assume a direct stream.
    expect(audioEmbed("https://radio.example.com/stream")).toEqual({ kind: "file" });
  });
});
