
'use strict';

require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits: P,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  MessageFlags
} = require('discord.js');

// ============================================================
// RYVORA - ULTIMATE METHODS
// Discord.js v14
// ============================================================

const CONFIG = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  ticketCategory: process.env.TICKET_CATEGORY_ID,
  staffRole: process.env.STAFF_ROLE_ID,
  verifyRole: process.env.VERIFY_ROLE_ID,

  welcomeChannel: process.env.WELCOME_CHANNEL_ID,
  giveawayChannel: process.env.GIVEAWAY_CHANNEL_ID,
  inviteLogChannel: process.env.INVITE_LOG_CHANNEL_ID,
  ticketLogChannel: process.env.TICKET_LOG_CHANNEL_ID,
  verifyLogChannel: process.env.VERIFY_LOG_CHANNEL_ID,

  purple: 0x8B2CFF,
  green: 0x57F287,
  red: 0xED4245
};

for (const key of [
  'token',
  'clientId',
  'guildId',
  'ticketCategory',
  'staffRole',
  'verifyRole'
]) {
  if (!CONFIG[key]) {
    throw new Error(`Missing configuration: ${key}`);
  }
}

const ROOT = __dirname;
const IMAGE_DIR = path.join(ROOT, 'images');
const DB_FILE = path.join(ROOT, 'ryvora-invites.json');
const STATE_FILE = path.join(ROOT, 'ryvora-state.json');

const DAY = 86400000;

const log = (...args) => console.log('[RYVORA]', ...args);
const logError = (...args) => console.error('[RYVORA]', ...args);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ============================================================
// IMAGES
// ============================================================

const IMAGES = {
  ticket: 'ticket.png',
  verify: 'verify.png',
  welcome: 'welcome.png',
  giveaway: 'giveaway.png',
  leaderboard: 'leaderboard.png',
  inviteLog: 'invite-log.png',

  ticketPurchase: 'ticket-purchase.png',
  ticketPreSale: 'ticket-pre-sale.png',
  ticketSupport: 'ticket-support.png',
  ticketHwid: 'ticket-hwid.png',
  ticketMedia: 'ticket-media.png',

  products: {
    perm_croofer: 'perm-croofer.png',
    val_showcase: 'val-showcase.png',
    val_color_aim: 'val-color-aim.png',
    val_triggerbot: 'val-triggerbot.png',
    val_unlock_all: 'val-unlock-all.png',
    val_emu: 'val-emu.png',
    fn_retract: 'fn-retract.png',
    retract_showcase: 'retract-showcase.png',
    rust_external: 'rust-external.png',
    fivem_triggerbot: 'fivem-triggerbot.png',
    nvidia_bypass: 'nvidia-bypass.png',
    custom_cleaners: 'custom-cleaners.png',
    tweaks: 'tweaks.png',
    fortnite_accounts: 'fortnite-accounts.png',
    fortnite_vbucks: 'fortnite-vbucks.png'
  }
};

function allImageEntries() {
  return [
    ...Object.entries(IMAGES)
      .filter(([key]) => key !== 'products')
      .map(([key, filename]) => ({
        key: key.replace(/([A-Z])/g, '_$1').toUpperCase(),
        filename
      })),
    ...Object.entries(IMAGES.products).map(([key, filename]) => ({
      key: `PRODUCT_${key.toUpperCase()}`,
      filename
    }))
  ];
}

function imageFor(embed, key, filename) {
  // Local files have priority over expired Discord CDN URLs.
  if (filename && filename === path.basename(filename)) {
    const full = path.join(IMAGE_DIR, filename);

    try {
      if (fs.existsSync(full) && fs.statSync(full).isFile()) {
        const size = fs.statSync(full).size;

        if (size > 0 && size <= 8 * 1024 * 1024) {
          embed.setImage(`attachment://${filename}`);
          log(`IMAGE OK: ${filename}`);

          return [
            new AttachmentBuilder(full, { name: filename })
          ];
        }

        logError(`IMAGE INVALID SIZE: ${filename}`);
      }
    } catch (error) {
      logError(`IMAGE ERROR ${filename}:`, error.message);
    }
  }

  const url = (
    process.env[`IMAGE_${key.toUpperCase()}`] || ''
  ).trim();

  if (/^https:\/\//i.test(url)) {
    embed.setImage(url);
    log(`IMAGE URL FALLBACK: ${key}`);
    return [];
  }

  log(`IMAGE MISSING: ${filename || key}`);
  return [];
}

function imageHealth() {
  const entries = allImageEntries();

  return entries.map(({ key, filename }) => {
    const full = path.join(IMAGE_DIR, filename);

    let exists = false;
    try {
      exists = fs.existsSync(full) &&
        fs.statSync(full).isFile() &&
        fs.statSync(full).size > 0;
    } catch {}

    const fallback = Boolean(
      process.env[`IMAGE_${key}`]?.trim()
    );

    return {
      filename,
      exists,
      fallback
    };
  });
}

// ============================================================
// PRODUCTS
// ============================================================

