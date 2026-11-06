const { QueryType } = require('discord-player');

// discord-player-youtubei's validate() accepts every query, so it has to be
// blocked for non-YouTube links unless it is patched (see youtubeExtractor.js).
const YOUTUBEI = 'com.retrouser955.discord-player.discord-player-youtubei';

const SPOTIFY_ENGINES = {
  track: QueryType.SPOTIFY_SONG,
  album: QueryType.SPOTIFY_ALBUM,
  playlist: QueryType.SPOTIFY_PLAYLIST
};

function isUrl(value) {
  return /^https?:\/\//i.test(value);
}

function hostOf(url) {
  return url.hostname.replace(/^www\./i, '').toLowerCase();
}

function isHost(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

function resolveYoutube(url) {
  const list = url.searchParams.get('list') || '';
  const isRadio = list.startsWith('RD') || url.searchParams.get('start_radio') === '1';

  // YouTube "radio" links (&list=RD...&start_radio=1) resolve as a playlist
  // that youtubei returns empty. Play the single video instead.
  if (isRadio) {
    url.searchParams.delete('list');
    url.searchParams.delete('start_radio');
    url.searchParams.delete('index');
  }

  const hasVideo =
    url.searchParams.has('v') ||
    hostOf(url) === 'youtu.be' ||
    url.pathname.startsWith('/shorts/');
  const isPlaylist = !hasVideo && (url.pathname === '/playlist' || url.searchParams.has('list'));

  return {
    query: url.toString(),
    searchEngine: isPlaylist ? QueryType.YOUTUBE_PLAYLIST : QueryType.YOUTUBE_VIDEO
  };
}

function resolveSoundcloud(url) {
  return {
    query: url.toString(),
    searchEngine: /\/sets\//.test(url.pathname)
      ? QueryType.SOUNDCLOUD_PLAYLIST
      : QueryType.SOUNDCLOUD_TRACK,
    blockExtractors: [YOUTUBEI]
  };
}

function resolveSpotify(url) {
  const segments = url.pathname.split('/').filter(Boolean);
  const kind = segments[0]?.startsWith('intl-') ? segments[1] : segments[0];

  return {
    query: url.toString(),
    searchEngine: SPOTIFY_ENGINES[kind] || QueryType.SPOTIFY_SEARCH,
    blockExtractors: [YOUTUBEI]
  };
}

function resolveAppleMusic(url) {
  const segments = url.pathname.split('/').filter(Boolean);
  const kind = segments.find((part) => ['album', 'playlist', 'song'].includes(part));

  let searchEngine = QueryType.APPLE_MUSIC_SEARCH;
  if (kind === 'song' || (kind === 'album' && url.searchParams.has('i'))) {
    searchEngine = QueryType.APPLE_MUSIC_SONG;
  } else if (kind === 'album') {
    searchEngine = QueryType.APPLE_MUSIC_ALBUM;
  } else if (kind === 'playlist') {
    searchEngine = QueryType.APPLE_MUSIC_PLAYLIST;
  }

  return { query: url.toString(), searchEngine, blockExtractors: [YOUTUBEI] };
}

/**
 * Turns a /play argument into search options.
 *
 * Picking the search engine explicitly keeps each link on its own extractor
 * instead of relying on extractor ordering, and normalizes YouTube radio links.
 */
function resolvePlayQuery(input) {
  const query = String(input ?? '').trim();

  if (!isUrl(query)) {
    return { query, searchEngine: QueryType.YOUTUBE_SEARCH };
  }

  let url;
  try {
    url = new URL(query);
  } catch {
    return { query, searchEngine: QueryType.AUTO };
  }

  const host = hostOf(url);

  if (isHost(host, 'youtube.com') || host === 'youtu.be') {
    return resolveYoutube(url);
  }

  if (isHost(host, 'soundcloud.com')) {
    return resolveSoundcloud(url);
  }

  if (isHost(host, 'spotify.com')) {
    return resolveSpotify(url);
  }

  if (isHost(host, 'music.apple.com') || isHost(host, 'itunes.apple.com')) {
    return resolveAppleMusic(url);
  }

  if (isHost(host, 'vimeo.com')) {
    return { query: url.toString(), searchEngine: QueryType.VIMEO, blockExtractors: [YOUTUBEI] };
  }

  if (isHost(host, 'reverbnation.com')) {
    return { query: url.toString(), searchEngine: QueryType.REVERBNATION, blockExtractors: [YOUTUBEI] };
  }

  // Direct media URLs and everything else: let the attachment extractor try.
  return { query: url.toString(), searchEngine: QueryType.ARBITRARY, blockExtractors: [YOUTUBEI] };
}

module.exports = { resolvePlayQuery, isUrl };
