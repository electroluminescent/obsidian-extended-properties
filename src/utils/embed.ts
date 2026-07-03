/**
 * Pure helpers for the audio / video / pdf embed value types: classify a
 * source string (vault path vs. web URL vs. streaming service) and rewrite
 * service page URLs into their embeddable player form.
 *
 * Zero Obsidian imports - unit-tested directly (tests/embed.test.ts).
 */

/** How a media source should be embedded. */
export type MediaEmbed =
  /** Vault-local path/wikilink or a direct media URL - native element. */
  | { kind: "file" }
  /** A service player page - embed via iframe at `src`. */
  | { kind: "iframe"; src: string };

const VIDEO_EXT = /\.(mp4|webm|ogv|mov|m4v|mkv)(\?[^ ]*)?$/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|oga|m4a|flac|aac|opus|3gp)(\?[^ ]*)?$/i;

/** Whether the source is a web URL (anything else is a vault path/wikilink). */
export const isWebUrl = (s: string): boolean => /^https?:\/\//i.test(s.trim());

/**
 * YouTube page URL (watch / youtu.be / shorts / live / already-embed) ->
 * embed player URL, else null. A `t=`/`start=` timestamp is preserved.
 */
export function youtubeEmbed(url: string): string | null {
  const m = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{6,})/i.exec(
    url
  );
  if (!m) return null;
  const t = /[?&](?:t|start)=(\d+)/.exec(url);
  return `https://www.youtube.com/embed/${m[1]}${t ? `?start=${t[1]}` : ""}`;
}

/** Vimeo page URL -> player URL, else null. */
export function vimeoEmbed(url: string): string | null {
  const m = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(url);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

/**
 * How to embed a video source. Local paths and direct video-file URLs play
 * in a native `<video>`; YouTube/Vimeo page URLs become their player iframe;
 * any other web page falls back to embedding the page itself (many services
 * serve a playable page when framed).
 */
export function videoEmbed(src: string): MediaEmbed {
  const s = src.trim();
  if (!isWebUrl(s)) return { kind: "file" };
  const yt = youtubeEmbed(s);
  if (yt) return { kind: "iframe", src: yt };
  const vm = vimeoEmbed(s);
  if (vm) return { kind: "iframe", src: vm };
  if (VIDEO_EXT.test(s)) return { kind: "file" };
  return { kind: "iframe", src: s };
}

/**
 * How to embed an audio source. Local paths and direct audio-file URLs play
 * in a native `<audio>`; Spotify and SoundCloud page URLs become their embed
 * players; anything else is treated as a direct stream for `<audio>`.
 */
export function audioEmbed(src: string): MediaEmbed {
  const s = src.trim();
  if (!isWebUrl(s)) return { kind: "file" };
  if (AUDIO_EXT.test(s)) return { kind: "file" };
  const sp = /open\.spotify\.com\/(?:embed\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/.exec(s);
  if (sp) return { kind: "iframe", src: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}` };
  if (/soundcloud\.com\//i.test(s))
    return { kind: "iframe", src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(s)}` };
  return { kind: "file" };
}
