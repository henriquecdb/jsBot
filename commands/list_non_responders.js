//comando discord para retornar lista de quem não respondeu

const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const { channelID, roleID, emojiID } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("list_non_responders")
        .setDescription(
            "Lista membros que não reagiram com o emoji na mensagem.",
        )
        .addStringOption((option) =>
            option
                .setName("message_id")
                .setDescription("ID da mensagem para verificar os reatores")
                .setRequired(true),
        ),

    async execute(interaction, bot) {
        try {
            await interaction.deferReply({ ephemeral: true });

      const messageID = interaction.options.getString("message_id");
      const channel = await bot.channels.fetch(channelID);
      const message = await channel.messages.fetch(messageID);
      const reaction = message.reactions.cache.get(emojiID);

      if (!reaction) {
        return await interaction.editReply({ 
            content: `O emoji não foi encontrado nesta mensagem.` 
        });
      }

      const guild = interaction.guild;
      const users = await guild.members.fetch();
      const reactedUsers = await reaction.users.fetch();
      const nonResponders = [];

      users.forEach((user) => {
        if (user.user.bot) return;
        if (user.roles.cache.has(roleID) && !reactedUsers.has(user.id)) {
          nonResponders.push(user);
        }
      });

      if (nonResponders.length === 0) {
        return await interaction.editReply({ content: "Todos os membros com o cargo especificado já reagiram à mensagem!" });
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

      fs.unlinkSync("non_responders.txt");

    } catch (error) {
      console.error("Erro ao processar a interação:", error);
      await interaction.editReply({ content: `Ocorreu um erro: ${error.message}` });

      if (interaction.replied) {
        await interaction.editReply({ content: error.message });
      } else {
        await interaction.reply({ content: error.message, ephemeral: true });
      }
    }
  }
};
