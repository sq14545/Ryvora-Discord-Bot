
'use strict';
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const {
  Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
  ChannelType, PermissionFlagsBits: P, Events, REST, Routes,
  SlashCommandBuilder, MessageFlags
} = require('discord.js');

const C = {
  token: process.env.DISCORD_TOKEN, clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID, category: process.env.TICKET_CATEGORY_ID,
  staff: process.env.STAFF_ROLE_ID, verified: process.env.VERIFY_ROLE_ID,
  welcome: process.env.WELCOME_CHANNEL_ID || '',
  giveaway: process.env.GIVEAWAY_CHANNEL_ID || '',
  inviteLog: process.env.INVITE_LOG_CHANNEL_ID || '',
  ticketLog: process.env.TICKET_LOG_CHANNEL_ID || '',
  verifyLog: process.env.VERIFY_LOG_CHANNEL_ID || '',
  purple: 0x8b2cff, green: 0x57f287, yellow: 0xfee75c
};
for (const [name, value] of Object.entries({
  DISCORD_TOKEN: C.token, CLIENT_ID: C.clientId, GUILD_ID: C.guildId,
  TICKET_CATEGORY_ID: C.category, STAFF_ROLE_ID: C.staff,
  VERIFY_ROLE_ID: C.verified
})) if (!value) throw Error(`Missing .env value: ${name}`);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
const log = (...x) => console.log('[RYVORA]', ...x);
const logError = (...x) => console.error('[RYVORA]', ...x);
const DAY = 86400000;
const IMAGES = {
  ticket: 'ticket.png', verify: 'verify.png', welcome: 'welcome.png',
  giveaway: 'giveaway.png', leaderboard: 'leaderboard.png', inviteLog: 'invite-log.png',
  ticketPurchase: 'ticket-purchase.png', ticketPreSale: 'ticket-pre-sale.png',
  ticketSupport: 'ticket-support.png', ticketHwid: 'ticket-hwid.png',
  ticketMedia: 'ticket-media.png',
  products: {
    perm_croofer: 'perm-croofer.png', val_showcase: 'val-showcase.png',
    val_color_aim: 'val-color-aim.png', val_triggerbot: 'val-triggerbot.png',
    val_unlock_all: 'val-unlock-all.png', val_emu: 'val-emu.png',
    fn_retract: 'fn-retract.png', retract_showcase: 'retract-showcase.png',
    rust_external: 'rust-external.png', fivem_triggerbot: 'fivem-triggerbot.png',
    nvidia_bypass: 'nvidia-bypass.png', custom_cleaners: 'custom-cleaners.png',
    tweaks: 'tweaks.png', fortnite_accounts: 'fortnite-accounts.png',
    fortnite_vbucks: 'fortnite-vbucks.png'
  }
};
const PRODUCTS = [
  { command: 'perm_croofer', title: 'Perm Serial Changer', description: 'Permanent serial changer product information.', pricing: '• One Time Use → 24€\n• Unlimited Uses → **49€**' },
  { command: 'val_showcase', title: 'VAL Showcase', description: 'Features and product information for VAL Showcase.', pricing: process.env.VAL_SHOWCASE_PRICING || 'Contact our team for pricing.' },
  { command: 'val_color_aim', title: 'Val Colorbot', description: 'Features and product information for Val Colorbot.', pricing: '• 1 Day → 10€\n• 1 Week → 24€\n• 1 Month → 40€\n• Lifetime → **168€**' },
  { command: 'val_triggerbot', title: 'Val Triggerbot', description: 'Features and product information for Val Triggerbot.', pricing: '• 1 Day → 9€\n• 1 Week → 17€\n• 1 Month → 32€\n• Lifetime → **160€**' },
  { command: 'val_unlock_all', title: 'Val Unlock All', description: 'Features and product information for Val Unlock All.', pricing: '• 1 Day → 13€\n• 1 Week → 23€\n• 1 Month → 42€\n• Lifetime → **163€**' },
  { command: 'val_emu', title: 'Val Emulator', description: 'Features and product information for Val Emulator.', pricing: '• 3 Days → 43€\n• 1 Week → 64€\n• 1 Month → 105€\n• Lifetime → **250€**' },
  { command: 'fn_retract', title: 'FN Retract', description: 'Features and product information for FN Retract.', pricing: '• 1 Day → 9€\n• 1 Week → 19€\n• 1 Month → 37€\n• Lifetime → **164€**' },
  { command: 'retract_showcase', title: 'Retract Showcase', description: 'Features and product information for Retract Showcase.', pricing: process.env.RETRACT_SHOWCASE_PRICING || 'Contact our team for pricing.' },
  { command: 'rust_external', title: 'Rust External', description: 'Features and product information for Rust External.', pricing: '• 1 Day → 10€\n• 1 Week → 32€\n• 1 Month → 60€\n• Lifetime → **350€**' },
  { command: 'fivem_triggerbot', title: 'FiveM Triggerbot', description: 'Features and product information for FiveM Triggerbot.', pricing: '• 1 Week → 10€\n• 1 Month → 27€\n• Lifetime → **100€**' },
  { command: 'nvidia_bypass', title: 'NVIDIA Bypass', description: 'NVIDIA Bypass is intended for users who already have a hider and compatible NVIDIA stream-proof software.\n\nIt allows a regular black NVIDIA setting/profile to be used without appearing completely black in recordings.\n\nThis is not a bypass that makes cheats such as TZX or other cheats stream-proof.', pricing: '• NVIDIA Bypass → **$10**\n• NVIDIA Bypass + Mouse → **$15**' },
  { command: 'custom_cleaners', title: 'Custom Cleaners', description: '🧹 **Custom Cleaner Service**\n\nAvailable products:\n• TZX\n• GOSTH\n• TESTO\n• SKRIPTGG\n\nOptional NVIDIA stream-proof service: $10.\nContact staff for compatibility and service details.', pricing: '• Price per cleaner → **$35**' },
  { command: 'tweaks', title: 'PC Optimization', description: '🚀 **Complete PC Optimization**\n\n• BIOS Tuner\n• Network Adapter Tuner\n• Advanced Hardware Optimization\n• High Priority Customer Support\n• 20+ Advanced Features\n• All Plus Features\n\nPerformance improvements depend on your hardware and configuration.', pricing: '• PC Optimization (One Time) → **$30**\n• Re-PC Optimization (after a factory reset) → **$15**' },
  { command: 'fortnite_accounts', title: 'Fortnite Accounts', description: 'Full-access account listings. Contact staff to confirm availability and ownership-transfer terms.\n\n**Random Skin Accounts**\n• 50+ Random Skins → **$7.99**\n• 100+ Random Skins → **$11.99**\n• 150+ Random Skins → **$24.00**\n• 200+ Random Skins → **$27.00**\n\n**Guaranteed Exclusives**\n• IKONIK → $130\n• Wildcat → $130\n• Glow → $15\n• Galaxy → $78\n• Black Knight → $115\n• Travis Scott → $60\n\n**Other Accounts**\n• PC/PSN/XBOX — 82 skins → **$55**\n• PC/XBOX — 125 skins → **$85**\n• PC/PSN — 108 skins → **$65**\n\nOpen a ticket for details.', pricing: 'Prices are listed above.' },
  { command: 'fortnite_vbucks', title: 'Fortnite V-Bucks', description: 'Fortnite V-Bucks packages for PC Epic accounts.', pricing: '• PC - Epic → 4,500 V-Bucks → **$40**\n• PC - Epic → 12,500 V-Bucks → **$80**' }
];
const productByKey = new Map(PRODUCTS.map(p => [p.command, p]));

