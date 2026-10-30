
'use strict';

require('dotenv').config();

function envId(name) {
  const raw = String(process.env[name] ?? '').trim().replace(/^['"]|['"]$/g, '').trim();
  return raw;
}
function idConfigured(name) { return /^\d{17,20}$/.test(envId(name)); }


const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits: P,
  Events,
  AuditLogEvent,
  REST,
  Routes,
  SlashCommandBuilder,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  SeparatorBuilder
} = require('discord.js');

// ======================================================
// RYVORA - ULTIMATE METHODS
// Unified Discord.js v14 bot
// ======================================================

const CONFIG = {
  token: process.env.DISCORD_TOKEN,
  clientId: envId('CLIENT_ID'),
  guildId: envId('GUILD_ID'),
  ticketCategory: envId('TICKET_CATEGORY_ID'),
  staffRole: envId('STAFF_ROLE_ID'),
  verifyRole: envId('VERIFY_ROLE_ID'),
  welcomeChannel: process.env.WELCOME_CHANNEL_ID,
  giveawayChannel: process.env.GIVEAWAY_CHANNEL_ID,
  inviteLogChannel: process.env.INVITE_LOG_CHANNEL_ID,
  ticketLogChannel: process.env.TICKET_LOG_CHANNEL_ID,
  verifyLogChannel: process.env.VERIFY_LOG_CHANNEL_ID,
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
  securityLogChannel: process.env.SECURITY_LOG_CHANNEL_ID,
  purple: 0x8B2CFF,
  green: 0x57F287,
  red: 0xED4245
};

// Core credentials are required. Feature-specific IDs are validated at use time.
const missingCore = ['token', 'clientId', 'guildId'].filter(key => !CONFIG[key]);
if (missingCore.length) {
  throw new Error(`Missing core configuration: ${missingCore.join(', ')}. Check Railway Variables.`);
}
for (const [key, env] of [
  ['ticketCategory', 'TICKET_CATEGORY_ID'],
  ['staffRole', 'STAFF_ROLE_ID'],
  ['verifyRole', 'VERIFY_ROLE_ID']
]) {
  if (!/^\d{17,20}$/.test(CONFIG[key] || '')) console.warn(`[RYVORA] ${env} is missing or invalid; related features will be unavailable.`);
}

const log = (...args) => console.log('[RYVORA]', ...args);
function configReport() {
  for (const [name, value] of [
    ['TICKET_CATEGORY_ID', CONFIG.ticketCategory],
    ['STAFF_ROLE_ID', CONFIG.staffRole],
    ['VERIFY_ROLE_ID', CONFIG.verifyRole],
    ['GUILD_ID', CONFIG.guildId]
  ]) {
    console.log(`[RYVORA CONFIG] ${name}: ${/^\d{17,20}$/.test(value || '') ? 'VALID' : value ? 'INVALID FORMAT' : 'MISSING'} (length=${(value || '').length})`);
  }
}
configReport();

const logError = (...args) => console.error('[RYVORA]', ...args);

const ROOT = __dirname;
const IMAGE_DIR = path.join(ROOT, 'images');
const DAY = 86400000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// ======================================================
// SAFE STORAGE
// ======================================================

function writableDirectory() {
  const configured = process.env.RYVORA_DATA_DIR?.trim();
  const candidates = configured
    ? [configured]
    : [
        path.join(ROOT, 'data'),
        path.join(os.tmpdir(), 'ryvora')
      ];

  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });

      const probe = path.join(dir, `.probe-${process.pid}`);
      fs.writeFileSync(probe, 'ok', { flag: 'wx' });
      fs.unlinkSync(probe);

      log('Writable storage:', dir);

      if (dir.startsWith(os.tmpdir())) {
        logError('Temporary storage in use. Configure a Railway Volume and RYVORA_DATA_DIR for persistence.');
      }

      return dir;
    } catch (error) {
      logError('Storage unavailable:', dir, error.message);
    }
  }

  throw new Error('No writable data directory available');
}

const DATA_DIR = writableDirectory();
const DB_FILE = path.join(DATA_DIR, 'ryvora-invites.json');
const STATE_FILE = path.join(DATA_DIR, 'ryvora-state.json');

function readJson(filename, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logError('Storage read failed:', filename, error.message);
    }
    return fallback;
  }
}

function writeJson(filename, value) {
  const temp = `${filename}.${process.pid}.tmp`;

  try {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(
      temp,
      JSON.stringify(value, null, 2),
      { encoding: 'utf8', mode: 0o600 }
    );
    fs.renameSync(temp, filename);
  } catch (error) {
    try {
      if (fs.existsSync(temp)) fs.unlinkSync(temp);
    } catch {}
    logError('Storage write failed:', filename, error.message);
    throw error;
  }
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

function safeSave(fn, label) {
  try {
    fn();
    return true;
  } catch (error) {
    logError(`${label} persistence failed:`, error.message);
    return false;
  }
}

// ======================================================
// IMAGES
// ======================================================

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

function allImages() {
  return [
    ...Object.entries(IMAGES)
      .filter(([key]) => key !== 'products')
      .map(([key, filename]) => ({
        key: key.replace(/([A-Z])/g, '_$1').toUpperCase(),
        filename
      })),
    ...Object.entries(IMAGES.products)
      .map(([key, filename]) => ({
        key: `PRODUCT_${key.toUpperCase()}`,
        filename
      }))
  ];
}

function validImage(filename) {
  if (!filename || path.basename(filename) !== filename) return false;

  try {
    const stat = fs.statSync(path.join(IMAGE_DIR, filename));
    return stat.isFile() && stat.size > 0 && stat.size <= 8 * 1024 * 1024;
  } catch {
    return false;
  }
}

function imageFor(embed, key, filename, fallback = null) {
  const chosen = validImage(filename)
    ? filename
    : validImage(fallback)
      ? fallback
      : null;

  if (chosen) {
    embed.setImage(`attachment://${chosen}`);
    return [
      new AttachmentBuilder(path.join(IMAGE_DIR, chosen), {
        name: chosen
      })
    ];
  }

  const url = process.env[`IMAGE_${key.toUpperCase()}`]?.trim();

  if (url && /^https:\/\//i.test(url)) {
    embed.setImage(url);
    return [];
  }

  log('Image missing:', filename);
  return [];
}

function imageHealth() {
  return allImages().map(item => ({
    ...item,
    exists: validImage(item.filename),
    fallback: Boolean(process.env[`IMAGE_${item.key}`]?.trim())
  }));
}

// ======================================================
// PRODUCT CATALOG - 15 PRODUCTS
// ======================================================

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
    description: 'NVIDIA Bypass product information.\n\nContact staff to confirm compatibility.',
    pricing: '• NVIDIA Bypass → **$10**\n• NVIDIA Bypass + Mouse → **$15**'
  },
  {
    command: 'custom_cleaners',
    title: 'Custom Cleaners',
    description: '🧹 **Custom Cleaner Service**\n\nAvailable products:\n• TZX\n• GOSTH\n• TESTO\n• SKRIPTGG\n\nContact staff for details.',
    pricing: '• Price per cleaner → **$35**'
  },
  {
    command: 'tweaks',
    title: 'PC Optimization',
    description: '🚀 **Complete PC Optimization**\n\n• BIOS Tuner\n• Network Adapter Tuner\n• Hardware Optimization\n• Priority Customer Support\n• 20+ Advanced Features\n\nResults depend on hardware and configuration.',
    pricing: '• PC Optimization → **$30**\n• Re-Optimization → **$15**'
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
    pricing: '• 4,500 V-Bucks → **$40**\n• 12,500 V-Bucks → **$80**'
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

// ======================================================
// HELPERS
// ======================================================

function embed(title, description, color = CONFIG.purple) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: 'RYVORA • ULTIMATE METHODS' })
    .setTimestamp();
}

