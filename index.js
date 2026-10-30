from pathlib import Path
import re
src=Path('/mnt/data/Pasted text(20261030-194213).txt').read_text()
out=src
out=out.replace("    GatewayIntentBits.GuildMembers\n", "    GatewayIntentBits.GuildMembers,\n    GatewayIntentBits.GuildMessages,\n    GatewayIntentBits.MessageContent,\n    GatewayIntentBits.GuildModeration,\n    GatewayIntentBits.GuildInvites\n",1)
out=out.replace("  verifyLogChannel: process.env.VERIFY_LOG_CHANNEL_ID,", """  verifyLogChannel: process.env.VERIFY_LOG_CHANNEL_ID,
  transcriptLogChannel: process.env.TRANSCRIPT_LOG_CHANNEL_ID || process.env.TICKET_LOG_CHANNEL_ID,
  memberLogChannel: process.env.MEMBER_LOG_CHANNEL_ID,
  messageLogChannel: process.env.MESSAGE_LOG_CHANNEL_ID,
  moderationLogChannel: process.env.MODERATION_LOG_CHANNEL_ID,
  serverLogChannel: process.env.SERVER_LOG_CHANNEL_ID,
  roleLogChannel: process.env.ROLE_LOG_CHANNEL_ID,
  voiceLogChannel: process.env.VOICE_LOG_CHANNEL_ID,
  commandLogChannel: process.env.COMMAND_LOG_CHANNEL_ID,
  giveawayLogChannel: process.env.GIVEAWAY_LOG_CHANNEL_ID,
  botLogChannel: process.env.BOT_LOG_CHANNEL_ID,
  securityLogChannel: process.env.SECURITY_LOG_CHANNEL_ID,""",1)
out=out.replace("    GatewayIntentBits.GuildInvites\n", "    GatewayIntentBits.GuildInvites,\n    GatewayIntentBits.GuildVoiceStates\n",1)
out=out.replace("  if (ticket.claimedBy) {", "  if (ticket.claimedBy) {",1)
out=out.replace("  return respond(i, '✅ Ticket claimed successfully.');", """  await audit(i.guild, 'ticket', 'TICKET CLAIMED', [
    ['Ticket', i.channel.name], ['Staff', `<@${i.user.id}>`],
    ['Owner', `<@${ticket.ownerId}>`]
  ]);
  return respond(i, '✅ Ticket claimed successfully.');""",1)
out=out.replace("    await respond(i, `✅ Your ticket is ready: ${created}`);", "    await respond(i, `✅ Your ticket is ready: ${created}`);",1)
out=out.replace("    await logTo(guild, CONFIG.ticketLogChannel, {", """    await audit(guild, 'ticket', 'TICKET CREATED', [
      ['Owner', `<@${i.user.id}>`], ['Category', category.name],
      ['Product', product?.title || 'None'], ['Channel', `${created}`]
    ]);
    await logTo(guild, CONFIG.ticketLogChannel, {""",1)
start=out.index("    await logTo(i.guild, CONFIG.ticketLogChannel, {",out.index("async function closeTicket"))
end=out.index("    await i.channel.delete(",start)
out=out[:start]+"""    const summary = embed(
      '🔒 TICKET CLOSED',
      `**Channel:** ${i.channel.name}\\n` +
      `**Owner:** <@${ownerId}>\\n` +
      `**Closed by:** <@${i.user.id}>\\n` +
      `**Category:** ${ticket?.category || 'Unknown'}\\n` +
      `**Claimed by:** ${ticket?.claimedBy ? `<@${ticket.claimedBy}>` : 'None'}`
    );
    const summarySaved = await logTo(i.guild, CONFIG.ticketLogChannel, {
      embeds: [summary]
    });
    const transcriptSaved = transcript && await logTo(
      i.guild, CONFIG.transcriptLogChannel,
      { embeds: [summary], files: [transcript] }
    );
    if (!summarySaved || !transcriptSaved) {
      return respond(i, '⚠️ Ticket was NOT deleted because its logs/transcript could not be saved. Check log channel permissions and try again.');
    }
    await audit(i.guild, 'ticket', 'TICKET ARCHIVED', [
      ['Owner', `<@${ownerId}>`], ['Closed by', `<@${i.user.id}>`],
      ['Transcript', 'Saved successfully']
    ]);
""" +out[end:]
out=out.replace("    await i.channel.delete(`Closed by ${i.user.id}`);", "    await i.channel.delete(`Closed by ${i.user.id}`);",1)
out=out.replace("  await logTo(guild, CONFIG.verifyLogChannel, {", """  await audit(guild, 'verify', 'MEMBER VERIFIED', [
    ['Member', `<@${member.id}>`], ['Role', `<@&${role.id}>`]
  ]);
  await logTo(guild, CONFIG.verifyLogChannel, {""",1)
