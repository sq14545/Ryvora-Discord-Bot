
require("dotenv").config();

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
  PermissionFlagsBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  MessageFlags
} = require("discord.js");

const fs = require("node:fs");
const path = require("node:path");

const CONFIG = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  ticketCategoryId: process.env.TICKET_CATEGORY_ID,
  staffRoleId: process.env.STAFF_ROLE_ID,
  verifyRoleId: process.env.VERIFY_ROLE_ID,
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID || "",
  giveawayChannelId: process.env.GIVEAWAY_CHANNEL_ID || "",
  inviteLogChannelId: process.env.INVITE_LOG_CHANNEL_ID || "",
  ticketLogChannelId: process.env.TICKET_LOG_CHANNEL_ID || "",
  verifyLogChannelId: process.env.VERIFY_LOG_CHANNEL_ID || "",
  brand: "RYVORA",
  fullName: "Ryvora - Ultimate Methods",
  color: 0x8B2CFF,
  success: 0x57F287,
  warning: 0xFEE75C,
  danger: 0xED4245
};

for (const key of [
  "DISCORD_TOKEN",
  "CLIENT_ID",
  "GUILD_ID",
  "TICKET_CATEGORY_ID",
  "STAFF_ROLE_ID",
  "VERIFY_ROLE_ID"
]) {
  if (!process.env[key]) {
    console.error(`[RYVORA] Missing ${key}`);
    process.exit(1);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const DATA_FILE = path.join(__dirname, "ryvora-invites.json");
const STATE_FILE = path.join(__dirname, "ryvora-state.json");

const DAY = 86400000;
const log = (...args) => console.log("[RYVORA]", ...args);
const errorLog = (...args) => console.error("[RYVORA]", ...args);

// =====================================================
// IMAGES
// =====================================================

const IMAGES = {
  ticket: "ticket.png",
  verify: "verify.png",
  welcome: "welcome.png",
  giveaway: "giveaway.png",
  leaderboard: "leaderboard.png",
  inviteLog: "invite-log.png",

  ticketPurchase: "ticket-purchase.png",
  ticketPreSale: "ticket-pre-sale.png",
  ticketSupport: "ticket-support.png",
  ticketHwid: "ticket-hwid.png",
  ticketMedia: "ticket-media.png",

  products: {
    perm_croofer: "perm-croofer.png",
    val_showcase: "val-showcase.png",
    val_color_aim: "val-color-aim.png",
    val_triggerbot: "val-triggerbot.png",
    val_unlock_all: "val-unlock-all.png",
    val_emu: "val-emu.png",
    fn_retract: "fn-retract.png",
    retract_showcase: "retract-showcase.png",
    rust_external: "rust-external.png",
    fivem_triggerbot: "fivem-triggerbot.png",
    nvidia_bypass: "nvidia-bypass.png",
    custom_cleaners: "custom-cleaners.png",
    tweaks: "tweaks.png",
    fortnite_accounts: "fortnite-accounts.png",
    fortnite_vbucks: "fortnite-vbucks.png"
  }
};

function attachImage(embed, imageKey, filename) {
  const envKey = `IMAGE_${imageKey.toUpperCase()}`;
  const url = process.env[envKey];

  if (url && /^https?:\/\//i.test(url)) {
    embed.setImage(url);
    return [];
  }

  const file = path.join(__dirname, "images", filename);

  if (!fs.existsSync(file)) return [];

  const attachmentName = path.basename(filename);

  embed.setImage(`attachment://${attachmentName}`);

  return [
    new AttachmentBuilder(file, {
      name: attachmentName
    })
  ];
}

// =====================================================
// PRODUCTS - ORIGINAL CATALOG
// =====================================================

const PRODUCTS = [
  {
    command: "perm_croofer",
    title: "Perm Serial Changer",
    description: "Permanent serial changer product information.",
    pricing: "• One Time Use → 24€\n• Unlimited Uses → **49€**"
  },
  {
    command: "val_showcase",
    title: "VAL Showcase",
    description: "Features and product information for VAL Showcase.",
    pricing: process.env.VAL_SHOWCASE_PRICING ||
      "Contact our team for pricing."
  },
  {
    command: "val_color_aim",
    title: "Val Colorbot",
    description: "Features and product information for Val Colorbot.",
    pricing: "• 1 Day → 10€\n• 1 Week → 24€\n• 1 Month → 40€\n• Lifetime → **168€**"
  },
  {
    command: "val_triggerbot",
    title: "Val Triggerbot",
    description: "Features and product information for Val Triggerbot.",
    pricing: "• 1 Day → 9€\n• 1 Week → 17€\n• 1 Month → 32€\n• Lifetime → **160€**"
  },
  {
    command: "val_unlock_all",
    title: "Val Unlock All",
    description: "Features and product information for Val Unlock All.",
    pricing: "• 1 Day → 13€\n• 1 Week → 23€\n• 1 Month → 42€\n• Lifetime → **163€**"
  },
  {
    command: "val_emu",
    title: "Val Emulator",
    description: "Features and product information for Val Emulator.",
    pricing: "• 3 Days → 43€\n• 1 Week → 64€\n• 1 Month → 105€\n• Lifetime → **250€**"
  },
  {
    command: "fn_retract",
    title: "FN Retract",
    description: "Features and product information for FN Retract.",
    pricing: "• 1 Day → 9€\n• 1 Week → 19€\n• 1 Month → 37€\n• Lifetime → **164€**"
  },
  {
    command: "retract_showcase",
    title: "Retract Showcase",
    description: "Features and product information for Retract Showcase.",
    pricing: process.env.RETRACT_SHOWCASE_PRICING ||
      "Contact our team for pricing."
  },
  {
    command: "rust_external",
    title: "Rust External",
    description: "Features and product information for Rust External.",
    pricing: "• 1 Day → 10€\n• 1 Week → 32€\n• 1 Month → 60€\n• Lifetime → **350€**"
  },
  {
    command: "fivem_triggerbot",
    title: "FiveM Triggerbot",
    description: "Features and product information for FiveM Triggerbot.",
    pricing: "• 1 Week → 10€\n• 1 Month → 27€\n• Lifetime → **100€**"
  },
  {
    command: "nvidia_bypass",
    title: "NVIDIA Bypass",
    description:
      "NVIDIA Bypass is intended for users who already have a hider and compatible NVIDIA stream-proof software.\n\n" +
      "It allows a regular black NVIDIA setting/profile to be used without appearing completely black in recordings.\n\n" +
      "This is not a bypass that makes cheats such as TZX or other cheats stream-proof.",
    pricing: "• NVIDIA Bypass → **$10**\n• NVIDIA Bypass + Mouse → **$15**"
  },
  {
    command: "custom_cleaners",
    title: "Custom Cleaners",
    description:
      "🧹 **Custom Cleaner Service**\n\n" +
      "Available products:\n" +
      "• TZX\n• GOSTH\n• TESTO\n• SKRIPTGG\n\n" +
      "Optional NVIDIA stream-proof service: $10.\n" +
      "Contact staff for compatibility and service details.",
    pricing: "• Price per cleaner → **$35**"
  },
  {
    command: "tweaks",
    title: "PC Optimization",
    description:
      "🚀 **Complete PC Optimization**\n\n" +
      "• BIOS Tuner\n" +
      "• Network Adapter Tuner\n" +
      "• Advanced Hardware Optimization\n" +
      "• High Priority Customer Support\n" +
      "• 20+ Advanced Features\n" +
      "• All Plus Features\n\n" +
      "Performance improvements depend on your hardware and configuration.",
    pricing:
      "• PC Optimization (One Time) → **$30**\n" +
      "• Re-PC Optimization (after a factory reset) → **$15**"
  },
  {
    command: "fortnite_accounts",
    title: "Fortnite Accounts",
    description:
      "Full-access account listings. Contact staff to confirm availability and ownership-transfer terms.\n\n" +
      "**Random Skin Accounts**\n" +
      "• 50+ Random Skins → **$7.99**\n" +
      "• 100+ Random Skins → **$11.99**\n" +
      "• 150+ Random Skins → **$24.00**\n" +
      "• 200+ Random Skins → **$27.00**\n\n" +
      "**Guaranteed Exclusives**\n" +
      "• IKONIK → $130\n" +
      "• Wildcat → $130\n" +
      "• Glow → $15\n" +
      "• Galaxy → $78\n" +
      "• Black Knight → $115\n" +
      "• Travis Scott → $60\n\n" +
      "**Other Accounts**\n" +
      "• PC/PSN/XBOX — 82 skins → **$55**\n" +
      "• PC/XBOX — 125 skins → **$85**\n" +
      "• PC/PSN — 108 skins → **$65**\n\n" +
      "Open a ticket for details.",
    pricing: "Prices are listed above."
  },
  {
    command: "fortnite_vbucks",
    title: "Fortnite V-Bucks",
    description: "Fortnite V-Bucks packages for PC Epic accounts.",
    pricing:
      "• PC - Epic → 4,500 V-Bucks → **$40**\n" +
      "• PC - Epic → 12,500 V-Bucks → **$80**"
  }
];

// =====================================================
// DATABASE
// =====================================================

function readJson(filename, fallback) {
  try {
    if (!fs.existsSync(filename)) return fallback;
    return JSON.parse(fs.readFileSync(filename, "utf8"));
  } catch (error) {
    errorLog("Database read error:", error);
    return fallback;
  }
}

function writeJson(filename, data) {
  const temp = filename + ".tmp";

  fs.writeFileSync(
    temp,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  fs.renameSync(temp, filename);
}

const defaultDatabase = () => ({
  competition: null,
  members: {},
  unknownJoins: 0
});

let database = {
  ...defaultDatabase(),
  ...readJson(DATA_FILE, defaultDatabase())
};

database.members ||= {};

let state = {
  tickets: {},
  ...readJson(STATE_FILE, {})
};

state.tickets ||= {};

function saveDatabase() {
  writeJson(DATA_FILE, database);
}

function saveState() {
  writeJson(STATE_FILE, state);
}

function memberStats(id) {
  database.members[id] ||= {
    invites: 0,
    joins: []
  };

  return database.members[id];
}

function baseEmbed(title, description, color = CONFIG.color) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({
      text: `${CONFIG.fullName} • Official Server`
    })
    .setTimestamp();
}

function isAdmin(interaction) {
  return interaction.memberPermissions?.has(
    PermissionFlagsBits.Administrator
  ) || false;
}

function isStaff(interaction) {
  return isAdmin(interaction) ||
    interaction.member?.roles?.cache?.has(CONFIG.staffRoleId) ||
    interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageChannels
    );
}

async function privateReply(interaction, content) {
  const payload = typeof content === "string"
    ? { content }
    : content;

  if (interaction.deferred) {
    return interaction.editReply(payload);
  }

  if (interaction.replied) {
    return interaction.followUp({
      ...payload,
      flags: MessageFlags.Ephemeral
    });
  }

  return interaction.reply({
    ...payload,
    flags: MessageFlags.Ephemeral
  });
}

async function sendLog(guild, channelId, payload) {
  if (!channelId) return;

  const channel = await guild.channels.fetch(channelId)
    .catch(() => null);

  if (!channel?.isTextBased()) return;

  await channel.send({
    ...payload,
    allowedMentions: { parse: [] }
  }).catch(error => errorLog("Log delivery failed:", error));
}

// =====================================================
// TICKET SYSTEM
// =====================================================

const TICKET_CATEGORIES = {
  purchase: {
    title: "Purchase",
    emoji: "🛒",
    description: "Purchase a product",
    image: IMAGES.ticketPurchase
  },
  pre_sale: {
    title: "Pre-Sale Question",
    emoji: "❓",
    description: "Ask before purchasing",
    image: IMAGES.ticketPreSale
  },
  support: {
    title: "Support",
    emoji: "🛠️",
    description: "General assistance",
    image: IMAGES.ticketSupport
  },
  hwid_reset: {
    title: "HWID Reset",
    emoji: "🔑",
    description: "Request an HWID reset",
    image: IMAGES.ticketHwid
  },
  media_reseller: {
    title: "Media / Reseller",
    emoji: "📦",
    description: "Partnership inquiries",
    image: IMAGES.ticketMedia
  }
};

function ticketPanel() {
  const embed = baseEmbed(
    "🎫 RYVORA • SUPPORT CENTER",
    "## PREMIUM SUPPORT\n\n" +
    "Welcome to our official support center.\n\n" +
    "🛒 **Purchase** — Place an order\n" +
    "❓ **Pre-Sale** — Product questions\n" +
    "🛠️ **Support** — Technical assistance\n" +
    "🔑 **HWID Reset** — Reset requests\n" +
    "📦 **Media / Reseller** — Partnerships\n\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "💜 Select your category to create a private ticket."
  );

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ryvora_ticket_category")
    .setPlaceholder("✦ Select a support category")
    .addOptions(
      Object.entries(TICKET_CATEGORIES).map(([value, item]) => ({
        label: item.title,
        value,
        description: item.description,
        emoji: item.emoji
      }))
    );

  return {
    embed,
    components: [
      new ActionRowBuilder().addComponents(menu)
    ]
  };
}

function ticketButtons(claimed = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ryvora_claim_ticket")
        .setLabel(claimed ? "Claimed" : "Claim Ticket")
        .setEmoji("🙋")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(claimed),

      new ButtonBuilder()
        .setCustomId("ryvora_close_ticket")
        .setLabel("Close Ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

const ticketLocks = new Set();

async function createTicket(interaction, categoryKey, productKey = null) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  const category = TICKET_CATEGORIES[categoryKey];

  if (!category) {
    return interaction.editReply("❌ Invalid ticket category.");
  }

  const guild = interaction.guild;
  const lockKey = `${guild.id}:${interaction.user.id}`;

  if (ticketLocks.has(lockKey)) {
    return interaction.editReply("⏳ Your ticket is being created.");
  }

  ticketLocks.add(lockKey);

  try {
    const parent = await guild.channels
      .fetch(CONFIG.ticketCategoryId)
      .catch(() => null);

    if (parent?.type !== ChannelType.GuildCategory) {
      return interaction.editReply(
        "❌ Ticket category is not configured correctly."
      );
    }

    const bot = await guild.members.fetchMe();

    if (!bot.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.editReply(
        "❌ Bot requires Manage Channels permission."
      );
    }

    const staffRole = await guild.roles
      .fetch(CONFIG.staffRoleId)
      .catch(() => null);

    if (!staffRole) {
      return interaction.editReply("❌ Staff role not found.");
    }

    await guild.channels.fetch();

    const existing = guild.channels.cache.find(channel =>
      channel.type === ChannelType.GuildText &&
      channel.parentId === CONFIG.ticketCategoryId &&
      channel.topic?.startsWith(
        `ticket-owner:${interaction.user.id}`
      )
    );

    if (existing) {
      return interaction.editReply(
        `⚠️ You already have a ticket: ${existing}`
      );
    }

    const channel = await guild.channels.create({
      name: `ticket-${categoryKey}-${interaction.user.id}`,
      type: ChannelType.GuildText,
      parent: CONFIG.ticketCategoryId,
      topic: `ticket-owner:${interaction.user.id}|category:${categoryKey}`,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ]
        },
        {
          id: CONFIG.staffRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ]
        },
        {
          id: client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels
          ]
        }
      ]
    });

    const product = PRODUCTS.find(p => p.command === productKey);

    state.tickets[channel.id] = {
      ownerId: interaction.user.id,
      category: categoryKey,
      product: productKey,
      claimedBy: null,
      createdAt: Date.now()
    };

    saveState();

    const embed = baseEmbed(
      `${category.emoji} RYVORA • ${category.title}`,
      `Welcome <@${interaction.user.id}>!\n\n` +
      `**Category:** ${category.title}\n` +
      (product ? `**Product:** ${product.title}\n` : "") +
      "\nPlease describe your request clearly.\n\n" +
      "Our support team will assist you.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "🔒 Use the buttons below to manage this ticket."
    );

    const imageKey = `TICKET_${categoryKey.toUpperCase()}`;

    const files = attachImage(
      embed,
      imageKey,
      category.image
    );

    await channel.send({
      content: `<@${interaction.user.id}> <@&${CONFIG.staffRoleId}>`,
      embeds: [embed],
      components: ticketButtons(),
      files,
      allowedMentions: {
        users: [interaction.user.id],
        roles: [CONFIG.staffRoleId]
      }
    });

    await interaction.editReply({
      content: `✅ Your ticket has been created: ${channel}`
    });

    await sendLog(guild, CONFIG.ticketLogChannelId, {
      embeds: [
        baseEmbed(
          "🎫 RYVORA • TICKET CREATED",
          `**Owner:** <@${interaction.user.id}>\n` +
          `**Category:** ${category.title}\n` +
          `**Channel:** ${channel}`
        )
      ]
    });

  } finally {
    ticketLocks.delete(lockKey);
  }
}