const isAdmin = i => Boolean(i.memberPermissions?.has(P.Administrator));
const isManager = i => Boolean(i.memberPermissions?.has(P.ManageGuild));

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
    if ([10062, 40060].includes(error.code)) {
      logError('Interaction conflict:', i.id);
      return false;
    }
    throw error;
  }
}

async function respond(i, payload) {
  const data = typeof payload === 'string'
    ? { content: payload }
    : payload;

  if (i.deferred) return i.editReply(data);

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

async function getChannel(guild, id) {
  if (!id) return null;

  const channel = await guild.channels.fetch(id).catch(() => null);

  return channel?.isTextBased() &&
    typeof channel.send === 'function'
    ? channel
    : null;
}

async function logTo(guild, channelId, payload) {
  const channel = await getChannel(guild, channelId);
  if (!channel) return false;

  try {
    await channel.send({
      ...payload,
      allowedMentions: { parse: [] }
    });
    return true;
  } catch (error) {
    logError('Log delivery failed:', error.message);
    return false;
  }
}

// ======================================================
// PANELS
// ======================================================

// RYVORA V2 DISPLAY PANELS
// Components V2 keeps text, selection and artwork in the requested order.
// If discord.js is older than 14.19, use a clean legacy embed without crashing.
const displayV2Available = Boolean(
  ContainerBuilder && TextDisplayBuilder && MediaGalleryBuilder &&
  SeparatorBuilder && MessageFlags.IsComponentsV2
);

function v2Media(container, key, filename) {
  const holder = new EmbedBuilder();
  const files = imageFor(holder, key, filename);
  const imageUrl = holder.toJSON().image?.url;
  if (imageUrl) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(item =>
        item.setURL(imageUrl).setDescription('Ryvora Shop banner')
      )
    );
  }
  return files;
}

function makePanelMenu(customId, placeholder, options) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .addOptions(options)
  );
}

// RYVORA V3: Discord-native interactive layouts, not a static mockup.
function ticketPanel() {
  const options = Object.entries(CATEGORIES).map(([key, category]) => ({
    label: category.name, value: key, emoji: category.emoji,
    description: ({purchase:'Orders and payments',pre_sale:'Questions before ordering',
      support:'Technical help',hwid_reset:'Reset requests',
      media_reseller:'Partnerships and media'})[key]
  }));
  const row = makePanelMenu('ryvora_ticket_category', 'Select your support department...', options);
  const headline = '## 🎟️  RYVORA / SERVICE CONTROL';
  const intro = '┃ **PRIVATE SUPPORT GATEWAY**\nChoose a department below. Your request will open in a private channel.';
  const status = '🟢 **Private ticket**  •  🟢 **Staff access**  •  🔒 **One open ticket per member**';
  if (displayV2Available) {
    const panel = new ContainerBuilder().setAccentColor(CONFIG.purple)
      .addTextDisplayComponents(x=>x.setContent(headline))
      .addSeparatorComponents(x=>x.setDivider(true))
      .addTextDisplayComponents(x=>x.setContent(intro))
      .addTextDisplayComponents(x=>x.setContent('### ◈ SELECT A DEPARTMENT'))
      .addActionRowComponents(row)
      .addSeparatorComponents(x=>x.setDivider(true))
      .addTextDisplayComponents(x=>x.setContent(status));
    const files = v2Media(panel,'TICKET',IMAGES.ticket);
    panel.addTextDisplayComponents(x=>x.setContent('-# RYVORA • ULTIMATE METHODS  /  SUPPORT SYSTEM V3'));
    return {flags:MessageFlags.IsComponentsV2,components:[panel],files};
  }
  const e=embed('🎟️ RYVORA / SERVICE CONTROL',intro+'\n\n'+status);
  return {embeds:[e],components:[row],files:imageFor(e,'TICKET',IMAGES.ticket)};
}