out=out.replace("        return respond(i, `✅ Added <@${user.id}> to this ticket.`);", """        await audit(i.guild, 'ticket', 'TICKET MEMBER ADDED', [
          ['Member', `<@${user.id}>`], ['By', `<@${i.user.id}>`],
          ['Ticket', i.channel.name]
        ]);
        return respond(i, `✅ Added <@${user.id}> to this ticket.`);""",1)
out=out.replace("  try {\n    if (i.isChatInputCommand()) {", """  try {
    if (i.isChatInputCommand()) {
      void audit(i.guild, 'command', 'SLASH COMMAND USED', [
        ['Command', `/${i.commandName}`],
        ['User', `<@${i.user.id}>`],
        ['Channel', `<#${i.channelId}>`]
      ]);""",1)
out=out.replace("  await initializeInvites(guild);", """  await audit(guild, 'bot', 'BOT ONLINE', [
    ['Account', client.user.tag],
    ['Uptime', 'Just started'],
    ['Storage', DATA_DIR]
  ]);
  await initializeInvites(guild);""",1)
out=out.replace("  await logTo(guild, db.competition.channelId, {", """  await audit(guild, 'giveaway', 'GIVEAWAY ENDED', [
    ['Prize', db.competition.prize], ['Participants', ranking().length]
  ]);
  await logTo(guild, db.competition.channelId, {""",1)
out=out.replace("  return respond(i, `✅ Competition started in ${channel}.`);", """  await audit(i.guild, 'giveaway', 'GIVEAWAY STARTED', [
    ['Prize', prize], ['Duration (days)', days], ['By', `<@${i.user.id}>`]
  ]);
  return respond(i, `✅ Competition started in ${channel}.`);""",1)