const PRODUCTS = [
  {
    command: 'perm_croofer',
    title: 'Perm Serial Changer',
    description: 'Permanent serial changer product information.',
    pricing: '• One Time Use → 24€\n• Unlimited Uses → **49€**'
  },
  {
    command: 'val_showcase',
    title: 'VAL Showcase',
    description: 'Features and product information for VAL Showcase.',
    pricing: process.env.VAL_SHOWCASE_PRICING ||
      'Contact our team for pricing.'
  },
  {
    command: 'val_color_aim',
    title: 'Val Colorbot',
    description: 'Features and product information for Val Colorbot.',
    pricing: '• 1 Day → 10€\n• 1 Week → 24€\n• 1 Month → 40€\n• Lifetime → **168€**'
  },
  {
    command: 'val_triggerbot',
    title: 'Val Triggerbot',
    description: 'Features and product information for Val Triggerbot.',
    pricing: '• 1 Day → 9€\n• 1 Week → 17€\n• 1 Month → 32€\n• Lifetime → **160€**'
  },
  {
    command: 'val_unlock_all',
    title: 'Val Unlock All',
    description: 'Features and product information for Val Unlock All.',
    pricing: '• 1 Day → 13€\n• 1 Week → 23€\n• 1 Month → 42€\n• Lifetime → **163€**'
  },
  {
    command: 'val_emu',
    title: 'Val Emulator',
    description: 'Features and product information for Val Emulator.',
    pricing: '• 3 Days → 43€\n• 1 Week → 64€\n• 1 Month → 105€\n• Lifetime → **250€**'
  },
  {
    command: 'fn_retract',
    title: 'FN Retract',
    description: 'Features and product information for FN Retract.',
    pricing: '• 1 Day → 9€\n• 1 Week → 19€\n• 1 Month → 37€\n• Lifetime → **164€**'
  },
  {
    command: 'retract_showcase',
    title: 'Retract Showcase',
    description: 'Features and product information for Retract Showcase.',
    pricing: process.env.RETRACT_SHOWCASE_PRICING ||
      'Contact our team for pricing.'
  },
  {
    command: 'rust_external',
    title: 'Rust External',
    description: 'Features and product information for Rust External.',
    pricing: '• 1 Day → 10€\n• 1 Week → 32€\n• 1 Month → 60€\n• Lifetime → **350€**'
  },
  {
    command: 'fivem_triggerbot',
    title: 'FiveM Triggerbot',
    description: 'Features and product information for FiveM Triggerbot.',
    pricing: '• 1 Week → 10€\n• 1 Month → 27€\n• Lifetime → **100€**'
  },
  {
    command: 'nvidia_bypass',
    title: 'NVIDIA Bypass',
    description:
      'NVIDIA Bypass product information.\n\n' +
      'Intended for compatible NVIDIA recording configurations. ' +
      'Contact staff to confirm compatibility.',
    pricing: '• NVIDIA Bypass → **$10**\n• NVIDIA Bypass + Mouse → **$15**'
  },
  {
    command: 'custom_cleaners',
    title: 'Custom Cleaners',
    description:
      '🧹 **Custom Cleaner Service**\n\n' +
      'Available products:\n' +
      '• TZX\n• GOSTH\n• TESTO\n• SKRIPTGG\n\n' +
      'Contact staff for compatibility and service details.',
    pricing: '• Price per cleaner → **$35**'
  },
  {
    command: 'tweaks',
    title: 'PC Optimization',
    description:
      '🚀 **Complete PC Optimization**\n\n' +
      '• BIOS Tuner\n' +
      '• Network Adapter Tuner\n' +
      '• Hardware Optimization\n' +
      '• Priority Customer Support\n' +
      '• 20+ Advanced Features\n\n' +
      'Results depend on hardware and configuration.',
    pricing:
      '• PC Optimization → **$30**\n' +
      '• Re-Optimization → **$15**'
  },
  {
    command: 'fortnite_accounts',
    title: 'Fortnite Accounts',
    description:
      '**Random Skin Accounts**\n' +
      '• 50+ Skins → $7.99\n' +
      '• 100+ Skins → $11.99\n' +
      '• 150+ Skins → $24\n' +
      '• 200+ Skins → $27\n\n' +
      '**Exclusives**\n' +
      '• IKONIK → $130\n' +
      '• Wildcat → $130\n' +
      '• Glow → $15\n' +
      '• Galaxy → $78\n' +
      '• Black Knight → $115\n' +
      '• Travis Scott → $60\n\n' +
      '**Other Accounts**\n' +
      '• 82 Skins → $55\n' +
      '• 125 Skins → $85\n' +
      '• 108 Skins → $65\n\n' +
      'Contact staff for availability and account terms.',
    pricing: 'Prices listed above.'
  },
  {
    command: 'fortnite_vbucks',
    title: 'Fortnite V-Bucks',
    description: 'Fortnite V-Bucks packages for PC Epic accounts.',
    pricing:
      '• 4,500 V-Bucks → **$40**\n' +
      '• 12,500 V-Bucks → **$80**'
  }
];

const productByKey = new Map(
  PRODUCTS.map(product => [product.command, product])
);

const CATEGORIES = {
  purchase: {
    name: 'Purchase',
    emoji: '🛒',
    image: IMAGES.ticketPurchase,
    imageKey: 'TICKET_PURCHASE'
  },
  pre_sale: {
    name: 'Pre-Sale',
    emoji: '❓',
    image: IMAGES.ticketPreSale,
    imageKey: 'TICKET_PRE_SALE'
  },
  support: {
    name: 'Support',
    emoji: '🛠️',
    image: IMAGES.ticketSupport,
    imageKey: 'TICKET_SUPPORT'
  },
  hwid_reset: {
    name: 'HWID Reset',
    emoji: '🔑',
    image: IMAGES.ticketHwid,
    imageKey: 'TICKET_HWID'
  },
  media_reseller: {
    name: 'Media / Reseller',
    emoji: '📦',
    image: IMAGES.ticketMedia,
    imageKey: 'TICKET_MEDIA'
  }
};

// ============================================================
// STORAGE
// ============================================================

function readJson(filename, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logError(`Storage read error ${filename}:`, error.message);
    }
    return fallback;
  }
}