function ticketOwnerId(channel) {
  return channel?.topic?.match(/ticket-owner:(\d+)/)?.[1] || null;
}

async function claimTicket(interaction) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  if (!isStaff(interaction)) {
    return interaction.editReply("❌ Staff only.");
  }

  const channel = interaction.channel;
  const ownerId = ticketOwnerId(channel);

  if (!ownerId || channel.parentId !== CONFIG.ticketCategoryId) {
    return interaction.editReply("❌ Invalid ticket.");
  }

  const ticket = state.tickets[channel.id] || {
    ownerId,
    category: "support",
    claimedBy: null,
    createdAt: Date.now()
  };

  if (ticket.claimedBy) {
    return interaction.editReply(
      `⚠️ Already claimed by <@${ticket.claimedBy}>.`
    );
  }

  ticket.claimedBy = interaction.user.id;
  state.tickets[channel.id] = ticket;
  saveState();

  await interaction.message.edit({
    components: ticketButtons(true)
  });

  await channel.send({
    embeds: [
      baseEmbed(
        "💜 RYVORA • STAFF ASSIGNED",
        `🙋 <@${interaction.user.id}> has claimed this ticket.`
      )
    ],
    allowedMentions: { parse: [] }
  });

  await interaction.editReply("✅ Ticket claimed successfully.");
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
    `RYVORA TICKET TRANSCRIPT`,
    `Channel: ${channel.name}`,
    `Channel ID: ${channel.id}`,
    `Generated: ${new Date().toISOString()}`,
    `Messages captured: ${messages.length}`,
    "-----------------------------------------"
  ];

  for (const message of messages) {
    const timestamp = new Date(message.createdTimestamp)
      .toISOString();

    lines.push(
      `[${timestamp}] ${message.author.tag} (${message.author.id})`
    );

    if (message.content) {
      lines.push(message.content);
    }

    for (const attachment of message.attachments.values()) {
      lines.push(`Attachment: ${attachment.url}`);
    }

    lines.push("");
  }

  const buffer = Buffer.from(lines.join("\n"), "utf8");

  if (buffer.length > 7 * 1024 * 1024) {
    return null;
  }

  return new AttachmentBuilder(buffer, {
    name: `ryvora-ticket-${channel.id}.txt`
  });
}

