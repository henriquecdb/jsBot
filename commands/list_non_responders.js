const { SlashCommandBuilder } = require('discord.js');
const { channelID, roleID, emojiID } = require('../config');
const { validateReaction, getNonResponders, generateAndSendReport } = require('../services/nonRespondersServices');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list_non_responders')
    .setDescription('Lista membros que não reagiram com o emoji na mensagem.')
    .addStringOption((option) =>
      option
        .setName("message_id")
        .setDescription("ID da mensagem para verificar os reatores")
        .setRequired(true)
    ),

  async execute(interaction, bot) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const guild = interaction.guild;
      const messageID = interaction.options.getString("message_id");

      const { reaction } = await validateReaction(bot, channelID, messageID, emojiID);
      const reactedUsers = await reaction.users.fetch();
      const nonResponders = await getNonResponders(guild, roleID, reactedUsers);
      await generateAndSendReport(interaction, nonResponders);

    } catch (error) {
      console.error("Erro ao processar a interação:", error);
      const errorMessage = `Ocorreu um erro: ${error.message}`;
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }
};