function writeJson(filename, value) {
  const temp = `${filename}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2));
  fs.renameSync(temp, filename);
}

const db = {
  competition: null,
  members: {},
  pending: {},
  known: {},
  unknownJoins: 0,
  ...readJson(DB_FILE, {})
};

const state = {
  tickets: {},
  ...readJson(STATE_FILE, {})
};

db.members ||= {};
db.pending ||= {};
db.known ||= {};
state.tickets ||= {};

const saveDb = () => writeJson(DB_FILE, db);
const saveState = () => writeJson(STATE_FILE, state);

// ============================================================
// HELPERS
// ============================================================

function makeEmbed(title, description, color = CONFIG.purple) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: 'Ryvora - Ultimate Methods' })
    .setTimestamp();
}

function isAdmin(i) {
  return Boolean(i.memberPermissions?.has(P.Administrator));
}

function isManager(i) {
  return Boolean(i.memberPermissions?.has(P.ManageGuild));
}

function isStaff(i) {
  return isAdmin(i) ||
    Boolean(i.member?.roles?.cache?.has(CONFIG.staffRole)) ||
    Boolean(i.memberPermissions?.has(P.ManageChannels));
}

async function defer(i) {
  if (i.deferred || i.replied) return true;

  try {
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    return true;
  } catch (error) {
    if (error.code === 40060 || error.code === 10062) {
      logError(
        `Interaction acknowledgement conflict: ${i.id}. ` +
        'Check for another running bot instance.'
      );
      return false;
    }

    throw error;
  }
}

async function respond(i, payload) {
  const data = typeof payload === 'string'
    ? { content: payload }
    : payload;

  if (i.deferred) {
    return i.editReply(data);
  }

  if (i.replied) {
    return i.followUp({
      ...data,
      flags: MessageFlags.Ephemeral
    });
  }

  return i.reply({
    ...data,
    flags: MessageFlags.Ephemeral
  });
}

async function getTextChannel(guild, id) {
  if (!id) return null;

  const channel = await guild.channels.fetch(id).catch(() => null);

  return channel?.isTextBased() &&
    typeof channel.send === 'function'
    ? channel
    : null;
}

async function logTo(guild, channelId, payload) {
  const channel = await getTextChannel(guild, channelId);

  if (!channel) return false;

  try {
    await channel.send({
      ...payload,
      allowedMentions: { parse: [] }
    });
    return true;
  } catch (error) {
    logError('Log channel error:', error.message);
    return false;
  }
}

// ============================================================
// PANELS
// ============================================================

function ticketPanel() {
  const e = makeEmbed(
    '🎫 RYVORA • SUPPORT CENTER',
    '## PREMIUM SUPPORT\n\n' +
    '🛒 **Purchase** — Place an order\n' +
    '❓ **Pre-Sale** — Product questions\n' +
    '🛠️ **Support** — Technical assistance\n' +
    '🔑 **HWID Reset** — Reset requests\n' +
    '📦 **Media / Reseller** — Partnerships\n\n' +
    '━━━━━━━━━━━━━━━━━━━━\n' +
    '💜 Select a category below to open a private ticket.'
  );

  const menu = new StringSelectMenuBuilder()
    .setCustomId('ryvora_ticket_category')
    .setPlaceholder('✦ Choose a support category')
    .addOptions(
      Object.entries(CATEGORIES).map(([value, category]) => ({
        label: category.name,
        value,
        emoji: category.emoji
      }))
    );

  return {
    embeds: [e],
    files: imageFor(e, 'TICKET', IMAGES.ticket),
    components: [
      new ActionRowBuilder().addComponents(menu)
    ]
  };
}

function verifyPanel() {
  const e = makeEmbed(
    '🔐 RYVORA • OFFICIAL VERIFICATION',
    '## Welcome to Ryvora!\n\n' +
    'Before accessing the community, complete verification.\n\n' +
    '✦ **Step 1** — Read the server rules.\n' +
    '✦ **Step 2** — Click Verify & Unlock.\n' +
    '✦ **Step 3** — Receive your member role.\n\n' +
    '💜 Click below to unlock the server.'
  );

  const button = new ButtonBuilder()
    .setCustomId('ryvora_verify')
    .setLabel('Verify & Unlock')
    .setEmoji('✅')
    .setStyle(ButtonStyle.Success);

  return {
    embeds: [e],
    files: imageFor(e, 'VERIFY', IMAGES.verify),
    components: [
      new ActionRowBuilder().addComponents(button)
    ]
  };
}

function productCard(product) {
  const e = makeEmbed(
    `✦ ${product.title}`,
    `${product.description}\n\n` +
    '━━━━━━━━━━━━━━━━━━━━\n' +
    `💳 **PRICING**\n${product.pricing}\n\n` +
    '🛒 Click below to contact our team.'
  );

  if (client.user) {
    e.setAuthor({
      name: 'RYVORA • PREMIUM PRODUCT CATALOG',
      iconURL: client.user.displayAvatarURL()
    });
  }

  const button = new ButtonBuilder()
    .setCustomId(`ryvora_buy:${product.command}`)
    .setLabel('Purchase / Open Ticket')
    .setEmoji('🛒')
    .setStyle(ButtonStyle.Primary);

  return {
    embeds: [e],
    files: imageFor(
      e,
      `PRODUCT_${product.command.toUpperCase()}`,
      IMAGES.products[product.command]
    ),
    components: [
      new ActionRowBuilder().addComponents(button)
    ]
  };
}

function catalogPanel() {
  const e = makeEmbed(
    '🛒 RYVORA • PRODUCT CATALOG',
    'Browse our premium product catalog.\n\n' +
    'Choose a product below to view its information and pricing.'
  );

  const menu = new StringSelectMenuBuilder()
    .setCustomId('ryvora_catalog')
    .setPlaceholder('✦ Select a product')
    .addOptions(
      PRODUCTS.map(product => ({
        label: product.title,
        value: product.command,
        description: 'View product details'
      }))
    );

  return {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(menu)
    ]
  };
}

// ============================================================
// TICKETS
// ============================================================

const ticketLocks = new Set();

function ownerFrom(channel) {
  return channel?.topic
    ?.match(/(?:^|\|)ticket-owner:(\d+)/)?.[1] || null;
}

function isTicket(channel) {
  return channel?.type === ChannelType.GuildText &&
    channel.parentId === CONFIG.ticketCategory &&
    Boolean(ownerFrom(channel));
}

function ticketButtons(claimed = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ryvora_claim_ticket')
        .setLabel(claimed ? 'Claimed' : 'Claim Ticket')
        .setEmoji('🙋')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(claimed),

      new ButtonBuilder()
        .setCustomId('ryvora_close_ticket')
        .setLabel('Close Ticket')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

async function createTicket(i, categoryKey, productKey = null) {
  if (!await defer(i)) return;

  const category = CATEGORIES[categoryKey];

  if (!category) {
    return respond(i, '❌ Invalid ticket category.');
  }

  const lock = `${i.guildId}:${i.user.id}`;

  if (ticketLocks.has(lock)) {
    return respond(i, '⏳ Your ticket is already being created.');
  }

  ticketLocks.add(lock);

  let created = null;

  try {
    const guild = i.guild;

    const parent = await guild.channels
      .fetch(CONFIG.ticketCategory)
      .catch(() => null);

    if (parent?.type !== ChannelType.GuildCategory) {
      return respond(i, '❌ Ticket category is not configured correctly.');
    }

    const bot = await guild.members.fetchMe();

    if (!bot.permissions.has(P.ManageChannels)) {
      return respond(i, '❌ Bot needs Manage Channels permission.');
    }

    const staffRole = await guild.roles
      .fetch(CONFIG.staffRole)
      .catch(() => null);

    if (!staffRole) {
      return respond(i, '❌ Staff role not found.');
    }

    await guild.channels.fetch();

    const existing = guild.channels.cache.find(
      channel =>
        isTicket(channel) &&
        ownerFrom(channel) === i.user.id
    );

    if (existing) {
      return respond(
        i,
        `⚠️ You already have an open ticket: ${existing}`
      );
    }

    const product = productByKey.get(productKey);

    created = await guild.channels.create({
      name: `ticket-${categoryKey}-${i.user.id}`.slice(0, 95),
      type: ChannelType.GuildText,
      parent: CONFIG.ticketCategory,
      topic: `ticket-owner:${i.user.id}|category:${categoryKey}`,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [P.ViewChannel]
        },
        {
          id: i.user.id,
          allow: [
            P.ViewChannel,
            P.SendMessages,
            P.ReadMessageHistory,
            P.AttachFiles
          ]
        },
        {
          id: CONFIG.staffRole,
          allow: [
            P.ViewChannel,
            P.SendMessages,
            P.ReadMessageHistory,
            P.AttachFiles
          ]
        },
        {
          id: bot.id,
          allow: [
            P.ViewChannel,
            P.SendMessages,
            P.ReadMessageHistory,
            P.ManageChannels,
            P.AttachFiles
          ]
        }
      ]
    });

    const e = makeEmbed(
      `${category.emoji} RYVORA • ${category.name}`,
      `Welcome <@${i.user.id}>!\n\n` +
      `**Category:** ${category.name}\n` +
      (product ? `**Product:** ${product.title}\n` : '') +
      '\nPlease describe your request clearly.\n\n' +
      '💜 Our support team will assist you.'
    );

    await created.send({
      content: `<@${i.user.id}> <@&${CONFIG.staffRole}>`,
      embeds: [e],
      files: imageFor(e, category.imageKey, category.image),
      components: ticketButtons(),
      allowedMentions: {
        users: [i.user.id],
        roles: [CONFIG.staffRole]
      }
    });

    state.tickets[created.id] = {
      ownerId: i.user.id,
      category: categoryKey,
      product: productKey,
      claimedBy: null,
      createdAt: Date.now()
    };

    saveState();

    await respond(i, `✅ Your ticket is ready: ${created}`);

    await logTo(guild, CONFIG.ticketLogChannel, {
      embeds: [
        makeEmbed(
          '🎫 TICKET CREATED',
          `**Owner:** <@${i.user.id}>\n` +
          `**Category:** ${category.name}\n` +
          `**Channel:** ${created}`
        )
      ]
    });
  } catch (error) {
    if (created) {
      await created.delete('Ticket setup failed').catch(() => {});
      delete state.tickets[created.id];
      saveState();
    }

    throw error;
  } finally {
    ticketLocks.delete(lock);
  }
}

async function claimTicket(i) {
  if (!await defer(i)) return;

  if (!isStaff(i)) {
    return respond(i, '❌ Staff only.');
  }

  if (!isTicket(i.channel)) {
    return respond(i, '❌ This is not a ticket.');
  }

  const ticket = state.tickets[i.channelId] ||= {
    ownerId: ownerFrom(i.channel),
    category: 'support',
    claimedBy: null,
    createdAt: Date.now()
  };

  if (ticket.claimedBy) {
    return respond(
      i,
      `⚠️ Already claimed by <@${ticket.claimedBy}>.`
    );
  }

  ticket.claimedBy = i.user.id;
  saveState();

  await i.message.edit({
    components: ticketButtons(true)
  });

  await i.channel.send({
    embeds: [
      makeEmbed(
        '💜 STAFF ASSIGNED',
        `<@${i.user.id}> has claimed this ticket.`
      )
    ],
    allowedMentions: { parse: [] }
  });

  return respond(i, '✅ Ticket claimed successfully.');
}

async function createTranscript(channel) {
  const messages = [];
  let before;

  for (let page = 0; page < 20; page++) {
    const batch = await channel.messages.fetch({
      limit: 100,
      ...(before ? { before } : {})
    });

    if (!batch.size) break;

    messages.push(...batch.values());
    before = batch.last().id;

    if (batch.size < 100) break;
  }

  messages.sort(
    (a, b) => a.createdTimestamp - b.createdTimestamp
  );

  const lines = [
    'RYVORA TICKET TRANSCRIPT',
    `Channel: ${channel.name}`,
    `Channel ID: ${channel.id}`,
    `Generated: ${new Date().toISOString()}`,
    `Messages: ${messages.length}`,
    '----------------------------------------'
  ];

  for (const message of messages) {
    lines.push(
      `[${new Date(message.createdTimestamp).toISOString()}] ` +
      `${message.author?.tag || 'Unknown'}`
    );

    if (message.content) lines.push(message.content);

    for (const attachment of message.attachments.values()) {
      lines.push(`Attachment: ${attachment.url}`);
    }

    lines.push('');
  }

  const buffer = Buffer.from(lines.join('\n'), 'utf8');

  if (buffer.length > 7 * 1024 * 1024) {
    logError('Transcript too large:', channel.id);
    return null;
  }

  return new AttachmentBuilder(buffer, {
    name: `ryvora-ticket-${channel.id}.txt`
  });
}

async function closeTicket(i) {
  if (!await defer(i)) return;

  if (!isTicket(i.channel)) {
    return respond(i, '❌ This is not a ticket.');
  }

  const ownerId = ownerFrom(i.channel);

  if (i.user.id !== ownerId && !isStaff(i)) {
    return respond(i, '❌ Only the owner or staff can close this ticket.');
  }

  if (ticketLocks.has(i.channelId)) {
    return respond(i, '⏳ Ticket is already closing.');
  }

  ticketLocks.add(i.channelId);

  try {
    await respond(i, '🔒 Closing ticket and saving transcript...');

    let transcript = null;

    try {
      transcript = await createTranscript(i.channel);
    } catch (error) {
      logError('Transcript error:', error.message);
    }

    const ticket = state.tickets[i.channelId];

    await logTo(i.guild, CONFIG.ticketLogChannel, {
      embeds: [
        makeEmbed(
          '🔒 TICKET CLOSED',
          `**Channel:** ${i.channel.name}\n` +
          `**Owner:** <@${ownerId}>\n` +
          `**Closed by:** <@${i.user.id}>\n` +
          `**Category:** ${ticket?.category || 'Unknown'}\n` +
          `**Claimed by:** ${
            ticket?.claimedBy
              ? `<@${ticket.claimedBy}>`
              : 'None'
          }`
        )
      ],
      files: transcript ? [transcript] : []
    });

    await i.channel.delete(`Closed by ${i.user.id}`);

    delete state.tickets[i.channelId];
    saveState();
  } finally {
    ticketLocks.delete(i.channelId);
  }
}

// ============================================================
// INVITES
// ============================================================

const inviteCache = new Map();
let inviteQueue = Promise.resolve();

function queueInvite(operation) {
  const result = inviteQueue.then(operation);

  inviteQueue = result.catch(error => {
    logError('Invite queue:', error.message);
  });

  return result;
}

async function snapshotInvites(guild) {
  const invites = await guild.invites.fetch();

  return new Map(
    invites.map(invite => [
      invite.code,
      {
        uses: invite.uses || 0,
        inviter: invite.inviterId || invite.inviter?.id || null
      }
    ])
  );
}

async function initializeInvites(guild) {
  try {
    inviteCache.set(guild.id, await snapshotInvites(guild));
    log('Invite tracking initialized.');
  } catch (error) {
    logError('Invite tracking unavailable:', error.message);
  }
}

function competitionActive() {
  return Boolean(
    db.competition?.active &&
    Date.now() < db.competition.endsAt
  );
}

function ranking() {
  return Object.entries(db.members)
    .map(([id, data]) => ({
      id,
      count: data.joins?.length || 0
    }))
    .filter(item => item.count > 0)
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.id.localeCompare(b.id)
    );
}

function previouslyCounted(id) {
  return Boolean(db.known[id]) ||
    Object.values(db.members).some(
      item => item.joins?.includes(id)
    );
}

async function trackJoin(member) {
  const previous = inviteCache.get(member.guild.id);
  let current;

  try {
    current = await snapshotInvites(member.guild);
  } catch (error) {
    logError('Invite fetch:', error.message);
    return { status: 'unknown', inviter: null };
  }

  inviteCache.set(member.guild.id, current);

  const matches = [];

  if (previous) {
    for (const [code, invite] of current) {
      const old = previous.get(code);

      if (
        old &&
        invite.uses > old.uses &&
        invite.inviter
      ) {
        matches.push({
          inviter: invite.inviter,
          difference: invite.uses - old.uses
        });
      }
    }
  }

  const inviter =
    matches.length === 1 &&
    matches[0].difference === 1
      ? matches[0].inviter
      : null;

  let status = 'pending';

  if (!inviter) status = 'unknown';
  else if (member.user.bot) status = 'bot';
  else if (inviter === member.id) status = 'self';
  else if (Date.now() - member.user.createdTimestamp < 7 * DAY) {
    status = 'new_account';
  } else if (!competitionActive()) {
    status = 'inactive';
  } else if (previouslyCounted(member.id)) {
    status = 'duplicate';
  }

  if (status === 'pending') {
    db.pending[member.id] = {
      inviter,
      at: Date.now()
    };
  } else if (status === 'unknown' && competitionActive()) {
    db.unknownJoins++;
  }

  saveDb();

  return { status, inviter };
}

async function creditVerifiedInvite(member) {
  return queueInvite(async () => {
    const pending = db.pending[member.id];

    if (!pending) return false;

    delete db.pending[member.id];

    if (
      !competitionActive() ||
      pending.at < db.competition.startsAt ||
      previouslyCounted(member.id)
    ) {
      saveDb();
      return false;
    }

    const inviter = pending.inviter;

    if (!inviter || inviter === member.id) {
      saveDb();
      return false;
    }

    const stats = db.members[inviter] ||= {
      invites: 0,
      joins: []
    };

    stats.joins ||= [];
    stats.joins.push(member.id);
    stats.invites = stats.joins.length;

    db.known[member.id] = true;
    saveDb();

    await logTo(member.guild, CONFIG.inviteLogChannel, {
      embeds: [
        makeEmbed(
          '✅ VERIFIED INVITE',
          `**Member:** <@${member.id}>\n` +
          `**Inviter:** <@${inviter}>\n` +
          `**Total:** ${stats.invites}`,
          CONFIG.green
        )
      ]
    });

    return true;
  });
}

async function postInviteLog(member, info) {
  const statuses = {
    pending: '⏳ Awaiting verification',
    bot: '❌ Bot account',
    self: '❌ Self invite',
    new_account: '❌ Account younger than 7 days',
    inactive: 'ℹ️ No active competition',
    duplicate: '❌ Already counted',
    unknown: '⚠️ Invite could not be identified'
  };

  const e = makeEmbed(
    '📨 RYVORA • INVITE LOG',
    `**Joined:** <@${member.id}>\n` +
    `**Inviter:** ${
      info.inviter ? `<@${info.inviter}>` : 'Unknown'
    }\n` +
    `**Status:** ${statuses[info.status] || info.status}`
  );

  await logTo(member.guild, CONFIG.inviteLogChannel, {
    embeds: [e],
    files: imageFor(e, 'INVITE_LOG', IMAGES.inviteLog)
  });
}

// ============================================================
// VERIFICATION / WELCOME
// ============================================================

async function verifyMember(i) {
  if (!await defer(i)) return;

  const guild = i.guild;
  const member = await guild.members.fetch(i.user.id);
  const role = await guild.roles
    .fetch(CONFIG.verifyRole)
    .catch(() => null);

  const bot = await guild.members.fetchMe();

  if (!role) {
    return respond(i, '❌ Verification role not found.');
  }

  if (
    !bot.permissions.has(P.ManageRoles) ||
    bot.roles.highest.position <= role.position
  ) {
    return respond(
      i,
      '❌ Bot needs Manage Roles and must be above the Verify role.'
    );
  }

  if (member.roles.cache.has(role.id)) {
    return respond(i, '💜 You are already verified.');
  }

  await member.roles.add(role, 'Ryvora verification');

  await respond(i, '✅ Verification successful! Welcome to Ryvora.');

  await creditVerifiedInvite(member);

  await logTo(guild, CONFIG.verifyLogChannel, {
    embeds: [
      makeEmbed(
        '🔐 MEMBER VERIFIED',
        `**Member:** <@${member.id}>\n` +
        `**Role:** <@&${role.id}>`
      )
    ]
  });
}

async function welcomeMember(member) {
  let channel = await getTextChannel(
    member.guild,
    CONFIG.welcomeChannel
  );

  if (!channel) {
    await member.guild.channels.fetch();

    channel = member.guild.channels.cache.find(
      item =>
        item.type === ChannelType.GuildText &&
        item.name.toLowerCase().includes('welcome')
    );
  }

  if (!channel) return false;

  const e = makeEmbed(
    '💜 RYVORA • WELCOME',
    `Welcome ${member}!\n\n` +
    '🔐 Verify your account\n' +
    '🎫 Open a support ticket\n' +
    '🛒 Explore our products\n' +
    '🎉 Join giveaways\n\n' +
    `👥 **Member #${member.guild.memberCount}**`
  ).setThumbnail(
    member.user.displayAvatarURL({ size: 256 })
  );

  await channel.send({
    content: `💜 Welcome ${member}!`,
    embeds: [e],
    files: imageFor(e, 'WELCOME', IMAGES.welcome),
    allowedMentions: {
      users: [member.id],
      parse: []
    }
  });

  return true;
}