async function closeTicket(interaction) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  const channel = interaction.channel;
  const ownerId = ticketOwnerId(channel);

  if (
    !ownerId ||
    channel.parentId !== CONFIG.ticketCategoryId
  ) {
    return interaction.editReply("❌ Invalid ticket.");
  }

  if (interaction.user.id !== ownerId && !isStaff(interaction)) {
    return interaction.editReply(
      "❌ Only the ticket owner or staff can close this ticket."
    );
  }

  if (ticketLocks.has(channel.id)) {
    return interaction.editReply("⏳ Ticket is already closing.");
  }

  ticketLocks.add(channel.id);

  try {
    await interaction.editReply(
      "🔒 Closing ticket and saving transcript..."
    );

    let transcript = null;

    try {
      transcript = await createTranscript(channel);
    } catch (error) {
      errorLog("Transcript generation failed:", error);
    }

    const ticket = state.tickets[channel.id];

    await sendLog(interaction.guild, CONFIG.ticketLogChannelId, {
      embeds: [
        baseEmbed(
          "🔒 RYVORA • TICKET CLOSED",
          `**Channel:** ${channel.name}\n` +
          `**Owner:** <@${ownerId}>\n` +
          `**Closed By:** <@${interaction.user.id}>\n` +
          `**Category:** ${ticket?.category || "Unknown"}\n` +
          `**Claimed By:** ${
            ticket?.claimedBy
              ? `<@${ticket.claimedBy}>`
              : "Not claimed"
          }`
        )
      ],
      files: transcript ? [transcript] : []
    });

    await channel.delete(
      `Ticket closed by ${interaction.user.tag}`
    );

    delete state.tickets[channel.id];
    saveState();

  } finally {
    ticketLocks.delete(channel.id);
  }
}

