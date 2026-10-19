
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

// =====================================================
// RYVORA - ULTIMATE METHODS
// COMPLETE DISCORD BOT
// Welcome | Verify | Tickets | Products | Support
// =====================================================

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
  color: 0x8B2CFF,
  brand: "RYVORA",
  fullName: "Ryvora - Ultimate Methods"
};

const NVIDIA_IMAGE_URL =
  "https://cdn.discordapp.com/attachments/1556886355768774676/1556887987533516910/46c93ffe-1c20-49d8-b247-351f9326d0db.png";

const REQUIRED = {
  DISCORD_TOKEN: CONFIG.token,
  CLIENT_ID: CONFIG.clientId,
  GUILD_ID: CONFIG.guildId,
  TICKET_CATEGORY_ID: CONFIG.ticketCategoryId,
  STAFF_ROLE_ID: CONFIG.staffRoleId,
  VERIFY_ROLE_ID: CONFIG.verifyRoleId
};

for (const [key, value] of Object.entries(REQUIRED)) {
  if (!value) {
    console.error(`[RYVORA] Missing ${key} in .env`);
    process.exit(1);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// =====================================================
// PRODUCT CATALOG - ORIGINAL PRICES PRESERVED
// =====================================================

const PRODUCTS = [
  {
    command: "perm_croofer",
    title: "Perm Serial Changer",
    description:
      "View the features and details of Perm Serial Changer below.",
    pricing:
      "• One Time Use → 24€\n" +
      "• Unlimited Uses → **49€**"
  },
  {
    command: "val_showcase",
    title: "VAL Showcase",
    description:
      "Features and product information for VAL Showcase.",
    pricing:
      process.env.VAL_SHOWCASE_PRICING ||
      "Contact our team for pricing."
  },
  {
    command: "val_color_aim",
    title: "Val Colorbot",
    description:
      "Features and product information for Val Colorbot.",
    pricing:
      "• 1 Day → 10€\n" +
      "• 1 Week → 24€\n" +
      "• 1 Month → 40€\n" +
      "• Lifetime → **168€**"
  },
  {
    command: "val_triggerbot",
    title: "Val Triggerbot",
    description:
      "Features and product information for Val Triggerbot.",
    pricing:
      "• 1 Day → 9€\n" +
      "• 1 Week → 17€\n" +
      "• 1 Month → 32€\n" +
      "• Lifetime → **160€**"
  },
  {
    command: "val_unlock_all",
    title: "Val Unlock All",
    description:
      "Features and product information for Val Unlock All.",
    pricing:
      "• 1 Day → 13€\n" +
      "• 1 Week → 23€\n" +
      "• 1 Month → 42€\n" +
      "• Lifetime → **163€**"
  },
  {
    command: "val_emu",
    title: "Val Emulator",
    description:
      "Features and product information for Val Emulator.",
    pricing:
      "• 3 Days → 43€\n" +
      "• 1 Week → 64€\n" +
      "• 1 Month → 105€\n" +
      "• Lifetime → **250€**"
  },
  {
    command: "fn_retract",
    title: "FN Retract",
    description:
      "Features and product information for FN Retract.",
    pricing:
      "• 1 Day → 9€\n" +
      "• 1 Week → 19€\n" +
      "• 1 Month → 37€\n" +
      "• Lifetime → **164€**"
  },
  {
    command: "retract_showcase",
    title: "Retract Showcase",
    description:
      "Features and product information for Retract Showcase.",
    pricing:
      process.env.RETRACT_SHOWCASE_PRICING ||
      "Contact our team for pricing."
  },
  {
    command: "rust_external",
    title: "Rust External",
    description:
      "Features and product information for Rust External.",
    pricing:
      "• 1 Day → 10€\n" +
      "• 1 Week → 32€\n" +
      "• 1 Month → 60€\n" +
      "• Lifetime → **350€**"
  },
  {
    command: "fivem_triggerbot",
    title: "FiveM Triggerbot",
    description:
      "Features and product information for FiveM Triggerbot.",
    pricing:
      "• 1 Week → 10€\n" +
      "• 1 Month → 27€\n" +
      "• Lifetime → **100€**"
  },
  {
    command: "nvidia_bypass",
    title: "NVIDIA Bypass",
    description:
      "NVIDIA Bypass is intended for users who already have a hider and compatible NVIDIA stream-proof software.\n\n" +
      "It allows a regular black NVIDIA setting/profile to be used without appearing completely black in recordings.\n\n" +
      "This is not a bypass that makes cheats such as TZX or other cheats stream-proof.",
    pricing:
      "• NVIDIA Bypass → **$10**\n" +
      "• NVIDIA Bypass + Mouse → **$15**",
    image: NVIDIA_IMAGE_URL
  },
  {
    command: "custom_cleaners",
    title: "Custom Cleaners",
    description:
      "🧹 **Custom Cleaner Service**\n\n" +
      "Cleaners are available for the following products:\n" +
      "• TZX\n" +
      "• GOSTH\n" +
      "• TESTO\n" +
      "• SKRIPTGG\n\n" +
      "An optional NVIDIA stream-proof service is available for an additional $10. Mouse support is not included; see the NVIDIA Bypass product for available options.\n\n" +
      "Please contact our team for details about compatibility and service terms.",
    pricing:
      "• Price per cleaner → **$35**"
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
    pricing:
      "Prices are listed in the account categories above."
  },
  {
    command: "fortnite_vbucks",
    title: "Fortnite V-Bucks",
    description:
      "Fortnite V-Bucks packages for PC Epic accounts.",
    pricing:
      "• PC - Epic → 4,500 V-Bucks → **$40**\n" +
      "• PC - Epic → 12,500 V-Bucks → **$80**"
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

  return new AttachmentBuilder(location, {
    name: attachmentName
  });
}

function applyImage(embed, url, attachmentName) {
  if (url && /^https?:\/\//i.test(url)) {
    embed.setImage(url);
  } else if (attachmentName) {
    embed.setImage(`attachment://${attachmentName}`);
  }
}

function getChannelByName(guild, names) {
  return guild.channels.cache.find(channel =>
    channel.type === ChannelType.GuildText &&
    names.some(name =>
      channel.name.toLowerCase() === name ||
      channel.name.toLowerCase().endsWith(`-${name}`)
    )
  );
}

async function getWelcomeChannel(guild) {
  if (CONFIG.welcomeChannelId) {
    const channel = await guild.channels
      .fetch(CONFIG.welcomeChannelId)
      .catch(() => null);

    if (channel && channel.isTextBased()) return channel;
  }

  await guild.channels.fetch().catch(() => null);

  return getChannelByName(guild, [
    "welcome",
    "welcomes",
    "👋-welcome",
    "welcome-members"
  ]);
}

async function getBotMember(guild) {
  return guild.members.fetchMe();
}

async function privateReply(interaction, content) {
  const payload = {
    content,
    flags: MessageFlags.Ephemeral
  };

  if (interaction.deferred) {
    return interaction.editReply({ content });
  }

  if (interaction.replied) {
    return interaction.followUp(payload);
  }

  return interaction.reply(payload);
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

  if (product.image) {
    embed.setImage(product.image);
  }

  embed.setAuthor({
    name: "RYVORA • PRODUCT CATALOG",
    iconURL: client.user.displayAvatarURL()
  });

  return embed;
}

// =====================================================
// WELCOME SYSTEM
// =====================================================

async function sendWelcome(member) {
  const guild = member.guild;
  const channel = await getWelcomeChannel(guild);

  if (!channel) {
    log("Welcome channel not found.");
    return false;
  }

  const welcomeEmbed = new EmbedBuilder()
    .setColor(CONFIG.color)
    .setAuthor({
      name: "RYVORA • NEW MEMBER",
      iconURL:
        guild.iconURL() ||
        client.user.displayAvatarURL()
    })
    .setTitle("✦ Welcome to Ryvora!")
    .setDescription(
      `Hey ${member}! 👋\n\n` +
      `Welcome to **${CONFIG.fullName}**.\n\n` +
      "💜 We're happy to have you here!\n" +
      "✨ You're now part of the Ryvora community.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "🔐 **Get Verified** — Unlock the server.\n" +
      "🎫 **Support** — Need help? Open a ticket.\n" +
      "🚀 **Explore** — Discover everything Ryvora offers.\n\n" +
      `👥 **You are member #${guild.memberCount}!**`
    )
    .setThumbnail(
      member.user.displayAvatarURL({
        size: 256
      })
    )
    .setFooter({
      text: "RYVORA • Enjoy Your Stay"
    })
    .setTimestamp();

  const files = [];

  if (CONFIG.welcomeImage) {
    applyImage(welcomeEmbed, CONFIG.welcomeImage);
  } else {
    const image = imageAttachment(
      "welcome.png",
      "ryvora-welcome.png"
    );

    if (image) {
      files.push(image);
      welcomeEmbed.setImage(
        "attachment://ryvora-welcome.png"
      );
    }
  }

  await channel.send({
    content:
      `💜 Welcome ${member} to **${CONFIG.fullName}**!`,
    embeds: [welcomeEmbed],
    files,
    allowedMentions: {
      users: [member.id],
      roles: [],
      parse: []
    }
  });

  log(`Welcome sent to ${member.user.tag}`);
  return true;
}

client.on(Events.GuildMemberAdd, async member => {
  if (member.guild.id !== CONFIG.guildId) return;

  try {
    await sendWelcome(member);
  } catch (error) {
    errorLog("Welcome failed:", error);
  }
});

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
    "Our team is here to help with purchases, " +
    "product questions, and general assistance.\n\n" +
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

  embed.setAuthor({
    name: "RYVORA • OFFICIAL VERIFICATION",
    iconURL: client.user.displayAvatarURL()
  });

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
  const member = await guild.members.fetch(
    interaction.user.id
  );

  const categoryKey = interaction.values[0];
  const category = TICKET_CATEGORIES[categoryKey];

  if (!category) {
    return privateReply(
      interaction,
      "❌ Invalid ticket category."
    );
  }

  const botMember = await getBotMember(guild);

  if (!botMember.permissions.has(
    PermissionFlagsBits.ManageChannels
  )) {
    return privateReply(
      interaction,
      "❌ The bot needs Manage Channels permission."
    );
  }

  const parent = await guild.channels
    .fetch(CONFIG.ticketCategoryId)
    .catch(() => null);

  if (!parent || parent.type !== ChannelType.GuildCategory) {
    return privateReply(
      interaction,
      "❌ Ticket category is not configured correctly."
    );
  }

  const staffRole = await guild.roles
    .fetch(CONFIG.staffRoleId)
    .catch(() => null);

  if (!staffRole) {
    return privateReply(
      interaction,
      "❌ Staff role was not found."
    );
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  // Prevent duplicate tickets in this category.
  await guild.channels.fetch();

  const existing = guild.channels.cache.find(channel =>
    channel.type === ChannelType.GuildText &&
    channel.parentId === CONFIG.ticketCategoryId &&
    channel.topic === `ticket-owner:${member.id}`
  );

  if (existing) {
    return interaction.editReply({
      content:
        `⚠️ You already have an open ticket: ${existing}`
    });
  }

  const channel = await guild.channels.create({
    name: `ticket-${categoryKey}-${member.id}`,
    type: ChannelType.GuildText,
    parent: CONFIG.ticketCategoryId,
    topic: `ticket-owner:${member.id}`,
    reason: `Ryvora ticket opened by ${member.user.tag}`,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: member.id,
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

  const embed = baseEmbed(
    `${category.emoji} RYVORA • ${category.title}`,
    `Welcome ${member}!\n\n` +
    `**Ticket Category:** ${category.title}\n\n` +
    "Your private support ticket has been created.\n" +
    "Please describe your request clearly.\n\n" +
    "A member of our team will assist you as soon as possible.\n\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "🔒 Click **Close Ticket** when finished."
  );

  await channel.send({
    content: `<@${member.id}> <@&${CONFIG.staffRoleId}>`,
    embeds: [embed],
    components: [createCloseButton()],
    allowedMentions: {
      users: [member.id],
      roles: [CONFIG.staffRoleId]
    }
  });

  await interaction.editReply({
    content: `✅ Ticket created successfully: ${channel}`
  });

  log(`Ticket created: ${channel.name}`);
}

async function closeTicket(interaction) {
  const channel = interaction.channel;
  const guild = interaction.guild;

  if (
    !channel ||
    channel.type !== ChannelType.GuildText ||
    channel.parentId !== CONFIG.ticketCategoryId ||
    !channel.topic?.startsWith("ticket-owner:")
  ) {
    return privateReply(
      interaction,
      "❌ This is not a valid Ryvora ticket."
    );
  }

  const member = await guild.members.fetch(
    interaction.user.id
  );

  const ownerId = channel.topic.split(":")[1];

  const isOwner = ownerId === member.id;
  const isStaff = member.roles.cache.has(
    CONFIG.staffRoleId
  );

  const canManage = member.permissions.has(
    PermissionFlagsBits.ManageChannels
  );

  if (!isOwner && !isStaff && !canManage) {
    return privateReply(
      interaction,
      "❌ Only the ticket owner or staff can close this ticket."
    );
  }

  await interaction.reply({
    embeds: [
      baseEmbed(
        "🔒 Ticket Closing",
        "This support ticket will close in **5 seconds**.\n\n" +
        "Thank you for contacting Ryvora Support."
      )
    ]
  });

  setTimeout(async () => {
    try {
      await channel.delete(
        `Ticket closed by ${interaction.user.tag}`
      );
      log(`Ticket closed: ${channel.name}`);
    } catch (error) {
      errorLog("Ticket close failed:", error);
    }
  }, 5000);
}

// =====================================================
// VERIFICATION HANDLER
// =====================================================

async function verifyMember(interaction) {
  const guild = interaction.guild;

  const member = await guild.members.fetch(
    interaction.user.id
  );

  const role = await guild.roles
    .fetch(CONFIG.verifyRoleId)
    .catch(() => null);

  const botMember = await getBotMember(guild);

  if (!role) {
    return privateReply(
      interaction,
      "❌ Verification role not found."
    );
  }

  if (!botMember.permissions.has(
    PermissionFlagsBits.ManageRoles
  )) {
    return privateReply(
      interaction,
      "❌ Bot needs Manage Roles permission."
    );
  }

  if (botMember.roles.highest.position <= role.position) {
    return privateReply(
      interaction,
      "❌ Move the bot role above the Verify role."
    );
  }

  if (member.roles.cache.has(role.id)) {
    return privateReply(
      interaction,
      "💜 You're already verified!"
    );
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  await member.roles.add(
    role,
    "Ryvora member verification"
  );

  await interaction.editReply({
    content:
      "✅ **Verification Successful!**\n\n" +
      "Welcome to Ryvora! You now have access to the server. 💜"
  });

  log(`Verified: ${member.user.tag}`);
}

// =====================================================
// SLASH COMMAND REGISTRATION
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
    .setDescription("Preview your Ryvora welcome message")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  ...PRODUCTS.map(product =>
    new SlashCommandBuilder()
      .setName(product.command)
      .setDescription(
        `Post the ${product.title} product card`
      )
      .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageGuild
      )
  )
].map(command => command.toJSON());

async function registerCommands() {
  const rest = new REST({
    version: "10"
  }).setToken(CONFIG.token);

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
// COMMAND HANDLERS
// =====================================================

async function sendPanel(interaction, type) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  const payload =
    type === "ticket"
      ? createTicketPanel()
      : createVerifyPanel();

  const imageUrl =
    type === "ticket"
      ? CONFIG.ticketImage
      : CONFIG.verifyImage;

  const localName =
    type === "ticket"
      ? "ticket.png"
      : "verify.png";

  const attachmentName =
    type === "ticket"
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
    content:
      `✅ ${type === "ticket" ? "Ticket" : "Verification"} panel posted successfully.`
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
    content:
      `✅ ${product.title} product card posted successfully.`
  });
}

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (!interaction.guild) return;

    if (interaction.guild.id !== CONFIG.guildId) {
      return;
    }

    if (interaction.isChatInputCommand()) {
      const name = interaction.commandName;

      if (name === "setup") {
        return await sendPanel(interaction, "ticket");
      }

      if (name === "verify") {
        return await sendPanel(interaction, "verify");
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
            ? "✅ Welcome preview sent to the welcome channel."
            : "❌ Welcome channel not found. Configure WELCOME_CHANNEL_ID or create a channel named welcome."
        });
      }

      const product = PRODUCTS.find(
        item => item.command === name
      );

      if (product) {
        return await postProduct(interaction, product);
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "ryvora_verify") {
        return await verifyMember(interaction);
      }

      if (interaction.customId === "ryvora_close_ticket") {
        return await closeTicket(interaction);
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (
        interaction.customId === "ryvora_ticket_category"
      ) {
        return await createTicket(interaction);
      }
    }
  } catch (error) {
    errorLog("Interaction error:", error);

    try {
      await privateReply(
        interaction,
        "❌ An unexpected error occurred. Please contact staff."
      );
    } catch (replyError) {
      errorLog("Could not reply to interaction:", replyError);
    }
  }
});