// ============================================================
// GIVEAWAYS
// ============================================================

function leaderboardEmbed() {
  const top = ranking().slice(0, 10);

  return makeEmbed(
    '🏆 RYVORA • INVITE LEADERBOARD',
    top.length
      ? top.map(
          (item, index) =>
            `**#${index + 1}** <@${item.id}> — ` +
            `**${item.count}** verified invites`
        ).join('\n')
      : 'No verified invites yet.'
  );
}

function giveawayEmbed() {
  const competition = db.competition;

  if (!competition) {
    return makeEmbed(
      '🎁 RYVORA • GIVEAWAY',
      'No competition has been created.'
    );
  }

  const top = ranking().slice(0, 3);

  const status = competitionActive()
    ? `⏰ Ends <t:${Math.floor(competition.endsAt / 1000)}:R>`
    : '🔒 Competition ended';

  return makeEmbed(
    '🎉 RYVORA • INVITE COMPETITION',
    `## INVITE FRIENDS & WIN!\n\n` +
    `🏆 **Prize:** ${competition.prize}\n` +
    `${status}\n\n` +
    '**Leaderboard**\n' +
    (
      top.length
        ? top.map(
            (item, index) =>
              `${['🥇', '🥈', '🥉'][index]} ` +
              `<@${item.id}> — **${item.count}**`
          ).join('\n')
        : 'No entries yet.'
    ) +
    '\n\nReal members only. Verification is required.'
  );
}

