
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
  ticketImage: process.env.TICKET_IMAGE_URL || "",
  verifyImage: process.env.VERIFY_IMAGE_URL || "",
  welcomeImage: process.env.WELCOME_IMAGE_URL || "",
  giveawayChannelId: process.env.GIVEAWAY_CHANNEL_ID || "",
  color: 0x8B2CFF,
  brand: "RYVORA",
  fullName: "Ryvora - Ultimate Methods"
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

const PRODUCTS = [
  {
    command: "perm_croofer",
    title: "Perm Serial Changer",
    description: "View the features and details of Perm Serial Changer below.",
    pricing: "• One Time Use → 24€\n• Unlimited Uses → **49€**"
  },
  {
    command: "val_showcase",
    title: "VAL Showcase",
    description: "Features and product information for VAL Showcase.",
    pricing: process.env.VAL_SHOWCASE_PRICING || "Contact our team for pricing."
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
    pricing: process.env.RETRACT_SHOWCASE_PRICING || "Contact our team for pricing."
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
    pricing: "• NVIDIA Bypass → **$10**\n• NVIDIA Bypass + Mouse → **$15**",
    image: "https://cdn.discordapp.com/attachments/1556886355768774676/1556887987533516910/46c93ffe-1c20-49d8-b247-351f9326d0db.png"
  },
  {
    command: "custom_cleaners",
    title: "Custom Cleaners",
    description:
      "🧹 **Custom Cleaner Service**\n\n" +
      "Cleaners are available for the following products:\n" +
      "• TZX\n• GOSTH\n• TESTO\n• SKRIPTGG\n\n" +
      "An optional NVIDIA stream-proof service is available for an additional $10. Mouse support is not included; see the NVIDIA Bypass product for available options.\n\n" +
      "Please contact our team for details about compatibility and service terms.",
    pricing: "• Price per cleaner → **$35**"
  },
  {
    command: "tweaks",
    title: "PC Optimization",
    description:
      "🚀 **Complete PC Optimization for maximum performance, built for competitive gaming.**\n\n" +
      "• 1,000+ Optimizations\n" +
      "• BIOS Tuner\n" +
      "• Network Adapter Tuner\n" +
      "• Advanced Hardware Optimization\n" +
      "• All Optimizations Unlocked\n" +
      "• High Priority Customer Support\n" +
      "• 20+ Advanced Features\n" +
      "• All Plus Features",
    pricing:
      "• PC Optimization (One Time) → **$30**\n" +
      "• Re-PC Optimization (after a factory reset) → **$15**"
  },
  {
    command: "fortnite_accounts",
    title: "Fortnite Accounts",
    description:
      "These are full-access accounts. You receive the account email and login details, and can reset the password after purchase.\n\n" +
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
      "• PC/PSN/XBOX — 82 skins, The Ageless Champion, Burning Ambition Valeria, Sideways Warrior, AurelianGAL23 → **$55**\n" +
      "• PC/XBOX — 125 skins, Naruto Uzumaki, Spectra Knight, Omegarok, Lynx, Snap, Drift, Catalyst, 1550 MB413 → **$85**\n" +
      "• PC/PSN — 108 skins, Star Wand, Get Griddy, Plunja, Optimus Prime → **$65**\n\n" +
      "Need something else? Open a ticket and request more account options.",
    pricing: "Prices are listed in the account categories above."
  },
  {
    command: "fortnite_vbucks",
    title: "Fortnite V-Bucks",
    description: "Fortnite V-Bucks packages for PC Epic accounts.",
    pricing: "• PC - Epic → 4,500 V-Bucks → **$40**\n• PC - Epic → 12,500 V-Bucks → **$80**"
  }
];

// =====================================================
// UTILITIES
// =====================================================

function log(message) {
  console.log(`[RYVORA] ${message}`);
}

function errorLog(context, error) {
  console.error(`[RYVORA] ${context}`, error);
}

function baseEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(CONFIG.color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({
      text: `${CONFIG.fullName} • Official Server`
    })
    .setTimestamp();
}