// =====================================================
// VERIFICATION
// =====================================================

function verifyPanel() {
  return baseEmbed(
    "🔐 RYVORA • VERIFICATION",
    "## WELCOME TO RYVORA\n\n" +
    "Unlock access to our community in seconds.\n\n" +
    "✦ Read the server rules.\n" +
    "✦ Click the button below.\n" +
    "✦ Receive your verified role.\n\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "💜 Click **Verify & Unlock** to continue."
  );
}

async function verifyMember(interaction) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  const guild = interaction.guild;
  const member = await guild.members.fetch(interaction.user.id);
  const role = await guild.roles.fetch(CONFIG.verifyRoleId);
  const bot = await guild.members.fetchMe();

  if (!role) {
    return interaction.editReply("❌ Verify role not found.");
  }

  if (!bot.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.editReply("❌ Bot needs Manage Roles.");
  }

  if (bot.roles.highest.position <= role.position) {
    return interaction.editReply(
      "❌ Move the bot role above the Verify role."
    );
  }

  if (member.roles.cache.has(role.id)) {
    return interaction.editReply("💜 You are already verified!");
  }

  await member.roles.add(role, "Ryvora verification");

  await interaction.editReply(
    "✅ **Verification Successful!** Welcome to Ryvora! 💜"
  );

  await sendLog(guild, CONFIG.verifyLogChannelId, {
    embeds: [
      baseEmbed(
        "🔐 RYVORA • MEMBER VERIFIED",
        `**Member:** <@${member.id}>\n` +
        `**Role:** <@&${role.id}>`
      )
    ]
  });
}