async function startGiveaway(i) {
  if (!await defer(i)) return;

  if (!isAdmin(i)) {
    return respond(i, '❌ Administrator only.');
  }

  if (db.competition?.active) {
    return respond(i, '❌ End the current competition first.');
  }

  const channel =
    i.options.getChannel('channel') ||
    await getTextChannel(i.guild, CONFIG.giveawayChannel) ||
    i.channel;

  if (!channel || typeof channel.send !== 'function') {
    return respond(i, '❌ Invalid giveaway channel.');
  }

  let invites;

  try {
    invites = await snapshotInvites(i.guild);
  } catch {
    return respond(
      i,
      '❌ Bot requires Manage Server to track invites.'
    );
  }

  const days = i.options.getInteger('days', true);
  const prize = i.options.getString('prize', true);

  const draft = {
    active: true,
    prize,
    startsAt: Date.now(),
    endsAt: Date.now() + days * DAY,
    channelId: channel.id,
    messageId: null
  };

  const e = makeEmbed(
    '🎉 RYVORA • INVITE COMPETITION',
    `**Prize:** ${prize}\n` +
    `**Ends:** <t:${Math.floor(draft.endsAt / 1000)}:R>\n\n` +
    'Invites count after verification.'
  );

  const message = await channel.send({
    embeds: [e],
    files: imageFor(e, 'GIVEAWAY', IMAGES.giveaway),
    allowedMentions: { parse: [] }
  });

  inviteCache.set(i.guildId, invites);

  db.competition = {
    ...draft,
    messageId: message.id
  };

  db.members = {};
  db.pending = {};
  db.known = {};
  db.unknownJoins = 0;

  saveDb();

  return respond(i, `✅ Competition started in ${channel}.`);
}