function imageAttachment(filename, attachmentName) {
  const location = path.join(__dirname, filename);
  if (!fs.existsSync(location)) return null;
  return new AttachmentBuilder(location, { name: attachmentName });
}

function applyImage(embed, url) {
  if (url && /^https?:\/\//i.test(url)) {
    embed.setImage(url);
  }
}

async function privateReply(interaction, content) {
  if (interaction.deferred) {
    return interaction.editReply({ content });
  }

  if (interaction.replied) {
    return interaction.followUp({
      content,
      flags: MessageFlags.Ephemeral
    });
  }

  return interaction.reply({
    content,
    flags: MessageFlags.Ephemeral
  });
}

function isAdmin(interaction) {
  return interaction.memberPermissions?.has(
    PermissionFlagsBits.Administrator
  ) || false;
}

async function getBotMember(guild) {
  return guild.members.fetchMe();
}

// =====================================================
// PRODUCT EMBEDS
// =====================================================

function createProductEmbed(product) {
  const embed = baseEmbed(
    `✦ ${product.title}`,
    `${product.description}\n\n` +
    `💳 **PRICING**\n${product.pricing}\n\n` +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "🛒 **Ready to order?**\n" +
    "Open a support ticket and select **Purchase**."
  );

  if (product.image) embed.setImage(product.image);

  embed.setAuthor({
    name: "RYVORA • PRODUCT CATALOG",
    iconURL: client.user.displayAvatarURL()
  });

  return embed;
}

// =====================================================
// WELCOME SYSTEM
// =====================================================

async function getWelcomeChannel(guild) {
  if (CONFIG.welcomeChannelId) {
    const channel = await guild.channels
      .fetch(CONFIG.welcomeChannelId)
      .catch(() => null);

    if (channel?.isTextBased()) return channel;
  }

  await guild.channels.fetch().catch(() => null);

  return guild.channels.cache.find(channel =>
    channel.type === ChannelType.GuildText &&
    [
      "welcome",
      "welcomes",
      "👋-welcome",
      "welcome-members"
    ].some(name =>
      channel.name.toLowerCase() === name ||
      channel.name.toLowerCase().endsWith(`-${name}`)
    )
  );
}

async function sendWelcome(member) {
  const channel = await getWelcomeChannel(member.guild);
  if (!channel) return false;

  const embed = baseEmbed(
    "✦ Welcome to Ryvora!",
    `Hey ${member}! 👋\n\n` +
    `Welcome to **${CONFIG.fullName}**.\n\n` +
    "💜 We're happy to have you here!\n" +
    "✨ You're now part of the Ryvora community.\n\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "🔐 **Get Verified** — Unlock the server.\n" +
    "🎫 **Support** — Need help? Open a ticket.\n" +
    "🚀 **Explore** — Discover everything Ryvora offers.\n\n" +
    `👥 **You are member #${member.guild.memberCount}!**`
  ).setThumbnail(member.user.displayAvatarURL({ size: 256 }));

  const files = [];

  if (CONFIG.welcomeImage) {
    applyImage(embed, CONFIG.welcomeImage);
  } else {
    const image = imageAttachment(
      "welcome.png",
      "ryvora-welcome.png"
    );

    if (image) {
      files.push(image);
      embed.setImage("attachment://ryvora-welcome.png");
    }
  }

  await channel.send({
    content: `💜 Welcome ${member} to **${CONFIG.fullName}**!`,
    embeds: [embed],
    files,
    allowedMentions: {
      users: [member.id],
      roles: [],
      parse: []
    }
  });

  return true;
}

// =====================================================
// TICKET SYSTEM
// =====================================================

const TICKET_CATEGORIES = {
  purchase: {
    title: "Purchase",
    emoji: "🛒",
    description: "Purchase a product"
  },
  pre_sale: {
    title: "Pre-Sale Question",
    emoji: "❓",
    description: "Ask before purchasing"
  },
  support: {
    title: "Support",
    emoji: "🛠️",
    description: "General support"
  },
  hwid_reset: {
    title: "HWID Reset",
    emoji: "🔑",
    description: "Request an HWID reset"
  },
  media_reseller: {
    title: "Media / Reseller",
    emoji: "📦",
    description: "Partnership inquiries"
  }
};

