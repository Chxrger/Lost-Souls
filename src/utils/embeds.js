const { EmbedBuilder } = require('discord.js');

const COLORS = {
  success: 0x57f287,
  error: 0xed4245,
  warn: 0xfee75c,
  info: 0x5865f2,
  music: 0x1db954,
  neutral: 0x2b2d31
};

function parseColor(input) {
  if (typeof input === 'number') return input;
  if (typeof input === 'string' && input.trim()) {
    const parsed = parseInt(input.replace('#', '').trim(), 16);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return COLORS.info;
}

function base(description, color = COLORS.info) {
  const embed = new EmbedBuilder().setColor(color);
  if (description) embed.setDescription(description);
  return embed;
}

const success = (description) => base(description, COLORS.success);
const error = (description) => base(description, COLORS.error);
const warn = (description) => base(description, COLORS.warn);
const info = (description) => base(description, COLORS.info);

function fromConfig(entry = {}) {
  const embed = new EmbedBuilder().setColor(parseColor(entry.color));
  if (entry.title) embed.setTitle(entry.title);
  if (entry.description) embed.setDescription(entry.description);
  if (entry.thumbnail) embed.setThumbnail(entry.thumbnail);
  if (entry.image) embed.setImage(entry.image);
  if (entry.footer) embed.setFooter({ text: entry.footer });
  for (const field of Array.isArray(entry.fields) ? entry.fields : []) {
    if (!field || (!field.name && !field.value)) continue;
    embed.addFields({
      name: field.name || '\u200b',
      value: field.value || '\u200b',
      inline: Boolean(field.inline)
    });
  }
  return embed;
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0:00';
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

module.exports = {
  COLORS,
  parseColor,
  base,
  success,
  error,
  warn,
  info,
  fromConfig,
  formatDuration
};