function verifyPanel() {
  const button = new ActionRowBuilder().addComponents(new ButtonBuilder()
    .setCustomId('ryvora_verify').setLabel('Enter Ryvora')
    .setEmoji('🚪').setStyle(ButtonStyle.Primary));
  const intro='┃ Verify to unlock the **Ryvora Shop** community and member channels.';
  const benefits='### 👥 COMMUNITY ACCESS\n💬 Community chat and support\n⭐ Member-only channels\n🎁 Events and giveaways\n🤝 Connect with the community';
  // Configured means the environment variable exists; runtime permissions are checked when clicked.
  const configured=idConfigured('VERIFY_ROLE_ID');
  const status='### ⚡ QUICK ENTRY\n'+
    `${configured?'🟢':'🟡'} **Role configured:** ${configured?'Yes':'No'}\n`+
    '🟢 **One-click verification**\n🔒 **No password requested**\n'+
    '⚙️ **Role assignment:** checked on click';
  if(displayV2Available){
    const panel=new ContainerBuilder().setAccentColor(CONFIG.purple)
      .addTextDisplayComponents(x=>x.setContent('## 🛡️  Ryvora × Verification'))
      .addSeparatorComponents(x=>x.setDivider(true))
      .addTextDisplayComponents(x=>x.setContent(intro))
      .addTextDisplayComponents(x=>x.setContent(benefits))
      .addSeparatorComponents(x=>x.setDivider(true))
      .addTextDisplayComponents(x=>x.setContent(status))
      .addActionRowComponents(button);
    const files=v2Media(panel,'VERIFY',IMAGES.verify);
    panel.addTextDisplayComponents(x=>x.setContent('-# RYVORA SHOP  •  ACCESS GATEWAY V3'));
    return {flags:MessageFlags.IsComponentsV2,components:[panel],files};
  }
  const e=embed('🛡️ Ryvora × Verification',intro+'\n\n'+benefits+'\n\n'+status);
  return {embeds:[e],components:[button],files:imageFor(e,'VERIFY',IMAGES.verify)};
}

function productCard(product) {
  const e = embed(
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
    components: [new ActionRowBuilder().addComponents(button)]
  };
}

function catalogPanel() {
  const e = embed(
    '🛒 RYVORA • PRODUCT CATALOG',
    'Browse our premium product catalog.\n\n' +
    'Choose a product below to view pricing and information.'
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
    components: [new ActionRowBuilder().addComponents(menu)]
  };
}

// ======================================================
// TICKETS
// ======================================================

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
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('ryvora_admin_tools')
        .setPlaceholder('⚙️ Ticket management • Administrator')
        .addOptions([
          {label:'Add Member',value:'add',emoji:'👤'},
          {label:'Remove Member',value:'remove',emoji:'🚫'},
          {label:'Unclaim',value:'unclaim',emoji:'🔓'},
          {label:'Notify Owner',value:'notify',emoji:'🔔'},
          {label:'Transfer Ticket',value:'transfer',emoji:'🔄'}
        ])
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
  let announced = false;

  try {
    const guild = i.guild;

    if (!idConfigured('TICKET_CATEGORY_ID') || !idConfigured('STAFF_ROLE_ID')) {
      const missing = ['TICKET_CATEGORY_ID', 'STAFF_ROLE_ID']
        .filter(name => !idConfigured(name));
      logError('Ticket configuration missing/invalid:', missing.join(', '));
      return respond(i, `❌ Ticket configuration invalid: ${missing.join(', ')}. Check Railway deployment variables and restart.`);
    }

    const parent = await guild.channels
      .fetch(CONFIG.ticketCategory)
      .catch(() => null);

    if (parent?.type !== ChannelType.GuildCategory) {
      logError('Ticket category not found / not a category:', CONFIG.ticketCategory);
      return respond(i, '❌ TICKET_CATEGORY_ID does not point to a category in this server.');
    }

    const bot = await guild.members.fetchMe();

    if (!bot.permissions.has(P.ManageChannels)) {
      return respond(i, '❌ Bot requires Manage Channels.');
    }

    const staffRole = await guild.roles
      .fetch(CONFIG.staffRole)
      .catch(() => null);

    if (!staffRole) {
      return respond(i, '❌ Staff role was not found.');
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
            P.AttachFiles,
            P.EmbedLinks
          ]
        }
      ]
    });

    state.tickets[created.id] = {
      ownerId: i.user.id,
      category: categoryKey,
      product: productKey,
      claimedBy: null,
      createdAt: Date.now()
    };

    // Storage failures must not destroy a successfully created channel.
    safeSave(saveState, 'Ticket');

    const e = embed(
      `${category.emoji} RYVORA • ${category.name}`,
      `Welcome <@${i.user.id}>!\n\n` +
      `**Category:** ${category.name}\n` +
      (product ? `**Product:** ${product.title}\n` : '') +
      '\nPlease describe your request clearly.\n\n' +
      '💜 Our support team will assist you.'
    );

    const files = imageFor(
      e,
      category.imageKey,
      category.image,
      IMAGES.ticket
    );

    try {
      await created.send({
        content: `<@${i.user.id}> <@&${CONFIG.staffRole}>`,
        embeds: [e],
        files,
        components: ticketButtons(),
        allowedMentions: {
          users: [i.user.id],
          roles: [CONFIG.staffRole]
        }
      });
    } catch (error) {
      logError('Ticket welcome message failed:', error.message);

      // Try again without attachments.
      e.setImage(null);

      try {
        await created.send({
          embeds: [e],
          components: ticketButtons(),
          allowedMentions: { parse: [] }
        });
      } catch (retryError) {
        logError('Ticket fallback message failed:', retryError.message);
      }
    }

    await respond(i, `✅ Your ticket is ready: ${created}`);
    announced = true;

    await logTo(guild, CONFIG.ticketLogChannel, {
      embeds: [
        embed(
          '🎫 TICKET CREATED',
          `**Owner:** <@${i.user.id}>\n` +
          `**Category:** ${category.name}\n` +
          `**Channel:** ${created}`
        )
      ]
    });
  } catch (error) {
    logError('Ticket creation failed:', error.stack || error.message);

    if (created && !announced) {
      await respond(
        i,
        `⚠️ Your ticket channel was created, but setup was incomplete: ${created}`
      ).catch(() => {});
    } else if (!created) {
      await respond(
        i,
        '❌ Could not create the ticket. Please contact staff.'
      ).catch(() => {});
    }
  } finally {
    ticketLocks.delete(lock);
  }
}