async function endGiveaway(guild) {
  if (!db.competition?.active) return false;

  db.competition.active = false;
  saveDb();

  const results = ranking();
  let description = 'No eligible winner.';

  if (results.length) {
    const tied = results.filter(
      item => item.count === results[0].count
    );

    description = tied.length > 1
      ? '⚠️ Tie between:\n' +
        tied.map(item => `<@${item.id}>`).join('\n') +
        '\nStaff must decide.'
      : `🏆 **Winner:** <@${results[0].id}>\n` +
        `**Verified invites:** ${results[0].count}\n` +
        `**Prize:** ${db.competition.prize}\n\n` +
        'Open a ticket to claim your prize.';
  }

  await logTo(guild, db.competition.channelId, {
    embeds: [
      makeEmbed('🏆 RYVORA • COMPETITION ENDED', description)
    ]
  });

  return true;
}

async function refreshGiveaway(guild) {
  const competition = db.competition;

  if (!competitionActive() || !competition.messageId) {
    return;
  }

  const channel = await getTextChannel(
    guild,
    competition.channelId
  );

  const message = await channel?.messages
    .fetch(competition.messageId)
    .catch(() => null);

  if (!message) return;

  const e = giveawayEmbed();

  if (message.embeds[0]?.image?.url) {
    e.setImage(message.embeds[0].image.url);
  }

  await message.edit({
    embeds: [e],
    allowedMentions: { parse: [] }
  });
}

// ============================================================
// COMMAND REGISTRATION
// ============================================================

const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Post the Ryvora ticket panel')
    .setDefaultMemberPermissions(P.Administrator),

  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Post the verification panel')
    .setDefaultMemberPermissions(P.Administrator),

  new SlashCommandBuilder()
    .setName('catalog')
    .setDescription('Browse Ryvora products'),

  new SlashCommandBuilder()
    .setName('welcome-test')
    .setDescription('Test the welcome message')
    .setDefaultMemberPermissions(P.Administrator),

  new SlashCommandBuilder()
    .setName('invite-start')
    .setDescription('Start an invite competition')
    .addIntegerOption(option =>
      option.setName('days')
        .setDescription('Competition length in days')
        .setMinValue(1)
        .setMaxValue(30)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('prize')
        .setDescription('Competition prize')
        .setMaxLength(200)
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Announcement channel')
        .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(P.Administrator),

  new SlashCommandBuilder()
    .setName('invite-top')
    .setDescription('Show invite leaderboard'),

  new SlashCommandBuilder()
    .setName('invites')
    .setDescription('Check verified invite count')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Member to inspect')
    ),

  new SlashCommandBuilder()
    .setName('invite-end')
    .setDescription('End invite competition')
    .setDefaultMemberPermissions(P.Administrator),

  new SlashCommandBuilder()
    .setName('ryvora-status')
    .setDescription('Show Ryvora bot status')
    .setDefaultMemberPermissions(P.Administrator),

  new SlashCommandBuilder()
    .setName('ryvora-health')
    .setDescription('Check bot permissions')
    .setDefaultMemberPermissions(P.Administrator),

  new SlashCommandBuilder()
    .setName('ryvora-images')
    .setDescription('Check all Ryvora image files')
    .setDefaultMemberPermissions(P.Administrator),

  new SlashCommandBuilder()
    .setName('ryvora-image-test')
    .setDescription('Test a local image in Discord')
    .addStringOption(option =>
      option.setName('image')
        .setDescription('Image filename without .png')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(P.Administrator),

  new SlashCommandBuilder()
    .setName('ticket-add')
    .setDescription('Add a member to a ticket')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Member to add')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(P.ManageChannels),

  ...PRODUCTS.map(product =>
    new SlashCommandBuilder()
      .setName(product.command)
      .setDescription(`Post ${product.title} product card`)
      .setDefaultMemberPermissions(P.ManageGuild)
  )
].map(command => command.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' })
    .setToken(CONFIG.token);

  await rest.put(
    Routes.applicationGuildCommands(
      CONFIG.clientId,
      CONFIG.guildId
    ),
    { body: commands }
  );

  log(`${commands.length} slash commands registered.`);
}