const CATEGORIES = {
  purchase: { name: 'Purchase', emoji: '🛒', image: IMAGES.ticketPurchase },
  pre_sale: { name: 'Pre-Sale Question', emoji: '❓', image: IMAGES.ticketPreSale },
  support: { name: 'Support', emoji: '🛠️', image: IMAGES.ticketSupport },
  hwid_reset: { name: 'HWID Reset', emoji: '🔑', image: IMAGES.ticketHwid },
  media_reseller: { name: 'Media / Reseller', emoji: '📦', image: IMAGES.ticketMedia }
};

function readJson(filename, fallback) {
  try { return JSON.parse(fs.readFileSync(filename, 'utf8')); }
  catch (e) { if (e.code !== 'ENOENT') logError('Data read failed:', filename, e.message); return fallback; }
}
function writeJson(filename, data) {
  const temp = filename + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, filename);
}
const DB_FILE = path.join(__dirname, 'ryvora-invites.json');
const STATE_FILE = path.join(__dirname, 'ryvora-state.json');
let db = { competition: null, members: {}, pending: {}, known: {}, unknownJoins: 0,
  ...readJson(DB_FILE, {}) };
let state = { tickets: {}, ...readJson(STATE_FILE, {}) };
for (const field of ['members', 'pending', 'known']) db[field] ||= {};
state.tickets ||= {};
const saveDb = () => writeJson(DB_FILE, db);
const saveState = () => writeJson(STATE_FILE, state);

