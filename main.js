const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
} = require("discord.js");
const { config } = require("dotenv");
const schedule = require("node-schedule");
const fs = require("fs");
const moment = require("moment");

config();

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
});

const guildID = "407878248480112642";
const channelID = "1055539833407295579";
const roleID = "1020194745722609684";
const emojiID = "863119583275384864";
const inactiveRoleID = "1299205797317840947";

let scheduledJobs = [];

bot.once("ready", () => {
  console.log(`${bot.user.tag} is ready and online!`);

  const commands = [
    new SlashCommandBuilder()
      .setName("list_non_responders")
      .setDescription(
        "Lista membros que não reagiram com o emoji especificado em uma mensagem.",
      )
      .addStringOption((option) =>
        option
          .setName("message_id")
          .setDescription("ID da mensagem para verificar os reatores")
          .setRequired(true),
      ),
    new SlashCommandBuilder()
      .setName("list_jobs")
      .setDescription("Lista todos os jobs agendados."),
  ];

  bot.application.commands
    .set(commands)
    .then(() => console.log("Comandos registrados com sucesso."))
    .catch(console.error);

  schedule.scheduleJob("0 3 25 * *", async () => {
    const guild = await bot.guilds.fetch(guildID);
    const channel = await guild.channels.fetch(channelID);
    const monthNames = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];
    const month = monthNames[moment().month()];
    const msg = await channel.send(
      `📢 Esta é a Chamada Obrigatória do mês de **${month}**. Todos os <@&1020194745722609684> tem 7 dias para confirmar na reação abaixo que estão ativos. Caso contrário, podem receber 2 pontos de infração.\n`,
    );
    await msg.react("<:spts:863119583275384864>");
  });
  scheduledJobs.push("Chamada obrigatória mensal");
});

bot.on("messageCreate", async (message) => {
  const channels = [
    "856185518684504074",
    "1018270570456035418",
    "1189596088584376340",
    "1194292103778406511",
    "1195761430478205050",
    "1195766388606898308",
    "1195765733712474274",
    "1195766182729490493",
  ];

  if (channels.includes(message.channel.id)) {
    await message.react("✅");
    await message.react("❌");
    const postDate = moment(message.createdAt).format("DD/MM/YYYY");
    const threadName = `${message.author.displayName} (${postDate})`;
    await message.startThread({ name: threadName });
  }
});

bot.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "list_non_responders") {
    try {
      await interaction.reply({
        content: `Processando a lista de membros...`,
        ephemeral: true,
      });

      const messageID = interaction.options.getString("message_id");
      const channel = await bot.channels.fetch(channelID);
      const message = await channel.messages.fetch(messageID);
      const reaction = message.reactions.cache.get(emojiID);

      if (!reaction) {
        return await interaction.editReply({
          content: `O emoji com ID ${emojiID} não foi encontrado nesta mensagem.`,
        });
      }

      const users = await message.guild.members.fetch();
      const reactedUsers = await reaction.users.fetch();
      const nonResponders = [];

      users.forEach((user) => {
        if (user.user.bot) return;

        if (user.roles.cache.has(roleID) && !reactedUsers.has(user.id)) {
          nonResponders.push(user);
        }
      });

      if (nonResponders.length === 0) {
        return await interaction.editReply({
          content:
            "Todos os membros com o cargo especificado já reagiram à mensagem!",
        });
      }

      const nonRespondersList = nonResponders
        .map((user) => `${user.displayName} (${user.id})`)
        .join("\n");

      fs.writeFileSync("non_responders.txt", nonRespondersList);

      await interaction.editReply({
        content: `Encontrados ${nonResponders.length} membros que não reagiram.`,
      });

      await interaction.followUp({
        content: "Aqui está o arquivo com a lista de membros:",
        files: [
          { attachment: "non_responders.txt", name: "non_responders.txt" },
        ],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Erro ao processar a interação:", error);
      const errorMessage = `Ocorreu um erro: ${error.message}`;

      if (interaction.replied) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }

  if (interaction.commandName === "list_jobs") {
    try {
      if (scheduledJobs.length > 0) {
        await interaction.reply({
          content: `Trabalhos agendados:\n${scheduledJobs.join("\n")}`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `Nenhum trabalho agendado no momento.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error("Erro ao listar jobs:", error);
      await interaction.reply({
        content: `Ocorreu um erro ao listar os jobs: ${error.message}`,
        ephemeral: true,
      });
    }
  }
});

bot.login(process.env.TOKEN);