function createTicketPanel() {
  const embed = baseEmbed(
    "🎫 RYVORA • SUPPORT CENTER",
    "**Welcome to our official support center.**\n\n" +
    "Our team is here to help with purchases, product questions, and general assistance.\n\n" +
    "🛒 **Purchase** — Place a new order.\n" +
    "❓ **Pre-Sale** — Ask about a product.\n" +
    "🛠️ **Support** — Get assistance.\n" +
    "🔑 **HWID Reset** — Request a reset.\n" +
    "📦 **Media / Reseller** — Partnerships.\n\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "💜 **Select an option below to open a private ticket.**"
  );

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ryvora_ticket_category")
    .setPlaceholder("✦ Choose a support category")
    .addOptions(
      Object.entries(TICKET_CATEGORIES).map(
        ([value, category]) => ({
          label: category.title,
          value,
          description: category.description,
          emoji: category.emoji
        })
      )
    );

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(menu)
    ]
  };
}

function createVerifyPanel() {
  const embed = baseEmbed(
    "🔐 RYVORA • VERIFICATION",
    "## Welcome to Ryvora!\n\n" +
    "Before accessing the community, please complete verification.\n\n" +
    "✦ **Step 1** — Read the server rules.\n" +
    "✦ **Step 2** — Click the Verify button.\n" +
    "✦ **Step 3** — Receive your member role.\n\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "💜 **Click below to unlock the server.**"
  );

  const button = new ButtonBuilder()
    .setCustomId("ryvora_verify")
    .setLabel("Verify & Unlock")
    .setEmoji("✅")
    .setStyle(ButtonStyle.Success);

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(button)
    ]
  };
}

function createCloseButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ryvora_close_ticket")
      .setLabel("Close Ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );
}

