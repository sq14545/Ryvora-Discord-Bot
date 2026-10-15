require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

// ==========================================
// CONFIG
// ==========================================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const VERIFY_ROLE_ID = process.env.VERIFY_ROLE_ID;
const TICKET_IMAGE_URL = process.env.TICKET_IMAGE_URL || "";
const VERIFY_IMAGE_URL = process.env.VERIFY_IMAGE_URL || "";

const NVIDIA_IMAGE_URL =
  "https://cdn.discordapp.com/attachments/1556886355768774676/1556887987533516910/46c93ffe-1c20-49d8-b247-351f9326d0db.png";

// ==========================================
// PRODUCT CATALOG
// ==========================================

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
    pricing: process.env.VAL_SHOWCASE_PRICING ||
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
    pricing: process.env.RETRACT_SHOWCASE_PRICING ||
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
    pricing: "Prices are listed in the account categories above."
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

// ==========================================
// PRODUCT EMBED
// ==========================================

function createProductEmbed(product) {
  const embed = new EmbedBuilder()
    .setColor(0x6D5BFF)
    .setTitle(`🚀 ${product.title}`)
    .setDescription(
      `${product.description}\n\n` +
      `💳 **Pricing:**\n\n${product.pricing}\n\n` +
      "To purchase or ask a question, open a ticket and choose **Purchase**."
    )
    .setFooter({
      text: `RYVORA • ${product.title}`
    })
    .setTimestamp();

  if (product.image) {
    embed.setImage(product.image);
  }

  return embed;
}

// ==========================================
// CONFIG CHECK
// ==========================================

console.log("====================================");
console.log("          RYVORA DISCORD BOT");
console.log("====================================");

const requiredConfig = {
  DISCORD_TOKEN: TOKEN,
  CLIENT_ID,
  GUILD_ID,
  TICKET_CATEGORY_ID,
  STAFF_ROLE_ID,
  VERIFY_ROLE_ID
};

for (const [name, value] of Object.entries(requiredConfig)) {
  if (!value) {
    console.error(`❌ Missing ${name} in .env`);
    process.exit(1);
  }
}

// ==========================================
// CLIENT
// ==========================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ==========================================
// SLASH COMMANDS
// ==========================================

const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Send the Ryvora ticket panel")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Send the Ryvora verification panel")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )
    .toJSON(),

  ...PRODUCTS.map(product =>
    new SlashCommandBuilder()
      .setName(product.command)
      .setDescription(`Post the ${product.title} product card`)
      .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageGuild
      )
      .toJSON()
  )
];

// ==========================================
// REGISTER COMMANDS
// ==========================================

async function registerCommands() {
  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("✅ Slash commands registered.");
  } catch (error) {
    console.error("❌ Failed to register commands:", error);
  }
}

// ==========================================
// GET BOT MEMBER
// ==========================================

async function getBotMember(guild) {
  try {
    return await guild.members.fetch(client.user.id);
  } catch (error) {
    console.error("❌ Could not fetch bot member:", error);
    return null;
  }
}

// ==========================================
// READY
// ==========================================

client.once(Events.ClientReady, async readyClient => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);

  const guild = readyClient.guilds.cache.get(GUILD_ID);

  if (!guild) {
    console.error("❌ Bot is not inside the configured GUILD_ID.");
    return;
  }

  const botMember = await getBotMember(guild);

  if (!botMember) return;

  const verifyRole = guild.roles.cache.get(VERIFY_ROLE_ID);
  const staffRole = guild.roles.cache.get(STAFF_ROLE_ID);
  const ticketCategory = guild.channels.cache.get(TICKET_CATEGORY_ID);

  if (!verifyRole) {
    console.error(`❌ Invalid VERIFY_ROLE_ID: ${VERIFY_ROLE_ID}`);
  } else if (
    botMember.roles.highest.position <= verifyRole.position
  ) {
    console.error("❌ Move the bot role above the Verify role.");
  } else {
    console.log(`✅ Verify role found: ${verifyRole.name}`);
  }

  if (!staffRole) {
    console.error(`❌ Invalid STAFF_ROLE_ID: ${STAFF_ROLE_ID}`);
  } else {
    console.log(`✅ Staff role found: ${staffRole.name}`);
  }

  if (!ticketCategory) {
    console.error(
      `❌ Invalid TICKET_CATEGORY_ID: ${TICKET_CATEGORY_ID}`
    );
  } else if (ticketCategory.type !== ChannelType.GuildCategory) {
    console.error("❌ TICKET_CATEGORY_ID must be a category.");
  } else {
    console.log(`✅ Ticket category found: ${ticketCategory.name}`);
  }

  await registerCommands();
});