function embed(title, description, color = C.purple) {
  return new EmbedBuilder().setColor(color).setTitle(title)
    .setDescription(description).setFooter({ text: 'Ryvora - Ultimate Methods' }).setTimestamp();
}
function imageFor(e, key, filename) {
  const url = (process.env[`IMAGE_${key.toUpperCase()}`] || '').trim();
  if (/^https:\/\//i.test(url)) { e.setImage(url); return []; }
  if (!filename || filename !== path.basename(filename)) return [];
  const full = path.join(__dirname, 'images', filename);
  if (!fs.existsSync(full)) return [];
  e.setImage('attachment://' + filename);
  return [new AttachmentBuilder(full, { name: filename })];
}
const admin = i => !!i.memberPermissions?.has(P.Administrator);
const manager = i => !!i.memberPermissions?.has(P.ManageGuild);
const staff = i => admin(i) || i.member?.roles?.cache?.has(C.staff) || !!i.memberPermissions?.has(P.ManageChannels);
async function defer(i) { if (!i.deferred && !i.replied) await i.deferReply({ flags: MessageFlags.Ephemeral }); }
async function respond(i, data) {
  const p = typeof data === 'string' ? { content: data } : data;
  if (i.deferred) return i.editReply(p);
  if (i.replied) return i.followUp({ ...p, flags: MessageFlags.Ephemeral });
  return i.reply({ ...p, flags: MessageFlags.Ephemeral });
}
async function getTextChannel(guild, id) {
  if (!id) return null;
  const c = await guild.channels.fetch(id).catch(() => null);
  return c?.isTextBased() && typeof c.send === 'function' ? c : null;
}
async function logTo(guild, id, payload) {
  const c = await getTextChannel(guild, id);
  if (!c) return;
  await c.send({ ...payload, allowedMentions: { parse: [] } })
    .catch(e => logError('Log failed:', e.message));
}

function ticketPanel() {
  const e = embed('🎫 RYVORA • SUPPORT CENTER',
    '## PREMIUM SUPPORT\n\n' +
    '🛒 **Purchase** — Place an order\n' +
    '❓ **Pre-Sale** — Product questions\n' +
    '🛠️ **Support** — Technical assistance\n' +
    '🔑 **HWID Reset** — Reset requests\n' +
    '📦 **Media / Reseller** — Partnerships\n\n' +
    '💜 Select a category to open a private ticket.');
  const menu = new StringSelectMenuBuilder().setCustomId('ryvora_ticket_category')
    .setPlaceholder('✦ Select a support category').addOptions(
      Object.entries(CATEGORIES).map(([value, x]) => ({ label: x.name, value, emoji: x.emoji })));
  return { embeds: [e], components: [new ActionRowBuilder().addComponents(menu)],
    files: imageFor(e, 'TICKET', IMAGES.ticket) };
}
function verifyPanel() {
  const e = embed('🔐 RYVORA • VERIFICATION',
    '## WELCOME TO RYVORA\n\nRead the rules, then click **Verify & Unlock** to receive access. 💜');
  const b = new ButtonBuilder().setCustomId('ryvora_verify').setLabel('Verify & Unlock')
    .setEmoji('✅').setStyle(ButtonStyle.Success);
  return { embeds: [e], files: imageFor(e, 'VERIFY', IMAGES.verify),
    components: [new ActionRowBuilder().addComponents(b)] };
}
function ticketButtons(claimed = false) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ryvora_claim_ticket').setLabel(claimed ? 'Claimed' : 'Claim Ticket')
      .setEmoji('🙋').setStyle(ButtonStyle.Primary).setDisabled(claimed),
    new ButtonBuilder().setCustomId('ryvora_close_ticket').setLabel('Close Ticket')
      .setEmoji('🔒').setStyle(ButtonStyle.Danger)
  )];
}
const ticketLocks = new Set();
const ownerFrom = channel => channel?.topic?.match(/(?:^|\|)ticket-owner:(\d+)/)?.[1] || null;
function activeTicket(channel) {
  return channel?.type === ChannelType.GuildText && channel.parentId === C.category && !!ownerFrom(channel);
}
async function createTicket(i, categoryKey, productKey = null) {
  await defer(i);
  const category = CATEGORIES[categoryKey];
  if (!category) return respond(i, '❌ Invalid category.');
  const lock = `${i.guildId}:${i.user.id}`;
  if (ticketLocks.has(lock)) return respond(i, '⏳ Ticket creation is already running.');
  ticketLocks.add(lock);
  let created = null;
  try {
    const guild = i.guild;
    const parent = await guild.channels.fetch(C.category).catch(() => null);
    if (parent?.type !== ChannelType.GuildCategory) return respond(i, '❌ TICKET_CATEGORY_ID must point to a category.');
    const bot = await guild.members.fetchMe();
    if (!bot.permissions.has(P.ManageChannels)) return respond(i, '❌ Bot needs Manage Channels.');
    if (!await guild.roles.fetch(C.staff).catch(() => null)) return respond(i, '❌ STAFF_ROLE_ID role not found.');
    await guild.channels.fetch();
    const existing = guild.channels.cache.find(ch => activeTicket(ch) && ownerFrom(ch) === i.user.id);
    if (existing) return respond(i, `⚠️ You already have an open ticket: ${existing}`);
    const product = productByKey.get(productKey);
    created = await guild.channels.create({
      name: `ticket-${categoryKey}-${i.user.id}`.slice(0, 95),
      type: ChannelType.GuildText, parent: C.category,
      topic: `ticket-owner:${i.user.id}|category:${categoryKey}`,
      permissionOverwrites: [
        { id: guild.id, deny: [P.ViewChannel] },
        { id: i.user.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles] },
        { id: C.staff, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles] },
        { id: bot.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageChannels, P.AttachFiles] }
      ]
    });
    const e = embed(`${category.emoji} RYVORA • ${category.name}`,
      `Welcome <@${i.user.id}>!\n\n**Category:** ${category.name}\n` +
      (product ? `**Product:** ${product.title}\n` : '') +
      '\nDescribe your request clearly. Our team will help you.');
    const imageKeys = { purchase: 'TICKET_PURCHASE', pre_sale: 'TICKET_PRE_SALE',
      support: 'TICKET_SUPPORT', hwid_reset: 'TICKET_HWID', media_reseller: 'TICKET_MEDIA' };
    await created.send({
      content: `<@${i.user.id}> <@&${C.staff}>`, embeds: [e],
      components: ticketButtons(), files: imageFor(e, imageKeys[categoryKey], category.image),
      allowedMentions: { users: [i.user.id], roles: [C.staff] }
    });
    state.tickets[created.id] = { ownerId: i.user.id, category: categoryKey,
      product: productKey, claimedBy: null, createdAt: Date.now() };
    saveState();
    await respond(i, `✅ Your ticket is ready: ${created}`);
    await logTo(guild, C.ticketLog, { embeds: [embed('🎫 TICKET CREATED',
      `**Owner:** <@${i.user.id}>\n**Category:** ${category.name}\n**Channel:** ${created}`)] });
  } catch (e) {
    if (created) await created.delete('Ticket setup failed').catch(() => {});
    if (created) { delete state.tickets[created.id]; saveState(); }
    throw e;
  } finally { ticketLocks.delete(lock); }
}
async function claimTicket(i) {
  await defer(i);
  if (!staff(i)) return respond(i, '❌ Staff only.');
  if (!activeTicket(i.channel)) return respond(i, '❌ This is not a ticket.');
  const t = state.tickets[i.channelId] ||= { ownerId: ownerFrom(i.channel),
    category: 'support', claimedBy: null, createdAt: Date.now() };
  if (t.claimedBy) return respond(i, `⚠️ Already claimed by <@${t.claimedBy}>.`);
  t.claimedBy = i.user.id;
  saveState();
  await i.message.edit({ components: ticketButtons(true) });
  await i.channel.send({ embeds: [embed('💜 STAFF ASSIGNED', `<@${i.user.id}> claimed this ticket.`)],
    allowedMentions: { parse: [] } });
  return respond(i, '✅ Ticket claimed.');
}
async function transcript(channel) {
  let before;
  const messages = [];
  for (let page = 0; page < 20; page++) {
    const batch = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
    if (!batch.size) break;
    messages.push(...batch.values());
    before = batch.last().id;
    if (batch.size < 100) break;
  }
  messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
  const lines = [`RYVORA TRANSCRIPT`, `Channel: ${channel.name} (${channel.id})`,
    `Generated: ${new Date().toISOString()}`, `Messages: ${messages.length}`, '---'];
  for (const m of messages) {
    lines.push(`[${new Date(m.createdTimestamp).toISOString()}] ${m.author?.tag || 'Unknown'} (${m.author?.id || '?'})`);
    if (m.content) lines.push(m.content);
    for (const a of m.attachments.values()) lines.push('Attachment: ' + a.url);
    lines.push('');
  }
  const buffer = Buffer.from(lines.join('\n'), 'utf8');
  return buffer.length <= 7 * 1024 * 1024
    ? new AttachmentBuilder(buffer, { name: `ryvora-ticket-${channel.id}.txt` }) : null;
}
async function closeTicket(i) {
  await defer(i);
  if (!activeTicket(i.channel)) return respond(i, '❌ This is not a ticket.');
  const owner = ownerFrom(i.channel);
  if (i.user.id !== owner && !staff(i)) return respond(i, '❌ Only owner or staff may close.');
  if (ticketLocks.has(i.channelId)) return respond(i, '⏳ Ticket already closing.');
  ticketLocks.add(i.channelId);
  try {
    await respond(i, '🔒 Saving transcript and closing ticket...');
    let file = null;
    try { file = await transcript(i.channel); }
    catch (e) { logError('Transcript error:', e); }
    const t = state.tickets[i.channelId];
    await logTo(i.guild, C.ticketLog, { embeds: [embed('🔒 TICKET CLOSED',
      `**Channel:** ${i.channel.name}\n**Owner:** <@${owner}>\n**Closed by:** <@${i.user.id}>\n` +
      `**Category:** ${t?.category || 'unknown'}\n**Claimed by:** ${t?.claimedBy ? `<@${t.claimedBy}>` : 'None'}`)],
      files: file ? [file] : [] });
    await i.channel.delete(`Closed by ${i.user.id}`);
    delete state.tickets[i.channelId]; saveState();
  } finally { ticketLocks.delete(i.channelId); }
}