async function claimTicket(i) {
  if (!await defer(i)) return;

  if (!isStaff(i)) return respond(i, '❌ Staff only.');
  if (!isTicket(i.channel)) return respond(i, '❌ Not a ticket.');

  const ticket = state.tickets[i.channelId] ||= {
    ownerId: ownerFrom(i.channel),
    category: 'support',
    claimedBy: null,
    createdAt: Date.now()
  };

  if (ticket.claimedBy) {
    return respond(i, `⚠️ Already claimed by <@${ticket.claimedBy}>.`);
  }

  ticket.claimedBy = i.user.id;
  safeSave(saveState, 'Ticket claim');

  await i.message.edit({
    components: ticketButtons(true)
  }).catch(error => logError('Claim button update failed:', error.message));

  await i.channel.send({
    embeds: [
      embed('💜 STAFF ASSIGNED', `<@${i.user.id}> has claimed this ticket.`)
    ],
    allowedMentions: { parse: [] }
  });

  await audit(i.guild, 'ticket', 'TICKET CLAIMED', [
    ['Ticket', i.channel.name], ['Staff', `<@${i.user.id}>`],
    ['Owner', `<@${ticket.ownerId}>`]
  ]);
  return respond(i, '✅ Ticket claimed successfully.');
}

const notifyCooldown = new Map();

async function adminTicketTool(i) {
  if (!isAdmin(i)) return respond(i, '❌ Administrator permission required.');
  if (!isTicket(i.channel)) return respond(i, '❌ Not a ticket channel.');
  const action = i.values[0];
  const ticket = state.tickets[i.channelId] ||= {
    ownerId: ownerFrom(i.channel), category: 'support', claimedBy: null, createdAt: Date.now()
  };
  if (['add','remove','transfer'].includes(action)) {
    return respond(i, {
      content: 'Select a member for: ' + action,
      components: [new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder().setCustomId('ryvora_admin_user:' + action)
          .setPlaceholder('Select a member').setMinValues(1).setMaxValues(1)
      )]
    });
  }
  if (action === 'unclaim') {
    if (!ticket.claimedBy) return respond(i, '⚠️ Ticket is not claimed.');
    const previous = ticket.claimedBy;
    ticket.claimedBy = null;
    safeSave(saveState, 'Ticket unclaim');
    const messages = await i.channel.messages.fetch({limit: 50}).catch(() => null);
    const panel = messages?.find(m => m.author.id === client.user.id &&
      m.components?.some(r => r.components?.some(c => c.customId === 'ryvora_claim_ticket')));
    if (panel) await panel.edit({components:ticketButtons(false)}).catch(e=>logError('Unclaim panel:',e.message));
    await audit(i.guild,'ticket','TICKET UNCLAIMED', [['Previous staff',`<@${previous}>`],['By',`<@${i.user.id}>`]]);
    return respond(i,'✅ Ticket is unclaimed.');
  }
  if (action === 'notify') {
    const last = notifyCooldown.get(i.channelId) || 0;
    if (Date.now()-last < 600000) return respond(i,'⏳ Please wait 10 minutes between notifications.');
    const ownerId = ticket.ownerId || ownerFrom(i.channel);
    if (!ownerId) return respond(i,'❌ Ticket owner not found.');
    await i.channel.send({content:`🔔 <@${ownerId}>, the support team is waiting for your response.`,
      allowedMentions:{users:[ownerId]}});
    notifyCooldown.set(i.channelId,Date.now());
    await audit(i.guild,'ticket','OWNER NOTIFIED',[['Owner',`<@${ownerId}>`],['By',`<@${i.user.id}>`]]);
    return respond(i,'✅ Owner notified.');
  }
  return respond(i,'❌ Unknown action.');
}

async function adminTicketUser(i) {
  if (!await defer(i)) return;
  if (!isAdmin(i)) return respond(i,'❌ Administrator permission required.');
  if (!isTicket(i.channel)) return respond(i,'❌ Not a ticket channel.');
  const action=i.customId.split(':')[1];
  if (!['add','remove','transfer'].includes(action)) return respond(i,'❌ Invalid action.');
  const id=i.values[0];
  const member=await i.guild.members.fetch(id).catch(()=>null);
  if (!member) return respond(i,'❌ Member not found.');
  const ticket=state.tickets[i.channelId] ||= {
    ownerId:ownerFrom(i.channel),category:'support',claimedBy:null,createdAt:Date.now()
  };
  if (action==='remove' && (id===ticket.ownerId || id===client.user.id))
    return respond(i,'❌ Cannot remove ticket owner or bot.');
  if (action==='transfer' && !(member.permissions.has(P.Administrator) ||
    member.roles.cache.has(CONFIG.staffRole)))
    return respond(i,'❌ Transfer target must be staff or Administrator.');
  try {
    if (action==='remove') {
      await i.channel.permissionOverwrites.edit(id,{ViewChannel:false,SendMessages:false},
        {reason:`Ryvora ticket removal by ${i.user.id}`});
    } else {
      await i.channel.permissionOverwrites.edit(id,{
        ViewChannel:true,SendMessages:true,ReadMessageHistory:true
      },{reason:`Ryvora ticket ${action} by ${i.user.id}`});
      if (action==='transfer') {
        ticket.claimedBy=id;
        safeSave(saveState,'Ticket transfer');
        const messages=await i.channel.messages.fetch({limit:50}).catch(()=>null);
        const panel=messages?.find(m=>m.author.id===client.user.id &&
          m.components?.some(r=>r.components?.some(c=>c.customId==='ryvora_claim_ticket')));
        if(panel) await panel.edit({components:ticketButtons(true)}).catch(e=>logError('Transfer panel:',e.message));
      }
    }
  } catch(error) {
    logError('Ticket permissions:',error);
    return respond(i,'❌ Failed to update ticket permissions. Check bot Manage Channels permission.');
  }
  await audit(i.guild,'ticket',`TICKET ${action.toUpperCase()}`,[
    ['Member',`<@${id}>`],['Administrator',`<@${i.user.id}>`],['Ticket',i.channel.name]
  ]);
  await i.channel.send({content:`⚙️ **${action.toUpperCase()}** • <@${id}> • by <@${i.user.id}>`,
    allowedMentions:{parse:[]}}).catch(()=>{});
  return respond(i,`✅ ${action} completed for <@${id}>.`);
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

  messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

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
      logError('Transcript failed:', error.message);
    }

    if (!transcript) return respond(i, '❌ Transcript generation failed. Ticket was kept open.');

    const ticket = state.tickets[i.channelId];

    const summary = embed(
      '🔒 TICKET CLOSED',
      `**Channel:** ${i.channel.name}\n` +
      `**Owner:** <@${ownerId}>\n` +
      `**Closed by:** <@${i.user.id}>\n` +
      `**Category:** ${ticket?.category || 'Unknown'}\n` +
      `**Claimed by:** ${ticket?.claimedBy ? `<@${ticket.claimedBy}>` : 'None'}`
    );
    const summarySaved = CONFIG.ticketLogChannel === CONFIG.transcriptLogChannel
      ? true
      : await logTo(i.guild, CONFIG.ticketLogChannel, { embeds: [summary] });
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
    await i.channel.delete(`Closed by ${i.user.id}`);

    delete state.tickets[i.channelId];
    safeSave(saveState, 'Ticket closure');
  } finally {
    ticketLocks.delete(i.channelId);
  }
}

