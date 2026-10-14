const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '..', '..', 'config');

const DEFAULT_CONFIG = {
  logChannelId: '',
  welcomeChannelId: '',
  autorole: {
    humans: [],
    bots: []
  },
  automod: {
    enabled: false,
    filteredWords: [],
    blockInvites: false,
    blockLinks: false,
    ignoreChannels: [],
    ignoreRoles: [],
    deleteMessage: true,
    warnUser: true
  },
  music: {
    defaultVolume: 80,
    leaveOnEmpty: true,
    leaveOnEnd: true,
    leaveOnEmptyCooldownMs: 300000,
    leaveOnEndCooldownMs: 300000
  }
};

const DEFAULT_EMBEDS = {
  information: {
    title: 'Information',
    description: 'Use `/config information` to edit this embed.',
    color: '#57F287',
    thumbnail: '',
    image: '',
    footer: '',
    fields: []
  },
  rules: {
    title: 'Server Rules',
    description: 'Use `/config rules` to edit this embed.',
    color: '#ED4245',
    thumbnail: '',
    image: '',
    footer: '',
    fields: []
  }
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return deepClone(fallback);
    throw new Error(`Failed to read ${file}: ${err.message}`);
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return data;
}

function createStore(name, fallback) {
  const file = path.join(CONFIG_DIR, `${name}.json`);
  return {
    file,
    get() {
      return readJson(file, fallback);
    },
    set(data) {
      return writeJson(file, data);
    },
    update(mutator) {
      const data = readJson(file, fallback);
      const result = mutator(data);
      writeJson(file, data);
      return result === undefined ? data : result;
    },
    reset() {
      return writeJson(file, deepClone(fallback));
    }
  };
}

const stores = {
  config: createStore('config', DEFAULT_CONFIG),
  embeds: createStore('embeds', DEFAULT_EMBEDS),
  reactionRoles: createStore('reactionroles', { messages: [] }),
  servers: createStore('servers', { servers: [] })
};

module.exports = {
  CONFIG_DIR,
  DEFAULT_CONFIG,
  DEFAULT_EMBEDS,
  stores,
  readJson,
  writeJson
};