// Invite credit is awarded on successful verification, not simply on join.
const inviteCache = new Map();
let inviteQueue = Promise.resolve();
function queued(operation) {
  const r = inviteQueue.then(operation);
  inviteQueue = r.catch(e => logError('Invite queue:', e));
  return r;
}
async function snapshot(guild) {
  const list = await guild.invites.fetch();
  return new Map(list.map(x => [x.code, { uses: x.uses || 0, inviter: x.inviterId || x.inviter?.id || null }]));
}
async function initInvites(guild) {
  try { inviteCache.set(guild.id, await snapshot(guild)); log('Invites cached.'); }
  catch (e) { logError('Manage Server permission required for invites:', e.message); }
}
const active = () => !!db.competition?.active && Date.now() < db.competition.endsAt;
const ranking = () => Object.entries(db.members)
  .map(([id, x]) => ({ id, count: x.joins?.length || 0 }))
  .filter(x => x.count > 0).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
function isKnown(id) { return !!db.known[id] || Object.values(db.members).some(x => x.joins?.includes(id)); }
async function joined(member) {
  const old = inviteCache.get(member.guild.id);
  let current;
  try { current = await snapshot(member.guild); }
  catch (e) { logError('Invite fetch:', e.message); return { status: 'unknown' }; }
  inviteCache.set(member.guild.id, current);
  const found = [];
  if (old) for (const [code, x] of current) {
    const p = old.get(code);
    if (p && x.uses > p.uses && x.inviter) found.push({ inviter: x.inviter, diff: x.uses - p.uses });
  }
  const inviter = found.length === 1 && found[0].diff === 1 ? found[0].inviter : null;
  let status = 'pending';
  if (!inviter) status = 'unknown';
  else if (member.user.bot) status = 'bot';
  else if (inviter === member.id) status = 'self';
  else if (Date.now() - member.user.createdTimestamp < 7 * DAY) status = 'new_account';
  else if (!active()) status = 'inactive';
  else if (isKnown(member.id)) status = 'duplicate';
  if (status === 'pending') db.pending[member.id] = { inviter, at: Date.now() };
  else if (status === 'unknown' && active()) db.unknownJoins++;
  saveDb();
  return { status, inviter };
}
async function creditVerified(member) {
  return queued(async () => {
    const pending = db.pending[member.id];
    if (!pending) return false;
    delete db.pending[member.id];
    if (!active() || pending.at < db.competition.startsAt || isKnown(member.id)) { saveDb(); return false; }
    const inviter = pending.inviter;
    if (!inviter || inviter === member.id) { saveDb(); return false; }
    const stats = db.members[inviter] ||= { invites: 0, joins: [] };
    stats.joins ||= [];
    stats.joins.push(member.id);
    stats.invites = stats.joins.length;
    db.known[member.id] = true;
    saveDb();
    log(`Verified invite credited: ${inviter} -> ${member.id}`);
    await logTo(member.guild, C.inviteLog, { embeds: [embed('✅ VERIFIED INVITE CREDITED',
      `**Joined:** <@${member.id}>\n**Inviter:** <@${inviter}>\n**Total:** ${stats.invites}`, C.green)] });
    return true;
  });
}
async function inviteLog(member, info) {
  const statuses = { pending: '⏳ Awaiting verification', bot: '❌ Bot', self: '❌ Self invite',
    new_account: '❌ Account younger than 7 days', inactive: 'ℹ️ No active competition',
    duplicate: '❌ Previously counted', unknown: '⚠️ Unverifiable invite' };
  const e = embed('📨 RYVORA • INVITE LOG',
    `**Joined:** <@${member.id}>\n**Inviter:** ${info.inviter ? `<@${info.inviter}>` : 'Unknown'}\n` +
    `**Status:** ${statuses[info.status] || info.status}`);
  await logTo(member.guild, C.inviteLog, { embeds: [e], files: imageFor(e, 'INVITE_LOG', IMAGES.inviteLog) });
}
client.on(Events.InviteCreate, x => {
  if (x.guild?.id !== C.guildId) return;
  queued(async () => {
    const cache = inviteCache.get(x.guild.id);
    if (cache) cache.set(x.code, { uses: x.uses || 0, inviter: x.inviterId || x.inviter?.id || null });
    else await initInvites(x.guild);
  });
});
client.on(Events.InviteDelete, x => {
  if (x.guild?.id === C.guildId) queued(async () => inviteCache.get(x.guild.id)?.delete(x.code));
});
client.on(Events.GuildMemberAdd, async m => {
  if (m.guild.id !== C.guildId) return;
  try { const info = await queued(() => joined(m)); await inviteLog(m, info); }
  catch (e) { logError('Join/invite:', e); }
  try { await welcome(m); } catch (e) { logError('Welcome:', e); }
});
client.on(Events.GuildMemberRemove, async m => {
  if (m.guild.id !== C.guildId) return;
  await queued(async () => {
    delete db.pending[m.id];
    for (const x of Object.values(db.members)) {
      const n = x.joins?.indexOf(m.id) ?? -1;
      if (n >= 0) { x.joins.splice(n, 1); x.invites = x.joins.length; }
    }
    // Keep known members to avoid repeat-join farming during same contest.
    saveDb();
  });
});

