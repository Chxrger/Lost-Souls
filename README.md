# Emerald Discord Bot

A **private**, single-server Discord bot with:

- **Moderation** — purge (bulk delete), kick, ban, timeout, and an automod that auto-deletes filtered words / invite links / links.
- **Role management** — autoroles on join (separate for humans and bots), a `/role` command, and **reaction roles** that add/remove a role when a member reacts/un-reacts.
- **Music** — join a voice channel and play from YouTube, SoundCloud, Spotify (search) and direct URLs, with queue, loop, shuffle and volume controls.
- **Minecraft stats** — `/server` shows live status, MOTD, version and the online player list (Java **and** Bedrock).
- **Configurable embeds** — `/information` and `/rules` are edited in Discord with slash commands.

Built with [discord.js v14](https://discord.js.org) + [discord-player v7](https://discord-player.js.org).

---

## 1. Requirements

- **Node.js 18 or newer** — you have v24, which is fine.
- A Discord account that owns (or has admin on) the server.

No system FFmpeg needed — this project uses `ffmpeg-static`, which is installed with the dependencies.

> **OneDrive note:** this folder currently lives inside OneDrive. `node_modules` contains thousands of files and OneDrive will constantly try to sync them, which can slow things down or lock files. It is **strongly recommended** you move the `DiscordBot` folder somewhere outside OneDrive such as `C:\Bots\DiscordBot`.

---

## 2. Create your bot application

1. Go to https://discord.com/developers/applications and click **New Application**.
2. Open the **Bot** tab:
   - Click **Reset Token** → **Copy** the token. This is your `DISCORD_TOKEN`.
   - Scroll to **Privileged Gateway Intents** and enable **both**:
     - **Server Members Intent**
     - **Message Content Intent**
     - (These are required for autoroles, automod and reaction roles.)
3. Open the **General Information** tab and copy the **Application ID**. This is your `CLIENT_ID`.
4. Get your server ID: in Discord enable **Developer Mode** (User Settings → Advanced), then right-click your server → **Copy Server ID**. This is your `GUILD_ID`.

### Invite the bot

Replace `YOUR_CLIENT_ID` and open this URL:

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot%20applications.commands&permissions=1099783564358
```

The permission number includes: Manage Messages, Kick, Ban, Moderate Members, Manage Roles, Connect, Speak, Send Messages, Embed Links, Read History, Add Reactions and Use External Emojis. You can also just grant **Administrator** if you prefer.

> After inviting, drag the bot's role **above** any role you want it to hand out (reaction roles / autoroles require this).

---

## 3. Configure and run

```powershell
cd "DiscordBot"
Copy-Item .env.example .env     # then open .env and fill in your values
npm install
npm run deploy                  # registers the slash commands
npm start                       # starts the bot
```

Edit `.env`:

```ini
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id
GUILD_ID=your-server-id
EXTRA_GUILD_IDS=
```

After changing anything in `src/commands/`, run `npm run deploy` again so Discord updates the commands.

---

## 4. Commands

| Command | What it does |
|---|---|
| `/play <query>` | Join your voice channel and play/queue a song |
| `/pause` `/resume` `/skip` `/stop` `/leave` | Playback controls |
| `/queue` `/nowplaying` | Show the queue / current track |
| `/loop <mode>` `/shuffle` `/volume <0-100>` | Queue controls |
| `/purge <amount> [user] [contains]` | Bulk delete recent messages |
| `/kick` `/ban` `/timeout` | Moderation actions |
| `/role add\|remove` | Give/remove a role from a member |
| `/autorole add\|remove\|list` | Roles automatically given to new members |
| `/reactionrole add\|remove\|list` | Emoji → role mappings on a message |
| `/automod toggle\|word\|setting\|ignore-channel\|ignore-role\|status` | Configure the message filter |
| `/mcserver add\|remove\|list` | Configure Minecraft servers |
| `/server [name]` | Live Minecraft status + players online |
| `/config edit\|add-field\|clear-fields\|view\|log-channel\|welcome-channel\|reload` | Edit embeds / set channels |
| `/information` `/rules` | Post the configured embeds |
| `/help` `/ping` | Utility |

Most commands are hidden from members who lack the matching permission.

---

## 5. Common setups

### Automod (auto-delete messages)

All of these require **Manage Server**:

```
/automod toggle enabled:true
/automod word action:Add word:badword
/automod setting option:Block invite links enabled:true
/automod ignore-channel action:Add channel:#general
/automod status
```

Moderators (and anyone with an ignored role) are **never** filtered. Removed messages are logged to the channel set with `/config log-channel`.

### Reaction roles

1. Post the message you want members to react to.
2. Right-click it → **Copy Message ID** (Developer Mode must be on).
3. Run, for example:

```
/reactionrole add channel:#roles message_id:123456789012345678 emoji:🎮 role:@Gamer
```

The bot adds the reaction for you. Members who react get the role; when they remove their reaction, the role is removed. Use `/reactionrole list` to review and `/reactionrole remove` to unlink.

### Information & rules embeds

```
/config edit target:Rules title:Server Rules description:Be nice. color:#ED4245
/config add-field target:Rules name:1. Respect others value:Treat everyone kindly.
/config view target:Rules
```

Then post them with `/rules` and `/information`.

### Minecraft server

```
/mcserver add name:Survival host:play.example.com type:Java Edition
/server name:Survival
```

- Java servers default to port `25565`, Bedrock to `19132`. Override with the `port` option.
- Bedrock servers expose less data than Java ones, so the player list may not appear.

---

## 6. Running 24/7 on your Windows PC

**Double-click `start.bat`.** It starts the bot and automatically restarts it if it ever crashes. Keep the window open (you can minimize it).

To make it start automatically when you log in:

1. Press `Win + R`, type `shell:startup`, press Enter.
2. Put a shortcut to `start.bat` in that folder.

To run it even when you are not logged in, create a scheduled task: **Task Scheduler → Create Task → Triggers: At startup → Actions: Start a program → `start.bat`**, and tick **Run whether user is logged on or not**.

> The bot only runs while your PC is on and awake. For true 24/7 with no PC, run the same folder on a VPS/Raspberry Pi (use `node src/index.js`, and optionally `pm2 start src/index.js --name emerald-bot`).

---

## 7. Where is the data stored?

Everything lives in `config/` as plain JSON — safe to back up, and editable while the bot is stopped:

| File | Contents |
|---|---|
| `config/config.json` | log/welcome channels, autoroles, automod rules, music defaults |
| `config/embeds.json` | the `/information` and `/rules` embeds |
| `config/reactionroles.json` | message/emoji/role mappings |
| `config/servers.json` | Minecraft servers used by `/server` |

Delete the `.env` file or its contents if you ever share this folder — it holds your bot token.

---

## 8. Troubleshooting

- **Slash commands don't show up:** run `npm run deploy`, then wait a minute (guild commands update instantly; global ones can take up to an hour). Make sure `GUILD_ID` is correct.
- **Autoroles / reaction roles do nothing:** enable the **Server Members** intent, and make sure the bot's role is above the target roles.
- **Automod doesn't delete:** enable the **Message Content** intent, give the bot **Manage Messages**, and check `/automod status`.
- **Music won't play:** some YouTube videos are region/age/copyright restricted. Try a SoundCloud link or a different video. YouTube occasionally changes its API; if playback breaks for everything, update with `npm update discord-player @discord-player/extractor`.
- **Bot crashes on start:** open `start.bat`, read the error. Missing token / IDs in `.env` is the usual cause.

---

## Project layout

```
DiscordBot/
├─ config/              JSON data (see above)
├─ src/
│  ├─ index.js          entry point: player + client bootstrap
│  ├─ deploy-commands.js  command registration script
│  ├─ client.js         Discord client + intents
│  ├─ commands/         moderation | roles | music | config | utility
│  ├─ events/           ready, interactions, automod, autorole, reaction roles
│  ├─ handlers/         command + event loaders
│  ├─ music/            discord-player event wiring
│  └─ utils/            store, embeds, permissions, logging, helpers
├─ start.bat            24/7 auto-restart launcher
└─ deploy.bat           command registration launcher
```