// =====================================================
// READY EVENT
// =====================================================

client.once(Events.ClientReady, async readyClient => {
  console.log("");
  console.log("╔════════════════════════════════════╗");
  console.log("║       RYVORA ULTIMATE METHODS      ║");
  console.log("║         DISCORD BOT ONLINE         ║");
  console.log("╚════════════════════════════════════╝");
  console.log("");

  log(`Logged in as ${readyClient.user.tag}`);

  const guild = await client.guilds
    .fetch(CONFIG.guildId)
    .catch(() => null);

  if (!guild) {
    errorLog("Configured server was not found.");
    return;
  }

  await guild.channels.fetch().catch(() => null);
  await guild.roles.fetch().catch(() => null);

  log(`Server: ${guild.name}`);

  try {
    const botMember = await getBotMember(guild);

    const verifyRole = guild.roles.cache.get(
      CONFIG.verifyRoleId
    );

    const staffRole = guild.roles.cache.get(
      CONFIG.staffRoleId
    );

    const category = guild.channels.cache.get(
      CONFIG.ticketCategoryId
    );

    if (!verifyRole) {
      log("WARNING: Verify role not found.");
    } else if (
      botMember.roles.highest.position <=
      verifyRole.position
    ) {
      log("WARNING: Bot role must be above Verify role.");
    } else {
      log(`Verify role: ${verifyRole.name}`);
    }

    if (!staffRole) {
      log("WARNING: Staff role not found.");
    } else {
      log(`Staff role: ${staffRole.name}`);
    }

    if (
      !category ||
      category.type !== ChannelType.GuildCategory
    ) {
      log("WARNING: Ticket category invalid.");
    } else {
      log(`Ticket category: ${category.name}`);
    }

    const welcomeChannel = await getWelcomeChannel(guild);

    if (welcomeChannel) {
      log(`Welcome channel: ${welcomeChannel.name}`);
    } else {
      log("WARNING: Welcome channel not configured.");
    }

    await registerCommands();

    log("Welcome system initialized.");
    log("Verification system initialized.");
    log("Ticket system initialized.");
    log(`Product catalog: ${PRODUCTS.length} products.`);
    log("All systems ready.");

  } catch (error) {
    errorLog("Startup configuration error:", error);
  }
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