async function verifyMember(i) {
  await defer(i);
  const guild = i.guild;
  const member = await guild.members.fetch(i.user.id);
  const role = await guild.roles.fetch(C.verified).catch(() => null);
  const bot = await guild.members.fetchMe();
  if (!role) return respond(i, '❌ VERIFY_ROLE_ID was not found.');
  if (!bot.permissions.has(P.ManageRoles) || bot.roles.highest.position <= role.position)
    return respond(i, '❌ Enable Manage Roles and move the bot role above the Verify role.');
  if (member.roles.cache.has(role.id)) return respond(i, '💜 You are already verified.');
  await member.roles.add(role, 'Ryvora verification');
  await respond(i, '✅ Verification successful. Welcome to Ryvora! 💜');
  await creditVerified(member);
  await logTo(guild, C.verifyLog, { embeds: [embed('🔐 MEMBER VERIFIED',
    `**Member:** <@${member.id}>\n**Role:** <@&${role.id}>`)] });
}
async function welcome(member) {
  let channel = await getTextChannel(member.guild, C.welcome);
  if (!channel) {
    await member.guild.channels.fetch();
    channel = member.guild.channels.cache.find(x => x.type === ChannelType.GuildText &&
      ['welcome', 'welcomes'].some(t => x.name.toLowerCase().includes(t)));
  }
  if (!channel) return false;
  const e = embed('💜 RYVORA • WELCOME',
    `Welcome ${member}!\n\n🔐 Verify your account\n🎫 Open a support ticket\n` +
    `🛒 Explore products\n🎉 Join giveaways\n\n👥 **Member #${member.guild.memberCount}**`)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }));
  await channel.send({ content: `💜 Welcome ${member}!`, embeds: [e],
    files: imageFor(e, 'WELCOME', IMAGES.welcome),
    allowedMentions: { users: [member.id], parse: [] } });
  return true;
}