// ============================================================
// HEALTH
// ============================================================

async function healthEmbed(guild) {
  const bot = await guild.members.fetchMe();

  const role = await guild.roles
    .fetch(CONFIG.verifyRole)
    .catch(() => null);

  const category = await guild.channels
    .fetch(CONFIG.ticketCategory)
    .catch(() => null);

  const staffRole = await guild.roles
    .fetch(CONFIG.staffRole)
    .catch(() => null);

  const checks = [
    ['Ticket category', category?.type === ChannelType.GuildCategory],
    ['Staff role', Boolean(staffRole)],
    ['Verify role', Boolean(role)],
    ['Manage Channels', bot.permissions.has(P.ManageChannels)],
    ['Manage Roles', bot.permissions.has(P.ManageRoles)],
    ['Verify role below bot', Boolean(role) &&
      bot.roles.highest.position > role.position],
    ['Manage Server', bot.permissions.has(P.ManageGuild)]
  ];

  return makeEmbed(
    '🩺 RYVORA • HEALTH CHECK',
    checks.map(([name, ok]) =>
      `${ok ? '✅' : '❌'} ${name}`
    ).join('\n') +
    '\n\nEnable Server Members Intent in the Developer Portal.'
  );
}

function imageHealthEmbed() {
  const results = imageHealth();

  const found = results.filter(item => item.exists).length;

  return makeEmbed(
    '🖼️ RYVORA • IMAGE HEALTH',
    `**Local images:** ${found}/${results.length}\n\n` +
    results.map(item =>
      `${item.exists ? '✅' : item.fallback ? '⚠️' : '❌'} ` +
      `\`${item.filename}\``
    ).join('\n') +
    '\n\n✅ Local file\n⚠️ URL fallback only\n❌ Missing'
  );
}

// ============================================================
// EVENTS
// ============================================================

client.on(Events.InviteCreate, invite => {
  if (invite.guild?.id !== CONFIG.guildId) return;

  queueInvite(async () => {
    const cache = inviteCache.get(invite.guild.id);

    if (!cache) {
      await initializeInvites(invite.guild);
      return;
    }

    cache.set(invite.code, {
      uses: invite.uses || 0,
      inviter: invite.inviterId || invite.inviter?.id || null
    });
  });
});

client.on(Events.InviteDelete, invite => {
  if (invite.guild?.id !== CONFIG.guildId) return;

  queueInvite(async () => {
    inviteCache.get(invite.guild.id)?.delete(invite.code);
  });
});

client.on(Events.GuildMemberAdd, async member => {
  if (member.guild.id !== CONFIG.guildId) return;

  try {
    const info = await queueInvite(
      () => trackJoin(member)
    );

    await postInviteLog(member, info);
  } catch (error) {
    logError('Member invite error:', error.message);
  }

  try {
    await welcomeMember(member);
  } catch (error) {
    logError('Welcome error:', error.message);
  }
});

client.on(Events.GuildMemberRemove, async member => {
  if (member.guild.id !== CONFIG.guildId) return;

  await queueInvite(async () => {
    delete db.pending[member.id];

    for (const stats of Object.values(db.members)) {
      const index = stats.joins?.indexOf(member.id) ?? -1;

      if (index >= 0) {
        stats.joins.splice(index, 1);
        stats.invites = stats.joins.length;
      }
    }

    saveDb();
  });
});

// ============================================================
// INTERACTIONS
// ============================================================

const processing = new Set();