// =====================================================
// WELCOME
// =====================================================

async function getWelcomeChannel(guild) {
  if (CONFIG.welcomeChannelId) {
    const channel = await guild.channels
      .fetch(CONFIG.welcomeChannelId)
      .catch(() => null);

    if (channel?.isTextBased()) return channel;
  }

  await guild.channels.fetch();

  return guild.channels.cache.find(channel =>
    channel.type === ChannelType.GuildText &&
    ["welcome", "welcomes", "welcome-members"]
      .some(name => channel.name.toLowerCase().includes(name))
  );
}

async function sendWelcome(member) {
  const channel = await getWelcomeChannel(member.guild);

  if (!channel) return false;

  const embed = baseEmbed(
    "💜 RYVORA • WELCOME",
    `## WELCOME TO RYVORA!\n\n` +
    `Hey ${member}! 👋\n\n` +
    `Welcome to **${CONFIG.fullName}**.\n\n` +
    "🔐 **Verify** — Unlock the server\n" +
    "🎫 **Support** — Open a private ticket\n" +
    "🛒 **Products** — Explore our catalog\n" +
    "🎉 **Giveaways** — Join competitions\n\n" +
    `👥 **Member #${member.guild.memberCount}**`
  ).setThumbnail(
    member.user.displayAvatarURL({ size: 256 })
  );

  const files = attachImage(embed, "WELCOME", IMAGES.welcome);

  await channel.send({
    content: `💜 Welcome ${member}!`,
    embeds: [embed],
    files,
    allowedMentions: {
      users: [member.id],
      parse: []
    }
  });

  return true;
}

// =====================================================
// INVITE TRACKING
// =====================================================

const inviteCache = new Map();
let inviteQueue = Promise.resolve();

function queueInviteOperation(operation) {
  const result = inviteQueue.then(operation);

  inviteQueue = result.catch(error => {
    errorLog("Invite queue failed:", error);
  });

  return result;
}

async function fetchInviteSnapshot(guild) {
  const invites = await guild.invites.fetch();

  return new Map(
    invites.map(invite => [
      invite.code,
      {
        uses: invite.uses || 0,
        inviterId: invite.inviterId || invite.inviter?.id || null
      }
    ])
  );
}

async function initializeInvites(guild) {
  try {
    const snapshot = await fetchInviteSnapshot(guild);
    inviteCache.set(guild.id, snapshot);
    log(`Invite tracking initialized: ${snapshot.size} links.`);
  } catch (error) {
    errorLog("Invite initialization failed:", error);
  }
}

function competitionActive() {
  return Boolean(
    database.competition?.active &&
    Date.now() < database.competition.endsAt
  );
}

function getLeaderboard() {
  return Object.entries(database.members)
    .map(([id, stats]) => ({
      id,
      invites: stats.invites || 0
    }))
    .filter(item => item.invites > 0)
    .sort((a, b) =>
      b.invites - a.invites || a.id.localeCompare(b.id)
    );
}

async function trackMemberJoin(member) {
  const guild = member.guild;
  const previous = inviteCache.get(guild.id);

  let current;

  try {
    current = await fetchInviteSnapshot(guild);
  } catch (error) {
    errorLog("Invite fetch failed:", error);

    return {
      status: "unknown",
      inviterId: null
    };
  }

  inviteCache.set(guild.id, current);

  const unknown = () => {
    if (competitionActive()) {
      database.unknownJoins++;
      saveDatabase();
    }

    return {
      status: "unknown",
      inviterId: null
    };
  };

  if (!previous) return unknown();

  const candidates = [];

  for (const [code, invite] of current) {
    const old = previous.get(code);

    // Only compare links present in the previous snapshot.
    if (!old) continue;

    const difference = invite.uses - old.uses;

    if (difference > 0 && invite.inviterId) {
      candidates.push({
        code,
        inviterId: invite.inviterId,
        difference
      });
    }
  }

  if (
    candidates.length !== 1 ||
    candidates[0].difference !== 1
  ) {
    return unknown();
  }

  const inviterId = candidates[0].inviterId;

  if (member.user.bot) {
    return { status: "bot", inviterId };
  }

  if (inviterId === member.id) {
    return { status: "self", inviterId };
  }

  if (Date.now() - member.user.createdTimestamp < 7 * DAY) {
    return { status: "new_account", inviterId };
  }

  if (!competitionActive()) {
    return { status: "inactive", inviterId };
  }

  const duplicate = Object.values(database.members)
    .some(stats => stats.joins?.includes(member.id));

  if (duplicate) {
    return { status: "duplicate", inviterId };
  }

  const stats = memberStats(inviterId);

  stats.invites++;
  stats.joins.push(member.id);

  saveDatabase();

  log(`Invite credited: ${inviterId} -> ${member.id}`);

  return {
    status: "valid",
    inviterId,
    total: stats.invites
  };
}

async function sendInviteLog(member, result) {
  if (!CONFIG.inviteLogChannelId) return;

  const statuses = {
    valid: "✅ Valid Invite",
    bot: "❌ Bot Account",
    self: "❌ Self Invite",
    new_account: "❌ Account Under 7 Days Old",
    duplicate: "❌ Duplicate Invite",
    inactive: "ℹ️ No Active Competition",
    unknown: "⚠️ Could Not Verify Inviter"
  };

  const inviterId = result?.inviterId;
  const status = result?.status || "unknown";

  const embed = baseEmbed(
    "📨 RYVORA • NEW MEMBER INVITE",
    `👤 **Joined:** <@${member.id}>\n\n` +
    `📨 **Invited By:** ${
      inviterId ? `<@${inviterId}>` : "Unknown"
    }\n\n` +
    `🏆 **Valid Invites:** ${
      inviterId ? (database.members[inviterId]?.invites || 0) : 0
    }\n\n` +
    `📊 **Status:** ${statuses[status] || statuses.unknown}\n\n` +
    `🆔 **Member ID:** \`${member.id}\``,
    status === "valid" ? CONFIG.success : CONFIG.warning
  ).setThumbnail(member.user.displayAvatarURL());

  const files = attachImage(
    embed,
    "INVITE_LOG",
    IMAGES.inviteLog
  );

  await sendLog(member.guild, CONFIG.inviteLogChannelId, {
    embeds: [embed],
    files
  });
}