function leaderboardEmbed() {
  const r = ranking().slice(0, 10);
  return embed('🏆 RYVORA • INVITE LEADERBOARD',
    r.length ? r.map((x, n) => `**#${n + 1}** <@${x.id}> — **${x.count}** verified invites`).join('\n')
      : 'No verified invites yet.');
}
function giveawayEmbed() {
  const c = db.competition;
  if (!c) return embed('🎁 RYVORA • GIVEAWAY', 'No competition has been created.');
  const top = ranking().slice(0, 3);
  const status = active() ? `⏰ **Ends:** <t:${Math.floor(c.endsAt / 1000)}:R>` : '🔒 **Competition ended**';
  return embed('🎉 RYVORA • INVITE COMPETITION',
    `## INVITE FRIENDS & WIN!\n\n🏆 **Prize:** ${c.prize}\n${status}\n\n` +
    '📊 **Leaderboard**\n' + (top.length ? top.map((x, n) =>
      `${['🥇', '🥈', '🥉'][n]} <@${x.id}> — **${x.count}**`).join('\n') : 'No entries yet.') +
    '\n\n**Rules:** Real users only, accounts 7+ days old, must verify and stay in server. ' +
    'Unverifiable joins are not counted.');
}
async function startGiveaway(i) {
  await defer(i);
  if (!admin(i)) return respond(i, '❌ Administrator only.');
  if (db.competition?.active) return respond(i, '❌ End the current competition first.');
  const channel = i.options.getChannel('channel') || await getTextChannel(i.guild, C.giveaway) || i.channel;
  if (!channel || typeof channel.send !== 'function') return respond(i, '❌ Select a text channel.');
  let snap;
  try { snap = await snapshot(i.guild); }
  catch { return respond(i, '❌ Bot requires Manage Server to access invites.'); }
  const days = i.options.getInteger('days', true);
  const prize = i.options.getString('prize', true);
  const draft = { active: true, prize, startsAt: Date.now(), endsAt: Date.now() + days * DAY,
    channelId: channel.id, messageId: null };
  const e = embed('🎉 RYVORA • INVITE COMPETITION',
    `**Prize:** ${prize}\n**Ends:** <t:${Math.floor(draft.endsAt / 1000)}:R>\n\n` +
    'Invites count after verification. Members must stay in the server.');
  // Post before resetting previous stats, so a failed send cannot destroy data.
  const msg = await channel.send({ embeds: [e], files: imageFor(e, 'GIVEAWAY', IMAGES.giveaway),
    allowedMentions: { parse: [] } });
  inviteCache.set(i.guildId, snap);
  db.competition = { ...draft, messageId: msg.id };
  db.members = {}; db.pending = {}; db.known = {}; db.unknownJoins = 0;
  saveDb();
  await respond(i, `✅ Competition started in ${channel}.`);
}
async function endGiveaway(guild, automatic = false) {
  if (!db.competition?.active) return false;
  db.competition.active = false;
  saveDb();
  const r = ranking();
  let winner = 'No eligible winner.';
  if (r.length) {
    const ties = r.filter(x => x.count === r[0].count);
    winner = ties.length > 1
      ? `⚠️ Tie between: ${ties.map(x => `<@${x.id}>`).join(', ')}. Staff must decide.`
      : `🏆 **Winner:** <@${r[0].id}>\n**Verified invites:** ${r[0].count}\n` +
        `**Prize:** ${db.competition.prize}\nOpen a ticket to claim.`;
  }
  await logTo(guild, db.competition.channelId, {
    embeds: [embed('🏆 RYVORA • COMPETITION ENDED', winner)]
  });
  log('Competition ended', automatic ? '(automatic)' : '(manual)');
  return true;
}
async function refreshGiveaway(guild) {
  const c = db.competition;
  if (!active() || !c.messageId) return;
  const channel = await getTextChannel(guild, c.channelId);
  const msg = await channel?.messages.fetch(c.messageId).catch(() => null);
  if (!msg) return;
  const e = giveawayEmbed();
  if (msg.embeds[0]?.image?.url) e.setImage(msg.embeds[0].image.url);
  await msg.edit({ embeds: [e], allowedMentions: { parse: [] } });
}