async function createTicket(interaction) {
  const guild = interaction.guild;
  const categoryKey = interaction.values[0];
  const category = TICKET_CATEGORIES[categoryKey];

  if (!category) {
    return privateReply(interaction, "❌ Invalid ticket category.");
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  const botMember = await getBotMember(guild);

  if (!botMember.permissions.has(
    PermissionFlagsBits.ManageChannels
  )) {
    return interaction.editReply({
      content: "❌ Bot needs Manage Channels permission."
    });
  }

  const parent = await guild.channels
    .fetch(CONFIG.ticketCategoryId)
    .catch(() => null);

  if (!parent || parent.type !== ChannelType.GuildCategory) {
    return interaction.editReply({
      content: "❌ Ticket category is not configured correctly."
    });
  }

  const staffRole = await guild.roles
    .fetch(CONFIG.staffRoleId)
    .catch(() => null);

  if (!staffRole) {
    return interaction.editReply({
      content: "❌ Staff role not found."
    });
  }

  await guild.channels.fetch();

  const existing = guild.channels.cache.find(channel =>
    channel.type === ChannelType.GuildText &&
    channel.parentId === CONFIG.ticketCategoryId &&
    channel.topic === `ticket-owner:${interaction.user.id}`
  );

  if (existing) {
    return interaction.editReply({
      content: `⚠️ You already have a ticket: ${existing}`
    });
  }

  const channel = await guild.channels.create({
    name: `ticket-${categoryKey}-${interaction.user.id}`,
    type: ChannelType.GuildText,
    parent: CONFIG.ticketCategoryId,
    topic: `ticket-owner:${interaction.user.id}`,
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

  await channel.send({
    content: `<@${interaction.user.id}> <@&${CONFIG.staffRoleId}>`,
    embeds: [
      baseEmbed(
        `${category.emoji} RYVORA • ${category.title}`,
        `Welcome <@${interaction.user.id}>!\n\n` +
        `**Ticket Category:** ${category.title}\n\n` +
        "Your private support ticket has been created.\n" +
        "Please describe your request clearly.\n\n" +
        "🔒 Click **Close Ticket** when finished."
      )
    ],
    components: [createCloseButton()],
    allowedMentions: {
      users: [interaction.user.id],
      roles: [CONFIG.staffRoleId]
    }
  });

  await interaction.editReply({
    content: `✅ Ticket created: ${channel}`
  });
}

async function closeTicket(interaction) {
  const channel = interaction.channel;

  if (
    channel.type !== ChannelType.GuildText ||
    channel.parentId !== CONFIG.ticketCategoryId ||
    !channel.topic?.startsWith("ticket-owner:")
  ) {
    return privateReply(interaction, "❌ Invalid ticket.");
  }

  const ownerId = channel.topic.split(":")[1];
  const member = await interaction.guild.members.fetch(
    interaction.user.id
  );

  const authorized =
    ownerId === member.id ||
    member.roles.cache.has(CONFIG.staffRoleId) ||
    member.permissions.has(PermissionFlagsBits.ManageChannels);

  if (!authorized) {
    return privateReply(
      interaction,
      "❌ Only the ticket owner or staff can close this ticket."
    );
  }

  await interaction.reply({
    embeds: [
      baseEmbed(
        "🔒 Ticket Closing",
        "This ticket will close in **5 seconds**."
      )
    ]
  });

  setTimeout(async () => {
    try {
      await channel.delete(
        `Ticket closed by ${interaction.user.tag}`
      );
    } catch (error) {
      errorLog("Ticket deletion failed:", error);
    }
  }, 5000);
}

// =====================================================
// VERIFY SYSTEM
// =====================================================

async function verifyMember(interaction) {
  const guild = interaction.guild;
  const member = await guild.members.fetch(interaction.user.id);
  const role = await guild.roles.fetch(CONFIG.verifyRoleId);
  const botMember = await getBotMember(guild);

  if (!role) {
    return privateReply(interaction, "❌ Verify role not found.");
  }

  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return privateReply(interaction, "❌ Bot needs Manage Roles.");
  }

  if (botMember.roles.highest.position <= role.position) {
    return privateReply(
      interaction,
      "❌ Move the bot role above the Verify role."
    );
  }

  if (member.roles.cache.has(role.id)) {
    return privateReply(interaction, "💜 Already verified!");
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  await member.roles.add(role, "Ryvora verification");

  await interaction.editReply({
    content: "✅ **Verification Successful!** Welcome to Ryvora! 💜"
  });
}

// =====================================================
// INVITE COMPETITION DATABASE
// =====================================================

const DATA_FILE = path.join(__dirname, "ryvora-invites.json");

function defaultDatabase() {
  return {
    competition: null,
    members: {},
    unknownJoins: 0
  };
}

function loadDatabase() {
  try {
    if (!fs.existsSync(DATA_FILE)) return defaultDatabase();

    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

    return {
      ...defaultDatabase(),
      ...data,
      members: data.members || {}
    };
  } catch (error) {
    errorLog("Database loading failed:", error);
    throw error;
  }
}

let database = loadDatabase();

function saveDatabase() {
  const temporary = `${DATA_FILE}.tmp`;

  fs.writeFileSync(
    temporary,
    JSON.stringify(database, null, 2),
    "utf8"
  );

  fs.renameSync(temporary, DATA_FILE);
}

function memberStats(userId) {
  if (!database.members[userId]) {
    database.members[userId] = {
      invites: 0,
      joins: []
    };
  }

  return database.members[userId];
}

function competitionActive() {
  return (
    database.competition &&
    database.competition.active &&
    Date.now() < database.competition.endsAt
  );
}

function getLeaderboard() {
  return Object.entries(database.members)
    .map(([id, data]) => ({
      id,
      invites: data.invites || 0
    }))
    .filter(user => user.invites > 0)
    .sort((a, b) =>
      b.invites - a.invites ||
      a.id.localeCompare(b.id)
    );
}

// =====================================================
// INVITE TRACKER
// =====================================================

const inviteCache = new Map();
let inviteQueue = Promise.resolve();

function queueInviteOperation(operation) {
  const next = inviteQueue.then(operation);
  inviteQueue = next.catch(error => {
    errorLog("Invite queue failed:", error);
  });
  return next;
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
    log(`Invite tracking ready: ${snapshot.size} invites.`);
  } catch (error) {
    errorLog("Cannot fetch invites:", error);
    log("Invite tracking requires Manage Server permission.");
  }
}

client.on(Events.InviteCreate, async invite => {
  if (invite.guild?.id !== CONFIG.guildId) return;

  await queueInviteOperation(async () => {
    await initializeInvites(invite.guild);
  });
});

client.on(Events.InviteDelete, async invite => {
  if (invite.guild?.id !== CONFIG.guildId) return;

  await queueInviteOperation(async () => {
    const cache = inviteCache.get(invite.guild.id);
    if (cache) cache.delete(invite.code);
  });
});

async function trackMemberJoin(member) {
  if (!competitionActive()) return;

  const guild = member.guild;
  const previous = inviteCache.get(guild.id);

  let current;

  try {
    current = await fetchInviteSnapshot(guild);
  } catch (error) {
    errorLog("Invite fetch failed:", error);
    return;
  }

  inviteCache.set(guild.id, current);

  if (!previous) {
    database.unknownJoins++;
    saveDatabase();
    return;
  }

  const candidates = [];

  for (const [code, invite] of current) {
    const old = previous.get(code);
    const difference = invite.uses - (old?.uses || 0);

    if (difference > 0 && invite.inviterId) {
      candidates.push({
        code,
        inviterId: invite.inviterId,
        difference
      });
    }
  }

  // A unique single-use increase is the safest attribution.
  if (
    candidates.length !== 1 ||
    candidates[0].difference !== 1
  ) {
    database.unknownJoins++;
    saveDatabase();
    return;
  }

  const inviterId = candidates[0].inviterId;

  if (member.user.bot || inviterId === member.id) return;

  // Reject accounts created less than 7 days ago.
  const accountAge = Date.now() - member.user.createdTimestamp;
  const minimumAge = 7 * 24 * 60 * 60 * 1000;

  if (accountAge < minimumAge) return;

  const stats = memberStats(inviterId);

  // Prevent duplicate credit for the same member.
  if (stats.joins.includes(member.id)) return;

  stats.invites++;
  stats.joins.push(member.id);

  saveDatabase();

  log(`Invite credited: ${inviterId} -> ${member.id}`);
}

client.on(Events.GuildMemberAdd, async member => {
  if (member.guild.id !== CONFIG.guildId) return;

  try {
    await queueInviteOperation(() => trackMemberJoin(member));
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
    const index = stats.joins.indexOf(member.id);

    if (index !== -1) {
      stats.joins.splice(index, 1);
      stats.invites = Math.max(0, stats.invites - 1);
      changed = true;
    }
  }

  if (changed) saveDatabase();
});

// =====================================================
// INVITE GIVEAWAY EMBEDS
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
    ? top.map((user, index) =>
        `${["🥇", "🥈", "🥉"][index]} <@${user.id}> — **${user.invites}** invites`
      ).join("\n")
    : "No valid invites yet.";

  return baseEmbed(
    "🎉 RYVORA • INVITE COMPETITION",
    "## INVITE FRIENDS & WIN!\n\n" +
    "Invite the most valid members to our server and win a free prize!\n\n" +
    `🏆 **PRIZE**\n${competition.prize}\n\n` +
    `⏰ **ENDS**\n<t:${Math.floor(competition.endsAt / 1000)}:R>\n\n` +
    `📊 **LIVE LEADERBOARD**\n${ranking}\n\n` +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "📌 **RULES**\n" +
    "• Only valid invites count.\n" +
    "• Bot accounts do not count.\n" +
    "• Accounts must be at least 7 days old.\n" +
    "• Members must remain in the server.\n" +
    "• Fake invites and abuse are disqualified.\n" +
    "• Unverifiable invites are not credited.\n\n" +
    "💜 Good luck! — RYVORA"
  );
}

function leaderboardEmbed() {
  const leaderboard = getLeaderboard().slice(0, 10);

  const text = leaderboard.length
    ? leaderboard.map((user, index) =>
        `**#${index + 1}** <@${user.id}> — ${user.invites} invites`
      ).join("\n")
    : "No valid invites recorded yet.";

  return baseEmbed(
    "🏆 RYVORA • INVITE LEADERBOARD",
    text
  );
}

// =====================================================
// INVITE GIVEAWAY COMMANDS
// =====================================================

async function startCompetition(interaction) {
  if (!isAdmin(interaction)) {
    return privateReply(interaction, "❌ Administrator only.");
  }

  if (database.competition?.active) {
    return privateReply(
      interaction,
      "❌ A competition is already active."
    );
  }

  const days = interaction.options.getInteger("days");
  const prize = interaction.options.getString("prize");

  const channel =
    interaction.options.getChannel("channel") ||
    interaction.channel;

  if (!channel || !channel.isTextBased()) {
    return privateReply(interaction, "❌ Invalid channel.");
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  const snapshot = await fetchInviteSnapshot(interaction.guild)
    .catch(() => null);

  if (!snapshot) {
    return interaction.editReply({
      content: "❌ Bot needs Manage Server to track invites."
    });
  }

  inviteCache.set(interaction.guild.id, snapshot);

  database.members = {};
  database.unknownJoins = 0;

  database.competition = {
    active: true,
    prize,
    startsAt: Date.now(),
    endsAt: Date.now() + days * 86400000,
    channelId: channel.id,
    messageId: null
  };

  saveDatabase();

  const message = await channel.send({
    embeds: [giveawayEmbed()],
    allowedMentions: { parse: [] }
  });

  database.competition.messageId = message.id;
  saveDatabase();

  await interaction.editReply({
    content: `✅ Invite competition started in ${channel}!`
  });
}

async function showInvites(interaction) {
  const user = interaction.options.getUser("user") || interaction.user;
  const stats = database.members[user.id];

  const count = stats?.invites || 0;

  return interaction.reply({
    embeds: [
      baseEmbed(
        "📨 RYVORA • YOUR INVITES",
        `👤 **Member:** ${user}\n\n` +
        `🎯 **Valid Invites:** ${count}\n\n` +
        "Only valid invites during the competition are counted."
      )
    ],
    flags: MessageFlags.Ephemeral
  });
}

async function endCompetition(guild, automatic = false) {
  const competition = database.competition;

  if (!competition?.active) return false;

  competition.active = false;

  const leaderboard = getLeaderboard();

  let description;

  if (!leaderboard.length) {
    description = "No valid entries. No winner selected.";
  } else {
    const bestScore = leaderboard[0].invites;

    const winners = leaderboard.filter(
      user => user.invites === bestScore
    );

    if (winners.length > 1) {
      description =
        "⚠️ **TIE DETECTED**\n\n" +
        winners.map(user => `<@${user.id}>`).join("\n") +
        `\n\n**Valid invites:** ${bestScore}\n\n` +
        "Staff must resolve the tie manually.";
    } else {
      description =
        `🎉 **WINNER:** <@${winners[0].id}>\n\n` +
        `📨 **Valid Invites:** ${bestScore}\n\n` +
        `🎁 **Prize:** ${competition.prize}\n\n` +
        "Open a support ticket to claim your prize.\n" +
        "Staff will verify the results before delivery.";
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

  saveDatabase();

  log(
    `Competition ended (${automatic ? "automatic" : "manual"}).`
  );

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

  await message.edit({
    embeds: [giveawayEmbed()],
    allowedMentions: { parse: [] }
  });
}

// =====================================================
// SLASH COMMANDS
// =====================================================

const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Post the Ryvora support panel")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Post the Ryvora verification panel")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  new SlashCommandBuilder()
    .setName("welcome-test")
    .setDescription("Preview the Ryvora welcome message")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  new SlashCommandBuilder()
    .setName("invite-start")
    .setDescription("Start an invite giveaway")
    .addIntegerOption(option =>
      option
        .setName("days")
        .setDescription("Competition duration in days")
        .setMinValue(1)
        .setMaxValue(30)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("prize")
        .setDescription("Prize for the winner")
        .setMaxLength(200)
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("Channel for the giveaway announcement")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  new SlashCommandBuilder()
    .setName("invite-top")
    .setDescription("Show the invite leaderboard"),

  new SlashCommandBuilder()
    .setName("invites")
    .setDescription("Check valid invites")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Member to check")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("invite-end")
    .setDescription("End the invite giveaway")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  ...PRODUCTS.map(product =>
    new SlashCommandBuilder()
      .setName(product.command)
      .setDescription(`Post the ${product.title} product card`)
      .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageGuild
      )
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

  const payload = type === "ticket"
    ? createTicketPanel()
    : createVerifyPanel();

  const imageUrl = type === "ticket"
    ? CONFIG.ticketImage
    : CONFIG.verifyImage;

  const localName = type === "ticket"
    ? "ticket.png"
    : "verify.png";

  const attachmentName = type === "ticket"
    ? "ryvora-ticket.png"
    : "ryvora-verify.png";

  if (imageUrl) {
    applyImage(payload.embeds[0], imageUrl);
  } else {
    const attachment = imageAttachment(
      localName,
      attachmentName
    );

    if (attachment) {
      payload.files = [attachment];
      payload.embeds[0].setImage(
        `attachment://${attachmentName}`
      );
    }
  }

  await interaction.channel.send(payload);

  await interaction.editReply({
    content: `✅ ${type} panel posted successfully.`
  });
}

async function postProduct(interaction, product) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  await interaction.channel.send({
    embeds: [createProductEmbed(product)]
  });

  await interaction.editReply({
    content: `✅ ${product.title} product card posted.`
  });
}

// =====================================================
// INTERACTION HANDLER
// =====================================================

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (!interaction.guild) return;
    if (interaction.guild.id !== CONFIG.guildId) return;

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

        return interaction.editReply({
          content: sent
            ? "✅ Welcome preview sent."
            : "❌ Welcome channel not found."
        });
      }

      if (name === "invite-start") {
        return startCompetition(interaction);
      }

      if (name === "invite-top") {
        return interaction.reply({
          embeds: [leaderboardEmbed()]
        });
      }

      if (name === "invites") {
        return showInvites(interaction);
      }

      if (name === "invite-end") {
        if (!isAdmin(interaction)) {
          return privateReply(
            interaction,
            "❌ Administrator only."
          );
        }

        await interaction.deferReply({
          flags: MessageFlags.Ephemeral
        });

        const ended = await endCompetition(interaction.guild);

        return interaction.editReply({
          content: ended
            ? "✅ Competition ended."
            : "❌ No active competition."
        });
      }

      const product = PRODUCTS.find(
        item => item.command === name
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
    }

    if (interaction.isStringSelectMenu()) {
      if (
        interaction.customId === "ryvora_ticket_category"
      ) {
        return createTicket(interaction);
      }
    }
  } catch (error) {
    errorLog("Interaction error:", error);

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
// READY EVENT
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
    log("Welcome system initialized.");
    log("Verification system initialized.");
    log("Ticket system initialized.");
    log(`Product catalog: ${PRODUCTS.length} products.`);
    log("Invite competition initialized.");
    log("All systems ready.");
  } catch (error) {
    errorLog("Startup failed:", error);
  }

  setInterval(async () => {
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
  }, 60000);
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

// =====================================================
// LOGIN
// =====================================================

client.login(CONFIG.token).catch(error => {
  errorLog("Discord login failed:", error);
  process.exitCode = 1;
});