client.on(Events.InviteCreate, invite => {
  if (invite.guild?.id !== CONFIG.guildId) return;

  queueInviteOperation(async () => {
    const cache = inviteCache.get(invite.guild.id);

    if (cache) {
      cache.set(invite.code, {
        uses: invite.uses || 0,
        inviterId: invite.inviterId || invite.inviter?.id || null
      });
    } else {
      await initializeInvites(invite.guild);
    }
  }).catch(error => errorLog("InviteCreate failed:", error));
});

client.on(Events.InviteDelete, invite => {
  if (invite.guild?.id !== CONFIG.guildId) return;

  queueInviteOperation(async () => {
    inviteCache.get(invite.guild.id)?.delete(invite.code);
  }).catch(error => errorLog("InviteDelete failed:", error));
});

client.on(Events.GuildMemberAdd, async member => {
  if (member.guild.id !== CONFIG.guildId) return;

  try {
    const result = await queueInviteOperation(
      () => trackMemberJoin(member)
    );

    await sendInviteLog(member, result);
  } catch (error) {
    errorLog("Invite tracking failed:", error);
  }

  try {
    await sendWelcome(member);
  } catch (error) {
    errorLog("Welcome failed:", error);
  }
});

client.on(Events.GuildMemberRemove, async member => {
  if (member.guild.id !== CONFIG.guildId) return;

  let changed = false;

  for (const stats of Object.values(database.members)) {
    const index = stats.joins?.indexOf(member.id) ?? -1;

    if (index !== -1) {
      stats.joins.splice(index, 1);
      stats.invites = Math.max(0, stats.invites - 1);
      changed = true;
    }
  }

  if (changed) saveDatabase();
});

// =====================================================
// GIVEAWAYS
// =====================================================

function giveawayEmbed() {
  const competition = database.competition;

  if (!competition) {
    return baseEmbed(
      "🎁 RYVORA • INVITE GIVEAWAY",
      "There is no active competition."
    );
  }

  const top = getLeaderboard().slice(0, 3);

  const ranking = top.length
    ? top.map((item, index) =>
      `${["🥇", "🥈", "🥉"][index]} <@${item.id}> — **${item.invites}** invites`
    ).join("\n")
    : "No valid invites yet.";

  return baseEmbed(
    "🎉 RYVORA • INVITE COMPETITION",
    "## INVITE FRIENDS & WIN!\n\n" +
    "Invite the most valid members and win a prize!\n\n" +
    `🏆 **PRIZE**\n${competition.prize}\n\n` +
    `⏰ **ENDS**\n<t:${Math.floor(competition.endsAt / 1000)}:R>\n\n` +
    `📊 **LIVE LEADERBOARD**\n${ranking}\n\n` +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "📌 **RULES**\n" +
    "• Only valid invites count.\n" +
    "• Bot accounts do not count.\n" +
    "• Accounts must be at least 7 days old.\n" +
    "• Members must remain in the server.\n" +
    "• Fake invites are disqualified.\n" +
    "• Unverifiable invites are not credited.\n\n" +
    "💜 Good luck! — RYVORA"
  );
}

function leaderboardEmbed() {
  const leaderboard = getLeaderboard().slice(0, 10);

  return baseEmbed(
    "🏆 RYVORA • INVITE LEADERBOARD",
    leaderboard.length
      ? leaderboard.map((item, index) =>
        `**#${index + 1}** <@${item.id}> — **${item.invites}** invites`
      ).join("\n")
      : "No valid invites recorded yet."
  );
}

async function startCompetition(interaction) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  if (database.competition?.active) {
    return interaction.editReply(
      "❌ A competition is already active. End it first."
    );
  }

  const days = interaction.options.getInteger("days");
  const prize = interaction.options.getString("prize");
  const channel = interaction.options.getChannel("channel") ||
    interaction.channel;

  const snapshot = await fetchInviteSnapshot(interaction.guild)
    .catch(() => null);

  if (!snapshot) {
    return interaction.editReply(
      "❌ Bot requires Manage Server to track invites."
    );
  }

  inviteCache.set(interaction.guild.id, snapshot);

  database.members = {};
  database.unknownJoins = 0;

  database.competition = {
    active: true,
    prize,
    startsAt: Date.now(),
    endsAt: Date.now() + days * DAY,
    channelId: channel.id,
    messageId: null
  };

  saveDatabase();

  const embed = giveawayEmbed();
  const files = attachImage(embed, "GIVEAWAY", IMAGES.giveaway);

  const message = await channel.send({
    embeds: [embed],
    files,
    allowedMentions: { parse: [] }
  });

  database.competition.messageId = message.id;
  saveDatabase();

  await interaction.editReply(
    `✅ Competition started in ${channel}!`
  );
}