function productCard(p) {
  const e = embed(`✦ ${p.title}`,
    `${p.description}\n\n━━━━━━━━━━━━━━━━━━━━\n💳 **PRICING**\n${p.pricing}\n\n` +
    '🛒 Click **Purchase / Open Ticket** to contact staff.');
  if (client.user) e.setAuthor({ name: 'RYVORA • PREMIUM PRODUCT CATALOG',
    iconURL: client.user.displayAvatarURL() });
  const button = new ButtonBuilder().setCustomId(`ryvora_buy:${p.command}`)
    .setLabel('Purchase / Open Ticket').setEmoji('🛒').setStyle(ButtonStyle.Primary);
  return { embeds: [e], files: imageFor(e, `PRODUCT_${p.command.toUpperCase()}`, IMAGES.products[p.command]),
    components: [new ActionRowBuilder().addComponents(button)] };
}
async function postProduct(i, p) {
  await defer(i);
  if (!manager(i)) return respond(i, '❌ Manage Server permission required.');
  await i.channel.send({ ...productCard(p), allowedMentions: { parse: [] } });
  return respond(i, `✅ ${p.title} product card posted.`);
}
function catalogPanel() {
  const e = embed('🛒 RYVORA • PRODUCT CATALOG',
    'Explore our product catalog. Select a product to view its details and pricing.');
  const menu = new StringSelectMenuBuilder().setCustomId('ryvora_catalog')
    .setPlaceholder('Choose a product').addOptions(PRODUCTS.map(p => ({
      label: p.title.slice(0, 100), value: p.command, description: 'View product information'
    })));
  return { embeds: [e], components: [new ActionRowBuilder().addComponents(menu)] };
}

const commands = [
  new SlashCommandBuilder().setName('setup').setDescription('Post the support ticket panel').setDefaultMemberPermissions(P.Administrator),
  new SlashCommandBuilder().setName('verify').setDescription('Post the verification panel').setDefaultMemberPermissions(P.Administrator),
  new SlashCommandBuilder().setName('catalog').setDescription('Browse Ryvora products'),
  new SlashCommandBuilder().setName('welcome-test').setDescription('Test welcome message').setDefaultMemberPermissions(P.Administrator),
  new SlashCommandBuilder().setName('invite-start').setDescription('Start an invite giveaway')
    .addIntegerOption(o => o.setName('days').setDescription('Length in days').setMinValue(1).setMaxValue(30).setRequired(true))
    .addStringOption(o => o.setName('prize').setDescription('Prize').setMaxLength(200).setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Announcement channel').addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(P.Administrator),
  new SlashCommandBuilder().setName('invite-top').setDescription('Show verified invite leaderboard'),
  new SlashCommandBuilder().setName('invites').setDescription('Check verified invite count')
    .addUserOption(o => o.setName('user').setDescription('Member to inspect')),
  new SlashCommandBuilder().setName('invite-end').setDescription('End the competition').setDefaultMemberPermissions(P.Administrator),
  new SlashCommandBuilder().setName('ryvora-status').setDescription('Show bot status').setDefaultMemberPermissions(P.Administrator),
  new SlashCommandBuilder().setName('ryvora-health').setDescription('Check bot configuration and permissions').setDefaultMemberPermissions(P.Administrator),
  new SlashCommandBuilder().setName('ticket-add').setDescription('Add a member to this ticket')
    .addUserOption(o => o.setName('user').setDescription('Member to add').setRequired(true))
    .setDefaultMemberPermissions(P.ManageChannels),
  ...PRODUCTS.map(p => new SlashCommandBuilder().setName(p.command)
    .setDescription(`Post ${p.title} product card`).setDefaultMemberPermissions(P.ManageGuild))
].map(x => x.toJSON());
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(C.token);
  await rest.put(Routes.applicationGuildCommands(C.clientId, C.guildId), { body: commands });
  log(`${commands.length} slash commands registered.`);
}
async function health(guild) {
  const bot = await guild.members.fetchMe();
  const role = await guild.roles.fetch(C.verified).catch(() => null);
  const cat = await guild.channels.fetch(C.category).catch(() => null);
  const checks = [
    ['Ticket category', cat?.type === ChannelType.GuildCategory],
    ['Staff role', !!await guild.roles.fetch(C.staff).catch(() => null)],
    ['Verify role', !!role],
    ['Manage Channels', bot.permissions.has(P.ManageChannels)],
    ['Manage Roles', bot.permissions.has(P.ManageRoles)],
    ['Verify role below bot', !!role && bot.roles.highest.position > role.position],
    ['Manage Server (invites)', bot.permissions.has(P.ManageGuild)]
  ];
  return embed('🩺 RYVORA • HEALTH CHECK', checks.map(([name, ok]) =>
    `${ok ? '✅' : '❌'} ${name}`).join('\n') +
    '\n\nℹ️ Enable **Server Members Intent** in Discord Developer Portal for member events.');
}