// ==========================================
// INTERACTIONS
// ==========================================

client.on(Events.InteractionCreate, async interaction => {
  try {
    // --------------------------------------
    // PRODUCT COMMANDS
    // --------------------------------------

    if (interaction.isChatInputCommand()) {
      const product = PRODUCTS.find(
        item => item.command === interaction.commandName
      );

      if (product) {
        if (!interaction.channel) {
          return interaction.reply({
            content: "Could not find this channel.",
            ephemeral: true
          });
        }

        await interaction.channel.send({
          embeds: [createProductEmbed(product)]
        });

        await interaction.reply({
          content: `✅ ${product.title} product card posted.`,
          ephemeral: true
        });

        return;
      }
    }

    // --------------------------------------
    // /SETUP — TICKET PANEL
    // --------------------------------------

    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "setup"
    ) {
      const ticketEmbed = new EmbedBuilder()
        .setColor(0x7B2CFF)
        .setTitle("Ryvora Support")
        .setDescription(
          "**How Do I Purchase?**\n" +
          "Press the menu below and choose the option that fits your needs.\n\n" +
          "**Payment Methods Accepted:**\n" +
          "Contact our team for the currently available payment methods."
        )
        .setFooter({ text: "Ryvora • Ticket Support" });

      if (TICKET_IMAGE_URL) {
        ticketEmbed.setImage(TICKET_IMAGE_URL);
      }

      const ticketMenu = new StringSelectMenuBuilder()
        .setCustomId("ryvora_ticket_category")
        .setPlaceholder("Choose a ticket category")
        .addOptions(
          {
            label: "Purchase",
            description: "Questions about purchasing",
            value: "purchase",
            emoji: "🛒"
          },
          {
            label: "Pre-Sale Question",
            description: "Ask before purchasing",
            value: "pre_sale",
            emoji: "❓"
          },
          {
            label: "Support",
            description: "General support",
            value: "support",
            emoji: "👤"
          },
          {
            label: "HWID Reset",
            description: "Request an HWID reset",
            value: "hwid_reset",
            emoji: "🔑"
          },
          {
            label: "Media/Reseller",
            description: "Media or reseller inquiries",
            value: "media_reseller",
            emoji: "📦"
          }
        );

      await interaction.channel.send({
        embeds: [ticketEmbed],
        components: [
          new ActionRowBuilder().addComponents(ticketMenu)
        ]
      });

      await interaction.reply({
        content: "✅ Ticket panel sent successfully.",
        ephemeral: true
      });

      return;
    }

    
    // --------------------------------------
    // /VERIFY — VERIFICATION PANEL
    // --------------------------------------

    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "verify"
    ) {
      await interaction.deferReply({ ephemeral: true });

      try {
        const verifyImageUrl = process.env.VERIFY_IMAGE_URL;

        const verifyEmbed = new EmbedBuilder()
          .setColor(0x8B2CFF)
          .setAuthor({
            name: "RYVORA",
            iconURL: interaction.client.user.displayAvatarURL()
          })
          .setTitle("👋 Welcome to RYVORA!")
          .setDescription(
            "## Verify To Access RYVORA!\n\n" +
            "Before you can access the server, you must receive " +
            "roles by pressing the **Verify** button below.\n\n" +
            "Once you verify, you'll receive your member roles " +
            "and unlock the rest of the server.\n\n" +
            "Before getting started, make sure to read the " +
            "**Server Rules & Hопout Rules**. You can also grab " +
            "extra roles and check the FAQ if you have any questions.\n\n" +
            "**Press the Verify button below to get verified and " +
            "gain access to RYVORA.**"
          )
          .setFooter({
            text: "RYVORA • Verification"
          });

        // Only use a direct image URL, such as a Discord CDN URL.
        if (
          verifyImageUrl &&
          /^https?:\/\/\S+\.(png|jpe?g|gif|webp)(\?\S*)?$/i.test(
            verifyImageUrl
          )
        ) {
          verifyEmbed.setThumbnail(verifyImageUrl);
          verifyEmbed.setImage(verifyImageUrl);
        }

        const verifyButton = new ButtonBuilder()
          .setCustomId("ryvora_verify")
          .setLabel("Verify")
          .setEmoji("✅")
          .setStyle(ButtonStyle.Success);

        await interaction.channel.send({
          embeds: [verifyEmbed],
          components: [
            new ActionRowBuilder().addComponents(verifyButton)
          ]
        });

        await interaction.editReply(
          "✅ Verification panel sent successfully."
        );
      } catch (error) {
        console.error(
          "VERIFY PANEL ERROR:",
          JSON.stringify(
            error.rawError || {
              message: error.message,
              code: error.code
            },
            null,
            2
          )
        );

        await interaction.editReply(
          "❌ Failed to send verification panel. Check the console for details."
        );
      }

      return;
    }

    // --------------------------------------
    // VERIFY BUTTON
    // --------------------------------------

    if (
      interaction.isButton() &&
      interaction.customId === "ryvora_verify"
    ) {
      const guild = interaction.guild;
      const member = interaction.member;

      if (!guild || !member) {
        return interaction.reply({
          content: "❌ Could not find the server/member.",
          ephemeral: true
        });
      }

      const botMember = await getBotMember(guild);
      const verifyRole = guild.roles.cache.get(VERIFY_ROLE_ID);

      if (!botMember || !verifyRole) {
        return interaction.reply({
          content: "❌ The bot member or Verify role could not be found.",
          ephemeral: true
        });
      }

      if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
          content: "❌ The bot needs the Manage Roles permission.",
          ephemeral: true
        });
      }

      if (botMember.roles.highest.position <= verifyRole.position) {
        return interaction.reply({
          content: "❌ Move the bot's highest role above the Verify role.",
          ephemeral: true
        });
      }

      if (member.roles.cache.has(VERIFY_ROLE_ID)) {
        return interaction.reply({
          content: "You are already verified.",
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        await member.roles.add(verifyRole, "Ryvora verification");

        await interaction.editReply(
          "✅ You have been successfully verified!"
        );
      } catch (error) {
        console.error("Verify error:", error);

        await interaction.editReply(
          `❌ Verification failed: ${error.message}`
        );
      }

      return;
    }

    // --------------------------------------
    // CREATE TICKET
    // --------------------------------------

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "ryvora_ticket_category"
    ) {
      const guild = interaction.guild;
      const member = interaction.member;

      if (!guild || !member) {
        return interaction.reply({
          content: "❌ Could not find the server/member.",
          ephemeral: true
        });
      }

      const botMember = await getBotMember(guild);

      if (
        !botMember ||
        !botMember.permissions.has(PermissionFlagsBits.ManageChannels)
      ) {
        return interaction.reply({
          content: "❌ The bot needs the Manage Channels permission.",
          ephemeral: true
        });
      }

      const ticketCategory = guild.channels.cache.get(TICKET_CATEGORY_ID);
      const staffRole = guild.roles.cache.get(STAFF_ROLE_ID);

      if (
        !ticketCategory ||
        ticketCategory.type !== ChannelType.GuildCategory
      ) {
        return interaction.reply({
          content: "❌ The configured ticket category is invalid.",
          ephemeral: true
        });
      }

      if (!staffRole) {
        return interaction.reply({
          content: "❌ The configured staff role could not be found.",
          ephemeral: true
        });
      }

      const selectedCategory = interaction.values[0];

      const categoryNames = {
        purchase: "Purchase",
        pre_sale: "Pre-Sale Question",
        support: "Support",
        hwid_reset: "HWID Reset",
        media_reseller: "Media/Reseller"
      };

      const categoryName =
        categoryNames[selectedCategory] || "Support";

      const existingTicket = guild.channels.cache.find(
        channel =>
          channel.type === ChannelType.GuildText &&
          channel.parentId === TICKET_CATEGORY_ID &&
          channel.topic === `ticket-owner:${member.id}`
      );

      if (existingTicket) {
        return interaction.reply({
          content: `You already have an open ticket: ${existingTicket}`,
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        const ticketChannel = await guild.channels.create({
          name: `ticket-${selectedCategory}-${member.id}`,
          type: ChannelType.GuildText,
          parent: TICKET_CATEGORY_ID,
          topic: `ticket-owner:${member.id}`,
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
                PermissionFlagsBits.ReadMessageHistory
              ]
            },
            {
              id: STAFF_ROLE_ID,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
              ]
            }
          ]
        });

        const ticketEmbed = new EmbedBuilder()
          .setColor(0x7B2CFF)
          .setTitle("🎫 Ryvora Support")
          .setDescription(
            `Hello ${member} 👋\n\n` +
            `**Category:** ${categoryName}\n\n` +
            "Your ticket has been created successfully.\n" +
            "A member of our support team will assist you shortly.\n\n" +
            "Use the button below to close the ticket."
          )
          .setFooter({ text: "Ryvora Support" });

        const closeButton = new ButtonBuilder()
          .setCustomId("ryvora_close_ticket")
          .setLabel("Close Ticket")
          .setEmoji("🔒")
          .setStyle(ButtonStyle.Danger);

        await ticketChannel.send({
          content: `<@${member.id}> <@&${STAFF_ROLE_ID}>`,
          embeds: [ticketEmbed],
          components: [
            new ActionRowBuilder().addComponents(closeButton)
          ]
        });

        await interaction.editReply(
          `✅ Your ${categoryName} ticket has been created: ${ticketChannel}`
        );
      } catch (error) {
        console.error("Ticket creation error:", error);

        await interaction.editReply(
          `❌ Ticket creation failed: ${error.message}`
        );
      }

      return;
    }

    // --------------------------------------
    // CLOSE TICKET
    // --------------------------------------

    if (
      interaction.isButton() &&
      interaction.customId === "ryvora_close_ticket"
    ) {
      const channel = interaction.channel;
      const member = interaction.member;

      if (
        !channel ||
        channel.type !== ChannelType.GuildText ||
        !channel.name.startsWith("ticket-")
      ) {
        return interaction.reply({
          content: "This button only works inside a ticket.",
          ephemeral: true
        });
      }

      const isStaff = member.roles.cache.has(STAFF_ROLE_ID);
      const isOwner =
        channel.topic === `ticket-owner:${member.id}`;

      if (!isStaff && !isOwner) {
        return interaction.reply({
          content: "Only the ticket owner or staff can close this ticket.",
          ephemeral: true
        });
      }

      await interaction.reply({
        content: "🔒 This ticket will be closed in 5 seconds."
      });

      setTimeout(async () => {
        try {
          await channel.delete("Ryvora ticket closed");
        } catch (error) {
          console.error("Failed to delete ticket:", error);
        }
      }, 5000);

      return;
    }
  } catch (error) {
    console.error("Interaction error:", error);

    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content: `❌ An unexpected error occurred: ${error.message}`,
          ephemeral: true
        });
      } catch (replyError) {
        console.error("Could not send error reply:", replyError);
      }
    }
  }
});

// ==========================================
// LOGIN
// ==========================================

client.login(TOKEN).catch(error => {
  console.error("❌ Failed to log in to Discord:", error);
});