async function showInvites(interaction) {
  const user = interaction.options.getUser("user") ||
    interaction.user;

  const stats = database.members[user.id];

  return privateReply(interaction, {
    embeds: [
      baseEmbed(
        "📨 RYVORA • INVITE STATISTICS",
        `👤 **Member:** ${user}\n\n` +
        `🏆 **Valid Invites:** ${stats?.invites || 0}\n\n` +
        "Only valid competition invites are counted."
      )
    ]
  });
}

async function endCompetition(guild, automatic = false) {
  const competition = database.competition;

  if (!competition?.active) return false;

  competition.active = false;
  saveDatabase();

  const leaderboard = getLeaderboard();

  let description = "No valid entries. No winner selected.";

  if (leaderboard.length) {
    const score = leaderboard[0].invites;
    const winners = leaderboard.filter(item =>
      item.invites === score
    );

    if (winners.length > 1) {
      description =
        "⚠️ **TIE DETECTED**\n\n" +
        winners.map(item => `<@${item.id}>`).join("\n") +
        `\n\n**Valid Invites:** ${score}\n` +
        "Staff must resolve the tie manually.";
    } else {
      description =
        `🎉 **WINNER:** <@${winners[0].id}>\n\n` +
        `🏆 **Valid Invites:** ${score}\n\n` +
        `🎁 **Prize:** ${competition.prize}\n\n` +
        "Open a ticket to claim your prize.\n" +
        "Staff will verify the result before delivery.";
    }
  }

  const channel = await guild.channels
    .fetch(competition.channelId)
    .catch(() => null);

  if (channel?.isTextBased()) {
    await channel.send({
      embeds: [
        baseEmbed(
          "🏆 RYVORA • GIVEAWAY ENDED",
          description
        )
      ],
      allowedMentions: { parse: [] }
    });
  }

  log(`Competition ended (${automatic ? "automatic" : "manual"}).`);
  return true;
}

async function updateGiveawayMessage(guild) {
  const competition = database.competition;

  if (!competition?.active || !competition.messageId) return;

  const channel = await guild.channels
    .fetch(competition.channelId)
    .catch(() => null);

  if (!channel?.isTextBased()) return;

  const message = await channel.messages
    .fetch(competition.messageId)
    .catch(() => null);

  if (!message) return;

  const embed = giveawayEmbed();

  // Existing attachments remain attached to the message.
  const imageUrl = process.env.IMAGE_GIVEAWAY;

  if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
    embed.setImage(imageUrl);
  } else if (message.embeds[0]?.image?.url) {
    embed.setImage(message.embeds[0].image.url);
  }

  await message.edit({
    embeds: [embed],
    allowedMentions: { parse: [] }
  });
}

// =====================================================
// PRODUCT CARDS
// =====================================================

function productEmbed(product) {
  return baseEmbed(
    `✦ ${product.title}`,
    `${product.description}\n\n` +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    `💳 **PRICING**\n${product.pricing}\n\n` +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "🛒 **READY TO ORDER?**\n" +
    "Click the Purchase button below to open a private ticket."
  ).setAuthor({
    name: "RYVORA • PREMIUM PRODUCT CATALOG",
    iconURL: client.user.displayAvatarURL()
  });
}

async function postProduct(interaction, product) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  const embed = productEmbed(product);

  const files = attachImage(
    embed,
    `PRODUCT_${product.command.toUpperCase()}`,
    IMAGES.products[product.command]
  );

  const button = new ButtonBuilder()
    .setCustomId(`ryvora_buy:${product.command}`)
    .setLabel("Purchase / Open Ticket")
    .setEmoji("🛒")
    .setStyle(ButtonStyle.Primary);

  await interaction.channel.send({
    embeds: [embed],
    files,
    components: [
      new ActionRowBuilder().addComponents(button)
    ]
  });

  await interaction.editReply(
    `✅ ${product.title} product card posted.`
  );
}

// =====================================================
// SLASH COMMANDS
// =====================================================

const adminPermission = PermissionFlagsBits.Administrator;
const managePermission = PermissionFlagsBits.ManageGuild;