const inProgress = new Set();
client.on(Events.InteractionCreate, async i => {
  if (!i.inGuild() || i.guildId !== C.guildId) return;
  if (inProgress.has(i.id)) return;
  inProgress.add(i.id);
  try {
    if (i.isChatInputCommand()) {
      const n = i.commandName;
      if (n === 'setup' || n === 'verify') {
        await defer(i);
        if (!admin(i)) return respond(i, '❌ Administrator only.');
        await i.channel.send({ ...(n === 'setup' ? ticketPanel() : verifyPanel()),
          allowedMentions: { parse: [] } });
        return respond(i, `✅ ${n === 'setup' ? 'Ticket' : 'Verify'} panel posted.`);
      }
      if (n === 'catalog') return i.reply({ ...catalogPanel(), flags: MessageFlags.Ephemeral });
      if (n === 'welcome-test') {
        await defer(i);
        if (!admin(i)) return respond(i, '❌ Administrator only.');
        return respond(i, await welcome(await i.guild.members.fetch(i.user.id))
          ? '✅ Welcome preview posted.' : '❌ Welcome channel not found.');
      }
      if (n === 'invite-start') return startGiveaway(i);
      if (n === 'invite-end') {
        await defer(i);
        if (!admin(i)) return respond(i, '❌ Administrator only.');
        return respond(i, await endGiveaway(i.guild) ? '✅ Giveaway ended.' : '❌ No active giveaway.');
      }
      if (n === 'invite-top') {
        const e = leaderboardEmbed();
        return i.reply({ embeds: [e], files: imageFor(e, 'LEADERBOARD', IMAGES.leaderboard) });
      }
      if (n === 'invites') {
        const u = i.options.getUser('user') || i.user;
        const count = db.members[u.id]?.joins?.length || 0;
        return respond(i, { embeds: [embed('📨 RYVORA • INVITES',
          `**Member:** ${u}\n**Verified invites:** ${count}`)] });
      }
      if (n === 'ryvora-status') return respond(i, {
        embeds: [embed('💜 RYVORA • SYSTEM STATUS',
          `🟢 Connected\n🎫 Tickets: ${Object.keys(state.tickets).length}\n` +
          `🛒 Products: ${PRODUCTS.length}\n🏆 Giveaway: ${active() ? 'Active' : 'Inactive'}\n` +
          `📨 Unknown joins: ${db.unknownJoins}\n⏱️ Uptime: ${Math.floor(process.uptime() / 60)} minutes`)]
      });
      if (n === 'ryvora-health') {
        await defer(i);
        if (!admin(i)) return respond(i, '❌ Administrator only.');
        return respond(i, { embeds: [await health(i.guild)] });
      }
      if (n === 'ticket-add') {
        await defer(i);
        if (!staff(i) || !activeTicket(i.channel)) return respond(i, '❌ Staff ticket only.');
        const u = i.options.getUser('user', true);
        await i.channel.permissionOverwrites.edit(u.id, { ViewChannel: true, SendMessages: true,
          ReadMessageHistory: true, AttachFiles: true });
        return respond(i, `✅ Added <@${u.id}> to this ticket.`);
      }
      if (productByKey.has(n)) return postProduct(i, productByKey.get(n));
    }
    if (i.isButton()) {
      if (i.customId === 'ryvora_verify') return verifyMember(i);
      if (i.customId === 'ryvora_claim_ticket') return claimTicket(i);
      if (i.customId === 'ryvora_close_ticket') return closeTicket(i);
      if (i.customId.startsWith('ryvora_buy:')) {
        const key = i.customId.slice('ryvora_buy:'.length);
        if (!productByKey.has(key)) return respond(i, '❌ Product does not exist.');
        return createTicket(i, 'purchase', key);
      }
    }
    if (i.isStringSelectMenu()) {
      if (i.customId === 'ryvora_ticket_category') return createTicket(i, i.values[0]);
      if (i.customId === 'ryvora_catalog') {
        const p = productByKey.get(i.values[0]);
        if (!p) return respond(i, '❌ Product not found.');
        return i.reply({ ...productCard(p), flags: MessageFlags.Ephemeral });
      }
    }
  } catch (e) {
    logError(`Interaction ${i.id}:`, e);
    if ([10062, 40060].includes(e.code)) return;
    if (!i.isRepliable()) return;
    try { await respond(i, '❌ A problem occurred. Please contact staff.'); }
    catch (err) { logError('Could not reply:', err.message); }
  } finally { inProgress.delete(i.id); }
});

let interval = null;
client.once(Events.ClientReady, async () => {
  log(`Logged in as ${client.user.tag}`);
  const guild = client.guilds.cache.get(C.guildId) || await client.guilds.fetch(C.guildId).catch(() => null);
  if (!guild) return logError('Configured server not found.');
  try { await registerCommands(); } catch (e) { logError('Command registration failed:', e); }
  await initInvites(guild);
  const tick = async () => {
    try {
      if (!db.competition?.active) return;
      if (!active()) await endGiveaway(guild, true);
      else await refreshGiveaway(guild);
    } catch (e) { logError('Giveaway tick:', e); }
  };
  await tick();
  interval = setInterval(tick, 60000);
  log(`Ready: ${PRODUCTS.length} products; tickets, verification, invites, giveaways.`);
});
client.on(Events.Error, e => logError('Client:', e));
process.on('unhandledRejection', e => logError('Unhandled rejection:', e));
process.on('uncaughtException', e => { logError('Fatal error:', e); process.exit(1); });
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => {
  if (interval) clearInterval(interval);
  client.destroy();
  process.exit(0);
});
client.login(C.token).catch(e => { logError('Login failed:', e); process.exit(1); });
