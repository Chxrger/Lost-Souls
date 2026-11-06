const { QueryType } = require('discord-player');
const { YoutubeExtractor } = require('discord-player-youtubei');

const YOUTUBE_URL = /^https?:\/\/(?:[^/]+\.)?(?:youtube\.com|youtu\.be)(?:[/?#]|$)/i;

const YOUTUBE_TYPES = new Set([
  QueryType.AUTO,
  QueryType.AUTO_SEARCH,
  QueryType.YOUTUBE,
  QueryType.YOUTUBE_SEARCH,
  QueryType.YOUTUBE_VIDEO,
  QueryType.YOUTUBE_PLAYLIST
]);

/**
 * discord-player-youtubei 3.x accepts every query in validate(), which makes it
 * win the extractor race for SoundCloud/Spotify/direct links and fail them with
 * "No results found (Extractor: ...youtubei)".
 *
 * Restrict it to YouTube queries so the matching extractor gets picked.
 */
class SafeYoutubeExtractor extends YoutubeExtractor {
  async validate(query, type) {
    if (typeof query !== 'string') return false;
    if (YOUTUBE_TYPES.has(type)) return true;
    return YOUTUBE_URL.test(query);
  }
}

module.exports = { SafeYoutubeExtractor };