addon=r"""
// ======================================================
// EXTENDED AUDIT LOGS (all channels optional)
// ======================================================
const LOG_TYPES = {
  ticket: 'ticketLogChannel',
  verify: 'verifyLogChannel',
  member: 'memberLogChannel',
  message: 'messageLogChannel',
  moderation: 'moderationLogChannel',
  server: 'serverLogChannel',
  role: 'roleLogChannel',
  voice: 'voiceLogChannel',
  command: 'commandLogChannel',
  giveaway: 'giveawayLogChannel',
  bot: 'botLogChannel',
  security: 'securityLogChannel'
};

function short(value, length = 1000) {
  return String(value ?? 'Unknown').slice(0, length) || 'None';
}
async function audit(guild, kind, title, fields = []) {
  if (!guild || guild.id !== CONFIG.guildId) return false;
  const channelId = CONFIG[LOG_TYPES[kind]];
  if (!channelId) return false;
  const e = embed(`RYVORA | ${title}`, 'Event recorded by Ryvora audit system.');
  e.addFields(fields.map(([name, value]) => ({
    name: short(name, 256),
    value: short(value, 1024),
    inline: false
  })));
  return logTo(guild, channelId, { embeds: [e] });
}
function safeEvent(promise) {
  Promise.resolve(promise).catch(e => logError('Audit event:', e.message));
}
function auditGuild(guild) {
  return guild?.id === CONFIG.guildId;
}
client.on(Events.MessageDelete, m => {
  if (!auditGuild(m.guild) || m.author?.bot) return;
  safeEvent(audit(m.guild, 'message', 'MESSAGE DELETED', [
    ['Author', m.author ? `<@${m.author.id}>` : 'Not cached'],
    ['Channel', `<#${m.channelId}>`],
    ['Content', short(m.content || 'Unavailable (not cached)', 1000)],
    ['Message ID', m.id]
  ]));
});
client.on(Events.MessageUpdate, (oldM, newM) => {
  if (!auditGuild(newM.guild) || newM.author?.bot ||
      oldM.content === newM.content) return;
  safeEvent(audit(newM.guild, 'message', 'MESSAGE EDITED', [
    ['Author', newM.author ? `<@${newM.author.id}>` : 'Unknown'],
    ['Before', short(oldM.content || 'Unavailable')],
    ['After', short(newM.content || 'Unavailable')],
    ['Channel', `<#${newM.channelId}>`]
  ]));
});
client.on(Events.GuildMemberAdd, m => {
  safeEvent(audit(m.guild, 'member', 'MEMBER JOINED', [
    ['Member', `<@${m.id}>`],
    ['Account created', m.user.createdAt.toISOString()],
    ['Member count', m.guild.memberCount]
  ]));
});
client.on(Events.GuildMemberRemove, m => {
  safeEvent(audit(m.guild, 'member', 'MEMBER LEFT', [
    ['Member', `<@${m.id}>`], ['Member count', m.guild.memberCount]
  ]));
});
client.on(Events.GuildMemberUpdate, (a,b) => {
  if (!auditGuild(b.guild)) return;
  const added = b.roles.cache.filter(r => !a.roles.cache.has(r.id));
  const removed = a.roles.cache.filter(r => !b.roles.cache.has(r.id));
  if (added.size || removed.size) safeEvent(audit(b.guild, 'role', 'MEMBER ROLES UPDATED', [
    ['Member', `<@${b.id}>`],
    ['Added', added.map(r=>r.name).join(', ') || 'None'],
    ['Removed', removed.map(r=>r.name).join(', ') || 'None']
  ]));
  if (a.nickname !== b.nickname) safeEvent(audit(b.guild, 'member', 'NICKNAME CHANGED', [
    ['Member', `<@${b.id}>`],
    ['Before', a.nickname || 'None'], ['After', b.nickname || 'None']
  ]));
  if (a.communicationDisabledUntilTimestamp !== b.communicationDisabledUntilTimestamp)
    safeEvent(audit(b.guild, 'moderation', 'TIMEOUT CHANGED', [
      ['Member', `<@${b.id}>`],
      ['Until', b.communicationDisabledUntil?.toISOString() || 'Removed']
    ]));
});
client.on(Events.GuildBanAdd, b => safeEvent(audit(b.guild, 'moderation', 'BAN ADDED', [
  ['User', `${b.user.tag} (${b.user.id})`], ['Reason', b.reason || 'Not provided']
])));
client.on(Events.GuildBanRemove, b => safeEvent(audit(b.guild, 'moderation', 'BAN REMOVED', [
  ['User', `${b.user.tag} (${b.user.id})`]
])));
client.on(Events.ChannelCreate, c => safeEvent(audit(c.guild, 'server', 'CHANNEL CREATED', [
  ['Name', c.name], ['ID', c.id]
])));
client.on(Events.ChannelDelete, c => safeEvent(audit(c.guild, 'server', 'CHANNEL DELETED', [
  ['Name', c.name], ['ID', c.id]
])));
client.on(Events.ChannelUpdate, (a,b) => {
  if (a.name === b.name && a.parentId === b.parentId && a.topic === b.topic) return;
  safeEvent(audit(b.guild, 'server', 'CHANNEL UPDATED', [
    ['Before', a.name], ['After', b.name], ['ID', b.id]
  ]));
});
client.on(Events.GuildRoleCreate, r => safeEvent(audit(r.guild, 'role', 'ROLE CREATED', [
  ['Role', r.name], ['ID', r.id]
])));
client.on(Events.GuildRoleDelete, r => safeEvent(audit(r.guild, 'role', 'ROLE DELETED', [
  ['Role', r.name], ['ID', r.id]
])));
client.on(Events.GuildRoleUpdate, (a,b) => {
  if (a.name === b.name && a.permissions.bitfield === b.permissions.bitfield &&
      a.color === b.color) return;
  safeEvent(audit(b.guild, 'role', 'ROLE UPDATED', [
    ['Role', b.name], ['ID', b.id]
  ]));
});
client.on(Events.VoiceStateUpdate, (a,b) => {
  if (a.channelId === b.channelId && a.serverMute === b.serverMute &&
      a.serverDeaf === b.serverDeaf) return;
  safeEvent(audit(b.guild, 'voice', 'VOICE STATE UPDATED', [
    ['Member', `<@${b.id}>`],
    ['From', a.channelId ? `<#${a.channelId}>` : 'None'],
    ['To', b.channelId ? `<#${b.channelId}>` : 'None'],
    ['Server muted', b.serverMute ? 'Yes' : 'No'],
    ['Server deafened', b.serverDeaf ? 'Yes' : 'No']
  ]));
});
client.on(Events.GuildAuditLogEntryCreate, (entry, guild) => {
  safeEvent(audit(guild, 'security', 'DISCORD AUDIT EVENT', [
    ['Action', entry.action],
    ['Executor', entry.executorId || 'Unknown'],
    ['Target', entry.targetId || 'Unknown'],
    ['Reason', entry.reason || 'None']
  ]));
});
client.on(Events.InviteCreate, invite => safeEvent(audit(invite.guild, 'security', 'INVITE CREATED', [
  ['Code', invite.code], ['Creator', invite.inviterId || 'Unknown']
])));
client.on(Events.InviteDelete, invite => safeEvent(audit(invite.guild, 'security', 'INVITE DELETED', [
  ['Code', invite.code]
])));
"""
out=out.replace("// ======================================================\n// STARTUP\n// ======================================================",addon+"\n// ======================================================\n// STARTUP\n// ======================================================",1)
# Prevent failed transcript deletion if log channel not configured
out=out.replace("  const channelId = CONFIG[LOG_TYPES[kind]];", "  const channelId = CONFIG[LOG_TYPES[kind]];")
p=Path('/mnt/data/ryvora_index_upgraded.js')
p.write_text(out)
print('Created',p,'lines:',len(out.splitlines()))