client.on(Events.InteractionCreate, async i => {
  if (!i.inGuild() || i.guildId !== CONFIG.guildId) return;

  if (processing.has(i.id)) {
    log(`Duplicate local interaction ignored: ${i.id}`);
    return;
  }

  processing.add(i.id);

  try {
    if (i.isChatInputCommand()) {
      const name = i.commandName;

      if (name === 'setup' || name === 'verify') {
        if (!await defer(i)) return;

        if (!isAdmin(i)) {
          return respond(i, '❌ Administrator only.');
        }

        const payload = name === 'setup'
          ? ticketPanel()
          : verifyPanel();

        await i.channel.send({
          ...payload,
          allowedMentions: { parse: [] }
        });

        return respond(
          i,
          `✅ ${name === 'setup' ? 'Ticket' : 'Verification'} panel posted.`
        );
      }

      if (name === 'catalog') {
        return i.reply({
          ...catalogPanel(),
          flags: MessageFlags.Ephemeral
        });
      }

      if (name === 'welcome-test') {
        if (!await defer(i)) return;

        if (!isAdmin(i)) {
          return respond(i, '❌ Administrator only.');
        }

        const member = await i.guild.members.fetch(i.user.id);
        const sent = await welcomeMember(member);

        return respond(
          i,
          sent
            ? '✅ Welcome message posted.'
            : '❌ Welcome channel not found.'
        );
      }

      if (name === 'invite-start') {
        return startGiveaway(i);
      }

      if (name === 'invite-end') {
        if (!await defer(i)) return;

        if (!isAdmin(i)) {
          return respond(i, '❌ Administrator only.');
        }

        const ended = await endGiveaway(i.guild);

        return respond(
          i,
          ended
            ? '✅ Competition ended.'
            : '❌ No active competition.'
        );
      }

      if (name === 'invite-top') {
        const e = leaderboardEmbed();

        return i.reply({
          embeds: [e],
          files: imageFor(
            e,
            'LEADERBOARD',
            IMAGES.leaderboard
          )
        });
      }

      if (name === 'invites') {
        const user = i.options.getUser('user') || i.user;
        const count = db.members[user.id]?.joins?.length || 0;

        return respond(i, {
          embeds: [
            makeEmbed(
              '📨 RYVORA • INVITES',
              `**Member:** ${user}\n` +
              `**Verified invites:** ${count}`
            )
          ]
        });
      }

      if (name === 'ryvora-status') {
        return respond(i, {
          embeds: [
            makeEmbed(
              '💜 RYVORA • SYSTEM STATUS',
              `🟢 **Connected**\n` +
              `🎫 Tickets: ${Object.keys(state.tickets).length}\n` +
              `🛒 Products: ${PRODUCTS.length}\n` +
              `🏆 Competition: ${
                competitionActive() ? 'Active' : 'Inactive'
              }\n` +
              `📨 Unknown joins: ${db.unknownJoins}\n` +
              `🖼️ Images: ${
                imageHealth().filter(item => item.exists).length
              }/${allImageEntries().length}\n` +
              `⏱️ Uptime: ${Math.floor(process.uptime() / 60)} min`
            )
          ]
        });
      }

      if (name === 'ryvora-health') {
        if (!await defer(i)) return;

        if (!isAdmin(i)) {
          return respond(i, '❌ Administrator only.');
        }

        return respond(i, {
          embeds: [await healthEmbed(i.guild)]
        });
      }

      if (name === 'ryvora-images') {
        if (!isAdmin(i)) {
          return respond(i, '❌ Administrator only.');
        }

        return respond(i, {
          embeds: [imageHealthEmbed()]
        });
      }

      if (name === 'ryvora-image-test') {
        if (!await defer(i)) return;

        if (!isAdmin(i)) {
          return respond(i, '❌ Administrator only.');
        }

        const requested = i.options
          .getString('image', true)
          .trim()
          .toLowerCase();

        const filename = `${requested}.png`;

        const entry = allImageEntries().find(
          item => item.filename === filename
        );

        if (!entry) {
          return respond(
            i,
            '❌ Unknown image. Use /ryvora-images to see valid names.'
          );
        }

        const e = makeEmbed(
          '🖼️ RYVORA • IMAGE TEST',
          `Testing \`${entry.filename}\``
        );

        const files = imageFor(
          e,
          entry.key,
          entry.filename
        );

        if (!files.length && !e.data.image) {
          return respond(i, `❌ Image not found: ${filename}`);
        }

        return respond(i, {
          embeds: [e],
          files
        });
      }

      if (name === 'ticket-add') {
        if (!await defer(i)) return;

        if (!isStaff(i) || !isTicket(i.channel)) {
          return respond(i, '❌ Staff ticket only.');
        }

        const user = i.options.getUser('user', true);

        await i.channel.permissionOverwrites.edit(
          user.id,
          {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true
          }
        );

        return respond(
          i,
          `✅ Added <@${user.id}> to this ticket.`
        );
      }

      const product = productByKey.get(name);

      if (product) {
        if (!await defer(i)) return;

        if (!isManager(i)) {
          return respond(
            i,
            '❌ Manage Server permission required.'
          );
        }

        await i.channel.send({
          ...productCard(product),
          allowedMentions: { parse: [] }
        });

        return respond(
          i,
          `✅ ${product.title} product card posted.`
        );
      }
    }

    if (i.isButton()) {
      if (i.customId === 'ryvora_verify') {
        return verifyMember(i);
      }

      if (i.customId === 'ryvora_claim_ticket') {
        return claimTicket(i);
      }

      if (i.customId === 'ryvora_close_ticket') {
        return closeTicket(i);
      }

      if (i.customId.startsWith('ryvora_buy:')) {
        const key = i.customId.slice('ryvora_buy:'.length);

        if (!productByKey.has(key)) {
          return respond(i, '❌ Product not found.');
        }

        return createTicket(i, 'purchase', key);
      }
    }

    if (i.isStringSelectMenu()) {
      if (i.customId === 'ryvora_ticket_category') {
        return createTicket(i, i.values[0]);
      }

      if (i.customId === 'ryvora_catalog') {
        const product = productByKey.get(i.values[0]);

        if (!product) {
          return respond(i, '❌ Product not found.');
        }

        return i.reply({
          ...productCard(product),
          flags: MessageFlags.Ephemeral
        });
      }
    }
  } catch (error) {
    logError(
      `Interaction error ${i.id}:`,
      error.stack || error.message
    );

    if ([10062, 40060].includes(error.code)) {
      return;
    }

    if (!i.isRepliable()) return;

    try {
      await respond(
        i,
        '❌ Something went wrong. Please contact staff.'
      );
    } catch (replyError) {
      logError('Error response failed:', replyError.message);
    }
  } finally {
    processing.delete(i.id);
  }
});

// ============================================================
// STARTUP
// ============================================================

let giveawayTimer = null;

client.once(Events.ClientReady, async () => {
  log(`Logged in as ${client.user.tag}`);

  const guild =
    client.guilds.cache.get(CONFIG.guildId) ||
    await client.guilds.fetch(CONFIG.guildId).catch(() => null);

  if (!guild) {
    logError('Configured guild not found.');
    return;
  }

  try {
    await registerCommands();
  } catch (error) {
    logError('Command registration failed:', error.message);
  }

  await initializeInvites(guild);

  const images = imageHealth();
  const found = images.filter(item => item.exists).length;

  log(`Local images: ${found}/${images.length}`);

  for (const item of images) {
    if (!item.exists) {
      log(`Missing local image: ${item.filename}`);
    }
  }

  const tick = async () => {
    try {
      if (!db.competition?.active) return;

      if (!competitionActive()) {
        await endGiveaway(guild);
      } else {
        await refreshGiveaway(guild);
      }
    } catch (error) {
      logError('Giveaway update:', error.message);
    }
  };

  await tick();

  giveawayTimer = setInterval(tick, 60000);

  log(`Products loaded: ${PRODUCTS.length}`);
  log('Ticket system ready.');
  log('Verification system ready.');
  log('Invite system ready.');
  log('Image system ready.');
  log('All Ryvora systems initialized.');
});

// ============================================================
// ERROR HANDLING
// ============================================================

client.on(Events.Error, error => {
  logError('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  logError('Unhandled rejection:', error);
});

process.on('uncaughtException', error => {
  logError('Fatal error:', error);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    log(`Shutting down (${signal})...`);

    if (giveawayTimer) {
      clearInterval(giveawayTimer);
    }

    client.destroy();
    process.exit(0);
  });
}

client.login(CONFIG.token).catch(error => {
  logError('Login failed:', error);
  process.exit(1);
});
