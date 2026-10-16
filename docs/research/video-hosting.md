# Video hosting and instant-start playback for a full-bleed showreel

Resolves [#2](https://github.com/TrueFiasco/test-site/issues/2). Researched 2026-10-16 against primary sources only (platform docs, browser vendor policy posts, pricing pages). Anything not found in a primary source is marked **UNVERIFIED**.

## Summary

1. **Demo page (unlisted, friends and family, several cuts):** self-host each cut as a progressive H.264 MP4 (faststart, ~5 Mbps, 45–75 MB) and play it with a native `<video autoplay muted playsinline loop>` element. Put the files on Cloudflare R2 (free tier: 10 GB storage, free egress) or Bunny (about $1/month); GitHub Pages works as a zero-setup fallback only if every file is re-encoded under 100 MiB and you accept the repo growing by ~60 MB per cut per round.
2. **Public showreel page:** the same native `<video>` recipe, same self-hosted MP4 (1080p plus a 720p variant for phones), served from R2 behind a custom domain or from Bunny. Cost at a few GB/month is $0–1.
3. **Do not use a YouTube or Vimeo iframe as the hero player.** Both scan uploads for copyright matches regardless of privacy setting; a Content ID "block" (YouTube) or a Copyright Match "set to private" (Vimeo) would silently break the hero, and a "monetize" claim puts ads inside your reel. Vimeo's chromeless/background embed also needs a paid plan.
4. **YouTube is still worth using as a secondary** (unlisted now, public later) for a shareable link, once the producer clearance is in. A claim there is not a strike and does not touch the site.
5. **Playback recipe:** `muted` + `autoplay` + `playsinline`, poster image, `preload="auto"`, `-movflags +faststart`, keyframes every 2 s, `position: fixed; object-fit: cover`, a `play()` promise catch that shows the poster and a play button, and an unmute button that restarts the reel from 0 inside the click handler.

## Host comparison

| Host | Cost for this use | File / storage limits | Muted autoplay, loop | Mobile inline | Chrome / branding | Content ID / copyright exposure |
|---|---|---|---|---|---|---|
| **YouTube unlisted iframe** | Free | No practical limit for a 100 MB upload | `autoplay=1`; `loop=1` needs `playlist=<same id>`; `mute=1` works in practice but is **not documented** on the player-parameters page (the IFrame API has `mute()`) [Y1][Y5] | `playsinline=1` (default is fullscreen on iOS, "subject to change") [Y1] | YouTube player chrome; `modestbranding` is deprecated and has no effect; `rel=0` now only limits related videos to your channel [Y1] | Every upload is scanned by Content ID; unlisted videos "can be reviewed by YouTube for ... copyright". Claim outcomes: block, monetize (ads), track. Claim is not a strike [Y2][Y3][Y4] |
| **Vimeo Free** | Free | 3 GB total for embeddable/non-public videos; 1 TB/month bandwidth for those [V1][V2] | `autoplay`, `muted`, `loop` on all plans [V3][V4] | `playsinline` default true [V3] | Cannot hide Vimeo logo/controls; `background=1` and `controls=0` require Starter or above [V3][V4] | Automated scanning "may" run "at any point"; a match sets the video private, viewable only by you, which breaks embeds [V5] |
| **Vimeo Starter+** | Price **UNVERIFIED** (pricing page is JS-rendered; not fetched) | Starter 2 TB storage, 2 TB/month [V1] | As above; `background=1` = no controls, autoplay, loop, muted [V3][V6] | Yes | Chromeless possible; logo hide on paid; "player and video branding" only from Standard [V1][V4] | Same as Free [V5] |
| **GitHub Pages (self-host MP4)** | Free | Hard block on files > 100 MiB; warning > 50 MiB; repo ideally < 1 GB; published site 1 GB max; soft 100 GB/month bandwidth; Git LFS "cannot be used with GitHub Pages sites" [G1][G2][G3] | Native `<video>`: yes | Native: yes with `playsinline` | None (your own element) | None. Exposure is only a DMCA notice to GitHub. Range-request support for seeking: **UNVERIFIED** |
| **Cloudflare R2 (self-host MP4)** | $0 at this scale: 10 GB-month storage, 1 M Class A and 10 M Class B ops free; egress free; $0.015/GB-month beyond [C1] | 5 GiB per single upload [C2] | Native: yes | Native: yes | None | None. `r2.dev` public URL is rate-limited and "for development purposes"; production wants a custom domain on a zone in the same Cloudflare account, which adds Cloudflare cache [C3][C2] |
| **Bunny Storage + CDN (self-host MP4)** | ~$1/month minimum; storage $0.01/GB-month; CDN $0.01/GB (EU/NA) or $0.005/GB volume tier [B1][B2] | No relevant limit | Native: yes | Native: yes | None | None. Gives a `*.b-cdn.net` hostname, so no DNS change needed |
| **Cloudflare Stream** | Storage sold in $5 increments per 1,000 minutes; delivery $1 per 1,000 minutes; so $5/month minimum [C4] | n/a | Iframe or own HLS player; `autoplay=true&muted=true&loop=true`, `preload`, `poster` [C5] | Yes | Stream player chrome (controls can be hidden; full unbranding **UNVERIFIED**) | None stated; it is your own account's storage |
| **Mux** | Encoding free; storage $0.003/min-month; delivery $0.001/min after 100,000 free minutes; $20/month usage credit on pay-as-you-go, so $0 at this scale [M1] | n/a | Own HLS player (Mux Player or hls.js); native HLS only in Safari | Yes | None if you use your own player | None stated |

Bunny Stream (transcoding, HLS) exists too: storage from $0.01/GB, delivery from $0.005/GB, free encoding, $1/month minimum [B3]. It is a reasonable "HLS without a Cloudflare account" option but is overkill for a single 2-minute file.

### Why self-host rather than YouTube/Vimeo for the hero

- **Reliability under copyright matching.** YouTube scans every upload and unlisted videos are explicitly in scope for copyright review [Y2][Y3]. Vimeo says uploads "may be scanned and set to private at any point" [V5]. In both cases the embed stops working or, for a YouTube "monetize" claim, starts showing ads over your work [Y4]. A self-hosted file cannot be changed under you.
- **Instant start is easier.** An iframe has to load the player app before the video; a native `<video>` with a faststart MP4 starts after the moov atom plus a second or two of data.
- **Chrome.** A full-bleed background needs no controls, no logo, no related-video end screen. YouTube cannot hide these (`modestbranding` is dead [Y1]); Vimeo can only on paid plans [V4].
- **Cost.** A 70 MB file viewed 100 times is 7 GB. R2 egress is free [C1]; Bunny would be about $0.07 [B1]; GitHub Pages' soft limit is 100 GB/month [G1].

### Why not GitHub Pages as the primary (public) host

It works, and it is zero setup, but: every re-encode is a new 50–90 MB blob in git history, the repo is recommended to stay under 1 GB [G2], LFS is not an escape hatch for Pages [G3], and whether Pages honours HTTP Range requests (needed for seeking, and iOS issues range requests for media) is **UNVERIFIED**. For the demo page a separate throwaway repo (so the main site's history stays small) is acceptable if you do not want to create a Cloudflare or Bunny account yet.

### Why not HLS (Stream, Mux, Bunny Stream)

Adaptive streaming is the right tool for long videos and mixed networks. For one 90–112 s file the trade-offs are: a player library on every browser except Safari, more moving parts, and either a $5/month floor (Stream [C4]) or a free credit you depend on (Mux [M1]). A progressive MP4 at ~5 Mbps plus a 720p fallback chosen by viewport covers the same ground with one HTML element. If you later put several long tutorial videos on the site, revisit Mux.

## Browser autoplay rules (what the recipe must satisfy)

| Browser | Muted autoplay | Audible autoplay | Notes |
|---|---|---|---|
| Chrome | "Muted autoplay is always allowed." | Only after the user has interacted with the domain, or via Media Engagement Index on desktop, or `allow="autoplay"` delegated to an iframe | Handle the `play()` promise rejection and show a play button; unmute inside a click handler [CH1] |
| Safari iOS | `<video muted>` and videos with no audio track autoplay without a gesture; needs `playsinline` or iPhone forces fullscreen; autoplay pauses when scrolled off-screen | If the element "becomes un-muted without a user gesture, playback will pause" | [WK1] |
| Safari macOS | Sound-bearing media blocked by default; silent videos may be stopped when off-screen or in a background tab; users can turn off all autoplay | Assume a click is needed; check the `play()` promise | A video with a *silent audio track* may not autoplay unless the `muted` attribute is set [WK2] |
| Firefox | "Muted autoplay is still allowed." | Blocked before a click, key press or touch; blocked `play()` rejects with `NotAllowedError` | Mozilla's own suggestion: "autoplay muted, and present an 'unmute' button" [FF1] |
| Spec/MDN | Autoplay permitted when muted or volume 0; `preload` default is browser-dependent, spec advises `metadata`; `autoplay="false"` does not disable autoplay (remove the attribute); `object-fit` does not apply to `<iframe>` [MD1][MD2][MD3] | | |

Consequences:

- `muted` must be an attribute in the HTML (not only set from script after load) and `autoplay` must be present; `playsinline` for iPhone.
- Never call `video.muted = false` outside a user-gesture handler.
- Always wrap `play()` and fall back to the poster plus a play button; iOS Low Power Mode and Safari's "never autoplay" preference will reject it (Low Power Mode behaviour: **UNVERIFIED**, not in the WebKit posts; the catch handles it either way).
- Because `object-fit` has no effect on iframes [MD3], a true "cover" crop of a YouTube/Vimeo embed needs oversized-iframe hacks; a native `<video>` gets it for free.

## Playback recipe

### HTML

```html
<!-- Full-bleed reel behind scrolling content -->
<div class="reel">
  <video class="reel__video"
         id="reel"
         autoplay muted playsinline loop
         preload="auto"
         poster="/media/reel/cut90-poster.jpg"
         disablepictureinpicture
         aria-label="True Fiasco showreel">
    <!-- src is set by the script below so phones get the 720p file -->
  </video>
  <button class="reel__unmute" id="reel-unmute" type="button" aria-pressed="false">
    Unmute
  </button>
  <button class="reel__play" id="reel-play" type="button" hidden>
    Play reel
  </button>
</div>

<main class="content">
  <!-- page content scrolls over the video -->
</main>

<script>
(() => {
  const v = document.getElementById('reel');
  const base = 'https://media.truefiasco.org/reel/cut90';   // R2 custom domain or b-cdn.net host
  const small = window.matchMedia('(max-width: 900px)').matches;
  v.src = small ? base + '-720p.mp4' : base + '-1080p.mp4';

  const playBtn = document.getElementById('reel-play');
  const unmute  = document.getElementById('reel-unmute');

  // Chrome, WebKit and Mozilla all say: don't assume play() succeeded.
  const p = v.play();
  if (p !== undefined) {
    p.catch(() => { playBtn.hidden = false; });
  }
  playBtn.addEventListener('click', () => {
    v.play().then(() => { playBtn.hidden = true; });
  });

  // Unmuting is only allowed inside a user gesture.
  // Restart from 0 so the music arc is heard from the top.
  unmute.addEventListener('click', () => {
    const wasMuted = v.muted;
    v.muted = !wasMuted;
    if (wasMuted) { v.currentTime = 0; v.play(); }
    unmute.textContent = wasMuted ? 'Mute' : 'Unmute';
    unmute.setAttribute('aria-pressed', String(wasMuted));
  });
})();
</script>
```

Demo page variant: render one `<video>` per cut (cut90, cut60A, cut60B, cut60C, draft1e) or one element with a `<select>` that swaps `src`; keep every element `muted` so they all autoplay, and only the one the viewer unmutes plays sound.

### CSS

```css
.reel {
  position: fixed;
  inset: 0;
  z-index: -1;            /* behind the scrolling content */
  overflow: hidden;
  background: #000;       /* shows before the poster/first frame */
}
.reel__video {
  width: 100%;
  height: 100%;
  object-fit: cover;      /* fills the viewport, crops the overflow (MDN) */
  object-position: 50% 50%;
}
.reel__unmute,
.reel__play {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 1;
}
.content {
  position: relative;
  min-height: 100svh;     /* small-viewport unit avoids the iOS URL-bar jump */
}
@media (prefers-reduced-motion: reduce) {
  .reel__video { display: none; }   /* respect OS motion preference; optional */
}
```

### Poster

Export a frame as JPEG (~60–120 KB at 1920x1080, quality 80) and reference it in `poster`. MDN: if `poster` is absent "nothing is displayed until the first frame is available" [MD2]; a poster removes the black flash on slow links and is what shows when autoplay is refused.

```sh
ffmpeg -ss 00:00:01.5 -i cut90-1080p.mp4 -frames:v 1 -q:v 3 cut90-poster.jpg
```

### Encoding target

Reference points from the platforms' own guidance:

- YouTube recommended *upload* bitrate for 1080p SDR at 24–30 fps: 8 Mbps; MP4 container, "moov atom at the front of the file (Fast Start)", stereo AAC 384 kbps [Y6].
- Vimeo recommended upload: H.264 High Profile, 1080p at 10–20 Mbps or CRF 18 or below, AAC-LC 320 kb/s [V7].
- Apple HLS authoring spec (the closest thing to a *delivery* bitrate from a browser vendor): 1920x1080 H.264 tiers at 6,000 and 7,800 kbit/s; keyframes (IDR) every two seconds; stereo AAC 32–160 kbit/s [A1].

Upload the full-quality master (or an 8 Mbps-plus export) to YouTube; those numbers are for files YouTube re-encodes. For the file the browser plays directly, aim lower than the Apple 1080p tiers because the page must start within a second on a phone:

| Target | Video | Audio | 90 s | 112 s |
|---|---|---|---|---|
| 1080p30 web hero | 5 Mbps (max 6) | AAC 160 kbps | ~58 MB | ~72 MB |
| 1080p30, more headroom | 4 Mbps (max 5) | AAC 160 kbps | ~47 MB | ~58 MB |
| 720p30 phone variant | 2.5 Mbps (max 3) | AAC 128 kbps | ~30 MB | ~37 MB |

(Sizes are arithmetic: (video + audio bitrate) x duration / 8.) All of these are under GitHub's 100 MiB hard limit; the 1080p ones exceed the 50 MiB warning threshold [G2]. Start-up cost with faststart is the moov atom (tens to a few hundred KB) plus roughly two seconds of media (~1.3 MB at 5 Mbps), so the file's total size does not affect time-to-first-frame; the bitrate versus the viewer's bandwidth does. Keyframes every 2 s (`-g 60` at 30 fps) match Apple's guidance [A1], make seeking snappy, and let you package the same file as HLS later without re-encoding.

The review copies (80–100 MB) are at or past the GitHub threshold and higher bitrate than needed; re-encode from the masters with the command below rather than uploading them.

### ffmpeg

`-movflags +faststart` runs "a second pass moving the index (moov atom) to the beginning of the file" [FF2]; `-g` is "Maximum GOP size", `-crf` sets constant-quality mode, `-b:v` is in bits/s [FF3]. Encoder options `-preset`, `-tune`, `-profile:v`, `-level` are documented in the libx264 section of the ffmpeg codecs doc [FF3]. (The ffmpeg wiki H.264 guide was behind a bot check at fetch time; nothing below depends on it.)

```sh
# 1080p30 hero: constant quality with a bitrate cap so the start never spikes,
# faststart, 2 s keyframes
ffmpeg -i master_cut90.mov \
  -vf "scale=1920:1080:flags=lanczos,fps=30,format=yuv420p" \
  -c:v libx264 -preset slow -profile:v high -level 4.0 \
  -crf 20 -maxrate 6M -bufsize 12M \
  -g 60 -keyint_min 60 -sc_threshold 0 \
  -c:a aac -b:a 160k -ac 2 -ar 48000 \
  -movflags +faststart \
  cut90-1080p.mp4

# 720p30 phone variant
ffmpeg -i master_cut90.mov \
  -vf "scale=1280:720:flags=lanczos,fps=30,format=yuv420p" \
  -c:v libx264 -preset slow -profile:v high -level 3.1 \
  -crf 21 -maxrate 3M -bufsize 6M \
  -g 60 -keyint_min 60 -sc_threshold 0 \
  -c:a aac -b:a 128k -ac 2 -ar 48000 \
  -movflags +faststart \
  cut90-720p.mp4
```

Notes:

- `-crf 20 -maxrate 6M` gives constant quality but caps peaks; if the result lands over ~75 MB for the 112 s cut, raise CRF to 22 or drop `-maxrate` to 5M.
- `format=yuv420p` and High profile level 4.0 are the broadly compatible choices for browser H.264 decoders (compatibility statement: **UNVERIFIED** from a primary source; it is the configuration the platforms' own upload guides assume [Y6][V7]).
- If you want to stay on the existing QSV pipeline, `-c:v h264_qsv -b:v 5M -maxrate 6M -g 60` is the equivalent shape, but libx264 `slow` is better quality per bit and a 2-minute encode takes seconds anyway. QSV flag equivalence: **UNVERIFIED**.
- Check the moov position: `ffprobe -v trace -i cut90-1080p.mp4 2>&1 | grep -m2 -E "type:'(moov|mdat)'"` should print `moov` before `mdat`.

## Risks

1. **Content ID on YouTube.** Scanning is automatic for every upload and unlisted videos are reviewed for copyright [Y2][Y3]. Outcomes are set by the rights holder: block (video unwatchable), monetize (ads on your reel, including inside embeds) or track; they can differ by country [Y2]. A claim is not a strike and does not affect the channel, but disputing without grounds invites a removal request, which does strike [Y4]. Who can register the Daddy Kev track in Content ID: rights holders with exclusive rights, typically via a distributor; whether this specific track is registered is **UNVERIFIED** [Y7]. Mitigation: hold the YouTube upload until the producer clearance is written; treat YouTube as a secondary link, never the page's player.
2. **Vimeo Copyright Match.** Vimeo "may automatically scan videos" and "set to private at any point"; a private video is viewable only by you and cannot be shared, so an embed goes dark. Appeal requires "a copy of the license from a reputable source" [V5]. Mitigation: same as above; the AWOL written permission plus the producer clearance would be the documents to hold.
3. **Self-hosting.** No automated matching. Exposure is a DMCA notice to the host (GitHub, Cloudflare, Bunny), handled through their takedown processes (process details: **UNVERIFIED**). Music-rights exposure is the same legal exposure either way; self-hosting only removes the *automated* enforcement that breaks the page without notice.
4. **GitHub Pages limits.** 100 MiB hard file limit, 1 GB published size, 100 GB/month soft bandwidth, no LFS [G1][G2][G3]. Fine for a demo, poor for iterating cuts.
5. **R2 `r2.dev` URL** is rate-limited and intended for development [C2][C3]. Fine for a friends-and-family demo; use a custom domain (needs truefiasco.org DNS on Cloudflare) or Bunny for the public page.
6. **Autoplay refused.** Low Power Mode, Safari's "Never auto-play" preference, data-saver settings. The recipe degrades to poster + play button, which is why the poster must look good.
7. **Bandwidth on phones.** 5 Mbps 1080p can stall on weak mobile links; the 720p variant for narrow viewports is the cheap fix. If it still stalls in testing, add a 540p/1.5 Mbps variant, or move to Mux/HLS.
8. **Data cost for visitors.** A looping 70 MB autoplaying video is a real cost on metered connections. Consider `prefers-reduced-data` (browser support limited, **UNVERIFIED**) or simply loop a shorter cut on mobile.

## Sources

**GitHub**
- [G1] GitHub Pages limits (1 GB site, 100 GB/month soft bandwidth): https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- [G2] About large files on GitHub (100 MiB block, 50 MiB warning, repo under 1 GB): https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- [G3] About Git Large File Storage ("Git LFS cannot be used with GitHub Pages sites"): https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage

**YouTube**
- [Y1] YouTube embedded player parameters (autoplay, loop+playlist, controls, playsinline, modestbranding deprecated, rel): https://developers.google.com/youtube/player_parameters
- [Y2] How Content ID works (automatic scan; block / monetize / track): https://support.google.com/youtube/answer/2797370
- [Y3] Change video privacy settings (unlisted "can be reviewed by YouTube for ad suitability, copyright, and other abuse prevention mechanisms"): https://support.google.com/youtube/answer/157177
- [Y4] Learn about Content ID claims (claims vs strikes, channel impact): https://support.google.com/youtube/answer/6013276
- [Y5] YouTube IFrame Player API (`mute()`, `unMute()`, `onAutoplayBlocked`): https://developers.google.com/youtube/iframe_api_reference
- [Y6] Recommended upload encoding settings (1080p 8 Mbps, MP4, faststart, AAC 384 kbps): https://support.google.com/youtube/answer/1722171
- [Y7] Qualifying for Content ID: https://support.google.com/youtube/answer/1311402
- Embed videos and playlists (`&autoplay=1`; autoplayed embeds don't count views): https://support.google.com/youtube/answer/171780

**Vimeo**
- [V1] About Vimeo plans (storage/bandwidth table; feature gating): https://help.vimeo.com/hc/en-us/articles/12425432033937-About-Vimeo-plans
- [V2] About the Vimeo Free plan (3 GB embeddable/non-public, 1 TB/month): https://help.vimeo.com/hc/en-us/articles/12425432518801-About-the-Vimeo-Free-plan
- [V3] About player parameters (autoplay, muted, background, loop, controls, playsinline; paid-plan requirements): https://help.vimeo.com/hc/en-us/articles/12426260232977-About-Player-Parameters
- [V4] Embedding features by plan type (background/chromeless, logo hiding, domain restriction = paid): https://help.vimeo.com/hc/en-us/articles/12426275096337-Embedding-features-by-plan-type
- [V5] Why was my video set to private? (Copyright Match behaviour, appeal, licence proof): https://help.vimeo.com/hc/en-us/articles/14798997442961-Why-was-my-video-set-to-private
- [V6] About embedding background and chromeless videos (`background=1`; muted exemption from autoplay restrictions): https://help.vimeo.com/hc/en-us/articles/12426285089681-About-embedding-background-and-Chromeless-videos
- [V7] Video and audio compression guidelines (H.264 High, 1080p 10–20 Mbps, CRF 18 or below, AAC-LC 320 kb/s): https://help.vimeo.com/hc/en-us/articles/12426043233169-Video-and-audio-compression-guidelines
- Bandwidth on Vimeo: https://help.vimeo.com/hc/en-us/articles/12426275404305-Bandwidth-on-Vimeo
- Vimeo pricing (not fetched; page is JS-rendered): https://vimeo.com/upgrade

**Cloudflare**
- [C1] R2 pricing (free tier, $0.015/GB-month, free egress): https://developers.cloudflare.com/r2/pricing/
- [C2] R2 limits (5 GiB single upload; `r2.dev` rate limit, not for production): https://developers.cloudflare.com/r2/reference/limits/
- [C3] R2 public buckets (`r2.dev` "for development purposes"; custom domains add cache/WAF): https://developers.cloudflare.com/r2/buckets/public-buckets/
- [C4] Stream pricing ($5 per 1,000 min stored; $1 per 1,000 min delivered): https://developers.cloudflare.com/stream/pricing/
- [C5] Stream player (iframe params autoplay/muted/loop/preload/poster): https://developers.cloudflare.com/stream/viewing-videos/using-the-stream-player/
- Stream with your own player (HLS/DASH manifests): https://developers.cloudflare.com/stream/viewing-videos/using-own-player/
- Stream MP4 downloads: https://developers.cloudflare.com/stream/viewing-videos/download-videos/

**Bunny**
- [B1] CDN pricing ($0.01/GB EU/NA standard; $0.005/GB volume; $1 minimum): https://bunny.net/pricing/
- [B2] Storage pricing ($0.01/GB-month HDD, $0.02 SSD; $1 minimum): https://bunny.net/storage/
- [B3] Stream pricing (from $0.01/GB storage, $0.005/GB delivery, free encoding): https://bunny.net/pricing/stream/

**Mux**
- [M1] Mux pricing (free encoding, $0.003/min storage, $0.001/min delivery after 100k free, $20/month credit): https://www.mux.com/pricing

**Browser autoplay policies**
- [CH1] Chrome: Autoplay policy in Chrome: https://developer.chrome.com/blog/autoplay/
- [WK1] WebKit: New video policies for iOS (muted autoplay, `playsinline`, unmute pauses): https://webkit.org/blog/6784/new-video-policies-for-ios/
- [WK2] WebKit: Auto-play policy changes for macOS: https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/
- [FF1] Mozilla Hacks: Firefox 66 to block automatically playing audible video and audio: https://hacks.mozilla.org/?p=33080
- [MD1] MDN Autoplay guide (conditions, `play()` promise handling, Permissions-Policy for iframes): https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- [MD2] MDN `<video>` element (autoplay, preload, poster, playsinline, muted): https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video
- [MD3] MDN `object-fit` (cover; no effect on iframes): https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit

**Encoding**
- [A1] Apple HLS authoring specification (1080p H.264 6,000/7,800 kbit/s tiers; IDR every 2 s; AAC 32–160 kbit/s): https://developer.apple.com/documentation/http-live-streaming/hls-authoring-specification-for-apple-devices
- [FF2] ffmpeg formats: mov/mp4 muxer `-movflags faststart`, `frag_keyframe`, `cmaf`: https://ffmpeg.org/ffmpeg-formats.html#mov_002c-mp4_002c-ismv
- [FF3] ffmpeg codecs: libx264 options (`preset`, `tune`, `profile`, `level`, `crf`, `g`, `b`), aac default 128 kbps: https://ffmpeg.org/ffmpeg-codecs.html#libx264_002c-libx264rgb
- ffmpeg wiki H.264 encoding guide (not fetched: bot check): https://trac.ffmpeg.org/wiki/Encode/H.264