const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Post the Ryvora ticket panel")
    .setDefaultMemberPermissions(adminPermission),

  new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Post the verification panel")
    .setDefaultMemberPermissions(adminPermission),

  new SlashCommandBuilder()
    .setName("welcome-test")
    .setDescription("Test the welcome system")
    .setDefaultMemberPermissions(adminPermission),

  new SlashCommandBuilder()
    .setName("invite-start")
    .setDescription("Start an invite competition")
    .addIntegerOption(option =>
      option.setName("days")
        .setDescription("Competition duration")
        .setMinValue(1)
        .setMaxValue(30)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("prize")
        .setDescription("Competition prize")
        .setMaxLength(200)
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName("channel")
        .setDescription("Announcement channel")
        .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(adminPermission),

  new SlashCommandBuilder()
    .setName("invite-top")
    .setDescription("Show the invite leaderboard"),

  new SlashCommandBuilder()
    .setName("invites")
    .setDescription("Check valid invites")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Member to check")
    ),

  new SlashCommandBuilder()
    .setName("invite-end")
    .setDescription("End the invite competition")
    .setDefaultMemberPermissions(adminPermission),

  new SlashCommandBuilder()
    .setName("ryvora-status")
    .setDescription("Show Ryvora bot status")
    .setDefaultMemberPermissions(adminPermission),

  ...PRODUCTS.map(product =>
    new SlashCommandBuilder()
      .setName(product.command)
      .setDescription(`Post the ${product.title} product card`)
      .setDefaultMemberPermissions(managePermission)
  )
].map(command => command.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" })
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

// =====================================================
// PANELS
// =====================================================

async function sendPanel(interaction, type) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  if (type === "ticket") {
    const panel = ticketPanel();

    const files = attachImage(
      panel.embed,
      "TICKET",
      IMAGES.ticket
    );

    await interaction.channel.send({
      embeds: [panel.embed],
      components: panel.components,
      files
    });
  } else {
    const embed = verifyPanel();

    const files = attachImage(
      embed,
      "VERIFY",
      IMAGES.verify
    );

    const button = new ButtonBuilder()
      .setCustomId("ryvora_verify")
      .setLabel("Verify & Unlock")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success);

    await interaction.channel.send({
      embeds: [embed],
      files,
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  await interaction.editReply(
    `✅ ${type} panel posted successfully.`
  );
}

// =====================================================
// INTERACTIONS
// =====================================================

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (!interaction.guild ||
        interaction.guild.id !== CONFIG.guildId) return;

    if (interaction.isChatInputCommand()) {
      const name = interaction.commandName;

      if (name === "setup") {
        return sendPanel(interaction, "ticket");
      }

      if (name === "verify") {
        return sendPanel(interaction, "verify");
      }

      if (name === "welcome-test") {
        await interaction.deferReply({
          flags: MessageFlags.Ephemeral
        });

        const member = await interaction.guild.members.fetch(
          interaction.user.id
        );

        const sent = await sendWelcome(member);

        return interaction.editReply(
          sent
            ? "✅ Welcome preview sent."
            : "❌ Welcome channel not found."
        );
      }

      if (name === "invite-start") {
        return startCompetition(interaction);
      }

      if (name === "invite-top") {
        const embed = leaderboardEmbed();

        const files = attachImage(
          embed,
          "LEADERBOARD",
          IMAGES.leaderboard
        );

        return interaction.reply({
          embeds: [embed],
          files
        });
      }

      if (name === "invites") {
        return showInvites(interaction);
      }

      if (name === "invite-end") {
        if (!isAdmin(interaction)) {
          return privateReply(interaction, "❌ Administrator only.");
        }

        await interaction.deferReply({
          flags: MessageFlags.Ephemeral
        });

        const ended = await endCompetition(interaction.guild);

        return interaction.editReply(
          ended
            ? "✅ Competition ended."
            : "❌ No active competition."
        );
      }

      if (name === "ryvora-status") {
        return privateReply(interaction, {
          embeds: [
            baseEmbed(
              "💜 RYVORA • SYSTEM STATUS",
              "🟢 **Discord Connection:** Online\n" +
              `🎫 **Tracked Tickets:** ${Object.keys(state.tickets).length}\n` +
              `🛒 **Products:** ${PRODUCTS.length}\n` +
              `🏆 **Competition:** ${
                competitionActive() ? "Active" : "Inactive"
              }\n` +
              `📨 **Unknown Joins:** ${database.unknownJoins}\n` +
              `⏱️ **Uptime:** ${Math.floor(process.uptime() / 60)} minutes`
            )
          ]
        });
      }

      const product = PRODUCTS.find(item =>
        item.command === name
      );

      if (product) {
        return postProduct(interaction, product);
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "ryvora_verify") {
        return verifyMember(interaction);
      }

      if (interaction.customId === "ryvora_close_ticket") {
        return closeTicket(interaction);
      }

      if (interaction.customId === "ryvora_claim_ticket") {
        return claimTicket(interaction);
      }

      if (interaction.customId.startsWith("ryvora_buy:")) {
        const productKey = interaction.customId.split(":")[1];

        if (!PRODUCTS.some(p => p.command === productKey)) {
          return privateReply(interaction, "❌ Product not found.");
        }

        return createTicket(
          interaction,
          "purchase",
          productKey
        );
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "ryvora_ticket_category") {
        return createTicket(
          interaction,
          interaction.values[0]
        );
      }
    }

  } catch (error) {
    errorLog("Interaction error:", error);

    if (error.code === 10062 || error.code === 40060) {
      return;
    }

    if (!interaction.isRepliable()) return;

    try {
      await privateReply(
        interaction,
        "❌ An unexpected error occurred. Contact staff."
      );
    } catch (replyError) {
      errorLog("Interaction reply failed:", replyError);
    }
  }
});

// =====================================================
// STARTUP
// =====================================================

client.once(Events.ClientReady, async readyClient => {
  log(`Logged in as ${readyClient.user.tag}`);

  const guild = await client.guilds
    .fetch(CONFIG.guildId)
    .catch(() => null);

  if (!guild) {
    errorLog("Configured guild not found.");
    return;
  }

  try {
    await guild.channels.fetch();
    await guild.roles.fetch();

    await registerCommands();
    await initializeInvites(guild);

    log(`Server: ${guild.name}`);
    log(`Products loaded: ${PRODUCTS.length}`);
    log("Ticket system ready.");
    log("Verification system ready.");
    log("Welcome system ready.");
    log("Invite tracking ready.");
    log("All Ryvora systems initialized.");

  } catch (error) {
    errorLog("Startup initialization failed:", error);
  }

  async function competitionTick() {
    try {
      const competition = database.competition;

      if (!competition?.active) return;

      if (Date.now() >= competition.endsAt) {
        await endCompetition(guild, true);
      } else {
        await updateGiveawayMessage(guild);
      }
    } catch (error) {
      errorLog("Competition scheduler failed:", error);
    }
  }

  await competitionTick();

  setInterval(competitionTick, 60000);
});

// =====================================================
// ERROR HANDLING
// =====================================================

client.on(Events.Error, error => {
  errorLog("Discord client error:", error);
});

process.on("unhandledRejection", error => {
  errorLog("Unhandled rejection:", error);
});

process.on("uncaughtException", error => {
  errorLog("Uncaught exception:", error);
  process.exitCode = 1;
});

client.login(CONFIG.token).catch(error => {
  errorLog("Discord login failed:", error);
  process.exitCode = 1;
});
