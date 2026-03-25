require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000;

const BOT_TOKEN = process.env.BOT_TOKEN;
const TARGET_USER_ID = process.env.TARGET_USER_ID;

if (!BOT_TOKEN || !TARGET_USER_ID) {
  console.error("Missing BOT_TOKEN or TARGET_USER_ID in .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ]
});

const timers = new Map();

function makeKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

function getUserState(member) {
  const voice = member.voice;
  const presence = member.presence;

  const inVoice = !!voice.channelId;
  const isIdle = presence?.status === "idle";
  const isMutedOrDeafened = !!voice.selfMute || !!voice.selfDeaf;

  return {
    qualifies: inVoice && isIdle && isMutedOrDeafened,
    channelId: voice.channelId ?? null
  };
}

async function evaluateMember(member) {
  if (!member || member.id !== TARGET_USER_ID) return;

  const state = getUserState(member);
  const key = makeKey(member.guild.id, member.id);
  const existing = timers.get(key);
  const now = Date.now();

  if (!state.qualifies) {
    if (existing) {
      timers.delete(key);
      console.log(`[RESET] ${member.user.tag} no longer matches disconnect conditions`);
    }
    return;
  }

  if (!existing) {
    timers.set(key, {
      startTime: now,
      channelId: state.channelId
    });
    console.log(`[START] Tracking ${member.user.tag}`);
    return;
  }

  if (existing.channelId !== state.channelId) {
    timers.set(key, {
      startTime: now,
      channelId: state.channelId
    });
    console.log(`[RESTART] ${member.user.tag} changed voice channels`);
    return;
  }

  const elapsed = now - existing.startTime;

  if (elapsed >= THREE_HOURS_MS) {
    try {
      await member.voice.setChannel(
        null,
        "Auto-disconnect after 3 hours idle and muted/deafened"
      );
      timers.delete(key);
      console.log(`[DISCONNECTED] ${member.user.tag} removed from voice`);
    } catch (err) {
      console.error(`[ERROR] Failed to disconnect ${member.user.tag}:`, err.message);
    }
  }
}

async function checkAllGuilds() {
  for (const guild of client.guilds.cache.values()) {
    try {
      const member = await guild.members.fetch(TARGET_USER_ID).catch(() => null);
      if (member) {
        await evaluateMember(member);
      }
    } catch (err) {
      console.error(`[ERROR] Guild ${guild.name}:`, err.message);
    }
  }
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await checkAllGuilds();
  setInterval(checkAllGuilds, CHECK_INTERVAL_MS);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  const member = newState.member || oldState.member;
  if (member) {
    await evaluateMember(member);
  }
});

client.on("presenceUpdate", async (oldPresence, newPresence) => {
  const member = newPresence?.member || oldPresence?.member;
  if (member) {
    await evaluateMember(member);
  }
});

process.on("SIGINT", async () => {
  console.log("Shutting down bot...");
  await client.destroy();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down bot...");
  await client.destroy();
  process.exit(0);
});

client.login(BOT_TOKEN);