// ======================================================
// INVITE TRACKING
// ======================================================

const inviteCache = new Map();
let inviteQueue = Promise.resolve();

function queueInvite(operation) {
  const result = inviteQueue.then(operation);

  inviteQueue = result.catch(error => {
    logError('Invite queue error:', error.message);
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
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
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
    logError('Invite fetch failed:', error.message);
    return { status: 'unknown', inviter: null };
  }

  inviteCache.set(member.guild.id, current);

  const matches = [];

  if (previous) {
    for (const [code, invite] of current) {
      const old = previous.get(code);

      if (old && invite.uses > old.uses && invite.inviter) {
        matches.push({
          inviter: invite.inviter,
          difference: invite.uses - old.uses
        });
      }
    }
  }

  const inviter = matches.length === 1 &&
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

  safeSave(saveDb, 'Invite join');

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
      safeSave(saveDb, 'Invite verification');
      return false;
    }

    const inviter = pending.inviter;

    if (!inviter || inviter === member.id) {
      safeSave(saveDb, 'Invite verification');
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
    safeSave(saveDb, 'Invite credit');

    await logTo(member.guild, CONFIG.inviteLogChannel, {
      embeds: [
        embed(
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

  const e = embed(
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

// ======================================================
// VERIFICATION AND WELCOME
// ======================================================

async function verifyMember(i) {
  if (!await defer(i)) return;

  const guild = i.guild;
  if (!idConfigured('VERIFY_ROLE_ID')) return respond(i, '❌ VERIFY_ROLE_ID is missing or invalid in Railway Variables.');
  const member = await guild.members.fetch(i.user.id);
  const role = await guild.roles
    .fetch(CONFIG.verifyRole || '0')
    .catch(() => null);

  const bot = await guild.members.fetchMe();

  if (!role) {
    return respond(i, '❌ Verification role not found. Check VERIFY_ROLE_ID.');
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

  try {
    await creditVerifiedInvite(member);
  } catch (error) {
    logError('Invite credit after verification failed:', error.message);
  }

  await logTo(guild, CONFIG.verifyLogChannel, {
    embeds: [
      embed(
        '🔐 MEMBER VERIFIED',
        `**Member:** <@${member.id}>\n**Role:** <@&${role.id}>`
      )
    ]
  });
}

async function welcomeMember(member) {
  let channel = await getChannel(
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

  const timestamp = Math.floor(Date.now() / 1000);
  const memberIndex = member.guild.memberCount.toLocaleString('en-US');
  if (displayV2Available) {
    const container = new ContainerBuilder()
      .setAccentColor(CONFIG.purple)
      .addTextDisplayComponents(t => t.setContent('## 👋  Ryvora Shop™ × WELCOME'))
      .addSeparatorComponents(s => s.setDivider(true))
      .addTextDisplayComponents(t => t.setContent(`┃  **HI ${member} — welcome to Ryvora Shop!**`))
      .addSeparatorComponents(s => s.setDivider(true))
      .addTextDisplayComponents(t => t.setContent(`┃  You are member **#${memberIndex}**`))
      .addSeparatorComponents(s => s.setDivider(true))
      .addTextDisplayComponents(t => t.setContent('┃  Enjoy your stay and explore the community.'))
      .addSeparatorComponents(s => s.setDivider(true))
      .addTextDisplayComponents(t => t.setContent('┃  Need help? Open a ticket through our support panel.'))
      .addSeparatorComponents(s => s.setDivider(true))
      .addTextDisplayComponents(t => t.setContent(`🗓️ <t:${timestamp}:F>  •  <t:${timestamp}:R>`));

    const files = v2Media(container, 'WELCOME', IMAGES.welcome);
    await channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
      files,
      allowedMentions: { users: [member.id], parse: [] }
    });
    return true;
  }

  const e = embed(
    '👋  Ryvora Shop™ × WELCOME',
    `┃  **HI ${member} — welcome to Ryvora Shop!**\n\n` +
    `┃  You are member **#${memberIndex}**\n\n` +
    '┃  Enjoy your stay and explore the community.\n\n' +
    '┃  Need help? Open a ticket through our support panel.\n\n' +
    `🗓️  <t:${timestamp}:F>  •  <t:${timestamp}:R>`
  ).setThumbnail(member.user.displayAvatarURL({ size: 256 }));
  await channel.send({
    embeds: [e],
    files: imageFor(e, 'WELCOME', IMAGES.welcome),
    allowedMentions: { users: [member.id], parse: [] }
  });

  return true;
}

// ======================================================
// GIVEAWAYS
// ======================================================

function leaderboardEmbed() {
  const top = ranking().slice(0, 10);

  return embed(
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
    return embed('🎁 RYVORA • GIVEAWAY', 'No competition has been created.');
  }

  const top = ranking().slice(0, 3);

  const status = competitionActive()
    ? `⏰ Ends <t:${Math.floor(competition.endsAt / 1000)}:R>`
    : '🔒 Competition ended';

  return embed(
    '🎉 RYVORA • INVITE COMPETITION',
    '## INVITE FRIENDS & WIN!\n\n' +
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
  if (!isAdmin(i)) return respond(i, '❌ Administrator only.');

  if (db.competition?.active) {
    return respond(i, '❌ End the current competition first.');
  }

  const channel =
    i.options.getChannel('channel') ||
    await getChannel(i.guild, CONFIG.giveawayChannel) ||
    i.channel;

  if (!channel || typeof channel.send !== 'function') {
    return respond(i, '❌ Invalid giveaway channel.');
  }

  let invites;

  try {
    invites = await snapshotInvites(i.guild);
  } catch {
    return respond(i, '❌ Bot requires Manage Server to track invites.');
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

  const e = embed(
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

  safeSave(saveDb, 'Giveaway start');

  await audit(i.guild, 'giveaway', 'GIVEAWAY STARTED', [
    ['Prize', prize], ['Duration (days)', days], ['By', `<@${i.user.id}>`]
  ]);
  return respond(i, `✅ Competition started in ${channel}.`);
}

async function endGiveaway(guild) {
  if (!db.competition?.active) return false;

  db.competition.active = false;
  safeSave(saveDb, 'Giveaway end');

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

  await audit(guild, 'giveaway', 'GIVEAWAY ENDED', [
    ['Prize', db.competition.prize], ['Participants', ranking().length]
  ]);
  await logTo(guild, db.competition.channelId, {
    embeds: [
      embed('🏆 RYVORA • COMPETITION ENDED', description)
    ]
  });

  return true;
}

async function refreshGiveaway(guild) {
  const competition = db.competition;

  if (!competitionActive() || !competition.messageId) return;

  const channel = await getChannel(
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

// ======================================================
// SLASH COMMANDS
// ======================================================

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

// ======================================================
// HEALTH CHECKS
// ======================================================

async function healthEmbed(guild) {
  const bot = await guild.members.fetchMe();

  const role = await guild.roles
    .fetch(CONFIG.verifyRole || '0')
    .catch(() => null);

  const category = await guild.channels
    .fetch(CONFIG.ticketCategory || '0')
    .catch(() => null);

  const staffRole = await guild.roles
    .fetch(CONFIG.staffRole || '0')
    .catch(() => null);

  const checks = [
    ['TICKET_CATEGORY_ID variable', idConfigured('TICKET_CATEGORY_ID')],
    ['STAFF_ROLE_ID variable', idConfigured('STAFF_ROLE_ID')],
    ['VERIFY_ROLE_ID variable', idConfigured('VERIFY_ROLE_ID')],
    ['Ticket category', category?.type === ChannelType.GuildCategory],
    ['Staff role', Boolean(staffRole)],
    ['Verify role', Boolean(role)],
    ['Manage Channels', bot.permissions.has(P.ManageChannels)],
    ['Manage Roles', bot.permissions.has(P.ManageRoles)],
    ['Verify role below bot', Boolean(role) &&
      bot.roles.highest.position > role.position],
    ['Manage Server', bot.permissions.has(P.ManageGuild)],
    ['Storage directory', fs.existsSync(DATA_DIR)]
  ];

  return embed(
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

  return embed(
    '🖼️ RYVORA • IMAGE HEALTH',
    `**Local images:** ${found}/${results.length}\n\n` +
    results.map(item =>
      `${item.exists ? '✅' : item.fallback ? '⚠️' : '❌'} ` +
      `\`${item.filename}\``
    ).join('\n') +
    '\n\n✅ Local file\n⚠️ URL fallback only\n❌ Missing'
  );
}

// ======================================================
// GUILD EVENTS
// ======================================================

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
    const info = await queueInvite(() => trackJoin(member));
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

  try {
    await queueInvite(async () => {
      delete db.pending[member.id];

      for (const stats of Object.values(db.members)) {
        const index = stats.joins?.indexOf(member.id) ?? -1;

        if (index >= 0) {
          stats.joins.splice(index, 1);
          stats.invites = stats.joins.length;
        }
      }

      safeSave(saveDb, 'Member leave');
    });
  } catch (error) {
    logError('Member removal error:', error.message);
  }
});

// ======================================================
// INTERACTION ROUTER
// ======================================================

const processing = new Set();

client.on(Events.InteractionCreate, async i => {
  if (!i.inGuild() || i.guildId !== CONFIG.guildId) return;

  if (processing.has(i.id)) return;
  processing.add(i.id);

  try {
    if (i.isChatInputCommand()) {
      safeEvent(audit(i.guild, 'command', 'SLASH COMMAND USED', [
        ['Command', `/${i.commandName}`],
        ['User', `<@${i.user.id}>`],
        ['Channel', `<#${i.channelId}>`]
      ]));
      const name = i.commandName;

      if (name === 'setup' || name === 'verify') {
        if (!await defer(i)) return;
        if (!isAdmin(i)) return respond(i, '❌ Administrator only.');

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
        return respond(i, catalogPanel());
      }

      if (name === 'welcome-test') {
        if (!await defer(i)) return;
        if (!isAdmin(i)) return respond(i, '❌ Administrator only.');

        const member = await i.guild.members.fetch(i.user.id);
        const sent = await welcomeMember(member);

        return respond(
          i,
          sent ? '✅ Welcome message posted.' : '❌ Welcome channel not found.'
        );
      }

      if (name === 'invite-start') {
        return startGiveaway(i);
      }

      if (name === 'invite-end') {
        if (!await defer(i)) return;
        if (!isAdmin(i)) return respond(i, '❌ Administrator only.');

        const ended = await endGiveaway(i.guild);

        return respond(
          i,
          ended ? '✅ Competition ended.' : '❌ No active competition.'
        );
      }

      if (name === 'invite-top') {
        const e = leaderboardEmbed();

        return respond(i, {
          embeds: [e],
          files: imageFor(e, 'LEADERBOARD', IMAGES.leaderboard)
        });
      }

      if (name === 'invites') {
        const user = i.options.getUser('user') || i.user;
        const count = db.members[user.id]?.joins?.length || 0;

        return respond(i, {
          embeds: [
            embed(
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
            embed(
              '💜 RYVORA • SYSTEM STATUS',
              '🟢 **Connected**\n' +
              `🎫 Tickets: ${Object.keys(state.tickets).length}\n` +
              `🛒 Products: ${PRODUCTS.length}\n` +
              `🏆 Competition: ${
                competitionActive() ? 'Active' : 'Inactive'
              }\n` +
              `📨 Unknown joins: ${db.unknownJoins}\n` +
              `🖼️ Images: ${
                imageHealth().filter(item => item.exists).length
              }/${allImages().length}\n` +
              `💾 Storage: ${DATA_DIR}\n` +
              `⏱️ Uptime: ${Math.floor(process.uptime() / 60)} min`
            )
          ]
        });
      }

      if (name === 'ryvora-health') {
        if (!await defer(i)) return;
        if (!isAdmin(i)) return respond(i, '❌ Administrator only.');

        return respond(i, {
          embeds: [await healthEmbed(i.guild)]
        });
      }

      if (name === 'ryvora-images') {
        if (!isAdmin(i)) return respond(i, '❌ Administrator only.');

        return respond(i, {
          embeds: [imageHealthEmbed()]
        });
      }

      if (name === 'ryvora-image-test') {
        if (!await defer(i)) return;
        if (!isAdmin(i)) return respond(i, '❌ Administrator only.');

        const requested = i.options
          .getString('image', true)
          .trim()
          .toLowerCase();

        const filename = `${requested}.png`;

        const entry = allImages().find(
          item => item.filename === filename
        );

        if (!entry) {
          return respond(i, '❌ Unknown image. Use /ryvora-images.');
        }

        const e = embed(
          '🖼️ RYVORA • IMAGE TEST',
          `Testing \`${entry.filename}\``
        );

        const files = imageFor(e, entry.key, entry.filename);

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

        if (!isAdmin(i) || !isTicket(i.channel)) {
          return respond(i, '❌ Administrator ticket only.');
        }

        const user = i.options.getUser('user', true);

        await i.channel.permissionOverwrites.edit(user.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          AttachFiles: true
        });

        await audit(i.guild, 'ticket', 'TICKET MEMBER ADDED', [
          ['Member', `<@${user.id}>`], ['By', `<@${i.user.id}>`],
          ['Ticket', i.channel.name]
        ]);
        return respond(i, `✅ Added <@${user.id}> to this ticket.`);
      }

      const product = productByKey.get(name);

      if (product) {
        if (!await defer(i)) return;

        if (!isManager(i)) {
          return respond(i, '❌ Manage Server permission required.');
        }

        await i.channel.send({
          ...productCard(product),
          allowedMentions: { parse: [] }
        });

        return respond(i, `✅ ${product.title} product card posted.`);
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

    if (i.isUserSelectMenu() && i.customId.startsWith('ryvora_admin_user:')) {
      return adminTicketUser(i);
    }
    if (i.isStringSelectMenu()) {
      if (i.customId === 'ryvora_admin_tools') return adminTicketTool(i);
      if (i.customId === 'ryvora_verify_select') {
        if (i.values[0] !== 'verify') return respond(i, 'Invalid verification option.');
        return verifyMember(i);
      }

      if (i.customId === 'ryvora_ticket_category') {
        return createTicket(i, i.values[0]);
      }

      if (i.customId === 'ryvora_catalog') {
        const product = productByKey.get(i.values[0]);

        if (!product) return respond(i, '❌ Product not found.');

        return respond(i, productCard(product));
      }
    }
  } catch (error) {
    logError(
      `Interaction error ${i.id}:`,
      error.stack || error.message
    );

    if ([10062, 40060].includes(error.code)) return;
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
  if (fields.length) e.addFields(fields.map(([name, value]) => ({
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
client.on(Events.ChannelDelete, c => {
  if (state.tickets[c.id]) { delete state.tickets[c.id]; safeSave(saveState, 'Ticket channel removal'); }
});
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

// ======================================================
// RYVORA SECURITY V6 — native moderation and audit protection
// ======================================================
const SECURITY = {
  logChannel: envId('ANTI_NUKE_LOG_CHANNEL_ID') || CONFIG.securityLogChannel,
  exempt: new Set((process.env.SECURITY_TRUSTED_IDS || '').split(',').map(x => x.trim()).filter(x => /^\d{17,20}$/.test(x))),
  linksAllowed: new Set((process.env.SECURITY_ALLOWED_DOMAINS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean)),
  actions: new Map(), messages: new Map(), joins: [],
  destructive: new Map([
    [AuditLogEvent.ChannelDelete, ['Channel deletion', 2]],
    [AuditLogEvent.RoleDelete, ['Role deletion', 2]],
    [AuditLogEvent.WebhookCreate, ['Webhook created', 3]],
    [AuditLogEvent.BotAdd, ['Bot added', 1]],
    [AuditLogEvent.RoleUpdate, ['Role permissions changed', 4]],
    [AuditLogEvent.ChannelUpdate, ['Channel updated', 6]],
    [AuditLogEvent.MemberBanAdd, ['Member banned', 4]],
    [AuditLogEvent.MemberKick, ['Member kicked', 4]]
  ])
};
function securityTrusted(guild, id) {
  return !id || id === guild.ownerId || id === client.user?.id || SECURITY.exempt.has(id);
}
async function securityNotice(guild, title, detail, color = CONFIG.red) {
  log('[SECURITY]', title, detail);
  const e = embed(`🛡️ RYVORA SECURITY | ${title}`, String(detail).slice(0, 3800), color);
  await logTo(guild, SECURITY.logChannel, {embeds:[e]});
}
async function securityBan(guild, id, reason) {
  if (securityTrusted(guild, id)) return 'exempt';
  const me = await guild.members.fetchMe();
  const target = await guild.members.fetch(id).catch(() => null);
  if (!me.permissions.has(P.BanMembers)) return 'missing Ban Members permission';
  if (target && !target.bannable) return 'cannot ban (role hierarchy / permissions)';
  try { await guild.members.ban(id, {reason:reason.slice(0, 450), deleteMessageSeconds:0}); return 'banned'; }
  catch (err) { return `ban failed: ${err.message}`; }
}
function securityWindow(map, key, duration) {
  const now = Date.now();
  const recent = (map.get(key) || []).filter(time => now - time < duration);
  recent.push(now);
  map.set(key, recent);
  if (map.size > 15000) for (const [k,v] of map) if (v.every(t => now-t>duration)) map.delete(k);
  return recent.length;
}
client.on(Events.GuildAuditLogEntryCreate, (entry, guild) => safeEvent((async () => {
  if (!auditGuild(guild) || !SECURITY.destructive.has(entry.action)) return;
  const executorId = entry.executorId;
  if (securityTrusted(guild, executorId)) return;
  const [label, limit] = SECURITY.destructive.get(entry.action);
  const count = securityWindow(SECURITY.actions, `${guild.id}:${executorId}:${entry.action}`, 12000);
  // Bot additions are always unauthorized unless the executor is explicitly trusted.
  if (entry.action === AuditLogEvent.BotAdd) {
    const botId = entry.targetId;
    let result = 'Bot not found';
    const member = botId && await guild.members.fetch(botId).catch(() => null);
    if (member?.user.bot) {
      try { if (member.kickable) { await member.kick('Ryvora Security: unauthorized bot'); result='Bot removed'; }
        else result='Cannot kick bot (role hierarchy)'; }
      catch (err) { result=`Bot removal failed: ${err.message}`; }
    }
    const punishment = await securityBan(guild, executorId, 'Ryvora Security: unauthorized bot addition');
    return securityNotice(guild, 'UNAUTHORIZED BOT', `Executor: <@${executorId}>\nBot: ${botId}\nResponse: ${result}\nExecutor: ${punishment}`);
  }
  if (count < limit) return;
  const guardKey = `${guild.id}:${executorId}`;
  if (SECURITY.actions.get(`punished:${guardKey}`)?.[0] > Date.now()-60000) return;
  SECURITY.actions.set(`punished:${guardKey}`, [Date.now()]);
  const punishment = await securityBan(guild, executorId, `Ryvora Security: ${count} ${label} events in 12s`);
  await securityNotice(guild, 'ANTI-NUKE TRIGGERED', `Executor: <@${executorId}> (${executorId})\nAction: ${label}\nCount: ${count} in 12 seconds\nResponse: ${punishment}\nDeleted resources cannot be fully restored automatically.`);
})()));
const SECURITY_LINK = /(?:https?:\/\/|www\.|discord\.gg\/|discord(?:app)?\.com\/invite\/)[^\s<>]+/ig;
client.on(Events.MessageCreate, message => safeEvent((async () => {
  if (!auditGuild(message.guild) || message.author.bot || !message.member) return;
  if (securityTrusted(message.guild, message.author.id) || message.member.permissions.has(P.Administrator)) return;
  const key = `${message.guildId}:${message.author.id}`;
  const count = securityWindow(SECURITY.messages, key, 7000);
  const urls = [...message.content.matchAll(SECURITY_LINK)].map(m=>m[0]);
  const blocked = urls.some(url => {
    try { const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const host = new URL(normalized).hostname.toLowerCase();
      return ![...SECURITY.linksAllowed].some(allowed => host === allowed || host.endsWith(`.${allowed}`));
    } catch { return true; }
  });
  const mentionSpam = (message.mentions.users.size + message.mentions.roles.size) >= 6 || message.mentions.everyone;
  if (!blocked && count < 7 && !mentionSpam) return;
  if (message.deletable) await message.delete().catch(()=>{});
  let response = 'message deleted';
  if (count >= 10 || mentionSpam) {
    try { if (message.member.moderatable) { await message.member.timeout(10*60*1000, 'Ryvora Security: spam'); response += ', timed out 10m'; } }
    catch(err) { response += `, timeout failed: ${err.message}`; }
  }
  await securityNotice(message.guild, 'MESSAGE PROTECTION', `Member: <@${message.author.id}>\nChannel: <#${message.channelId}>\nReason: ${blocked?'blocked link':mentionSpam?'mass mentions':'message flood'}\nResponse: ${response}`, CONFIG.purple);
})()));
client.on(Events.GuildMemberAdd, member => safeEvent((async () => {
  if (!auditGuild(member.guild)) return;
  const now = Date.now();
  SECURITY.joins = SECURITY.joins.filter(t => now-t < 15000);
  SECURITY.joins.push(now);
  if (SECURITY.joins.length === 12) await securityNotice(member.guild, 'POSSIBLE JOIN RAID', '12 members joined within 15 seconds. Review Server Settings > Safety Setup and enable Discord AutoMod / verification.');
})()));

// ======================================================
// STARTUP
// ======================================================

let giveawayTimer = null;

client.once(Events.ClientReady, async () => {
  log(`Logged in as ${client.user.tag}`);
  log(`Storage directory: ${DATA_DIR}`);

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
    logError('Command registration failed:', error.stack || error.message);
  }

  await audit(guild, 'bot', 'BOT ONLINE', [
    ['Account', client.user.tag],
    ['Uptime', 'Just started'],
    ['Storage', DATA_DIR]
  ]);
  await initializeInvites(guild);

  const images = imageHealth();
  const found = images.filter(item => item.exists).length;

  log(`Local images: ${found}/${images.length}`);

  for (const item of images) {
    if (!item.exists) log(`Missing local image: ${item.filename}`);
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
      logError('Giveaway update failed:', error.message);
    }
  };

  await tick();

  giveawayTimer = setInterval(tick, 60000);

  log(`Products loaded: ${PRODUCTS.length}`);
  log(`Slash commands: ${commands.length}`);
  log('Ticket system:', idConfigured('TICKET_CATEGORY_ID') && idConfigured('STAFF_ROLE_ID') ? 'configured' : 'missing configuration');
  log('Verification system:', idConfigured('VERIFY_ROLE_ID') ? 'configured' : 'missing configuration');
  log('Invite system ready.');
  log('Image system ready.');
  log('All Ryvora systems initialized.');
});

// ======================================================
// ERROR HANDLING AND SHUTDOWN
// ======================================================

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

    if (giveawayTimer) clearInterval(giveawayTimer);

    client.destroy();
    process.exit(0);
  });
}

client.login(CONFIG.token).catch(error => {
  logError('Login failed:', error);
  process.exit(1);
});
