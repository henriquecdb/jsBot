const { MessageFlags } = require('discord.js');
const fs = require('fs');

async function validateReaction(bot, channelID, messageID, emojiID) {
  const channel = await bot.channels.fetch(channelID);
  const message = await channel.messages.fetch(messageID);
  const reaction = message.reactions.cache.get(emojiID);

  if (!reaction) {
    throw new Error('O emoji não foi encontrado nesta mensagem.');
  }

  return { reaction, message };
}

async function getNonResponders(guild, roleID, reactedUsers) {
  const users = await guild.members.fetch();
  const nonResponders = [];

  users.forEach((user) => {
    if (user.user.bot) return;
    if (user.roles.cache.has(roleID) && !reactedUsers.has(user.id)) {
      nonResponders.push(user);
    }
  });

  return nonResponders;
}

async function generateAndSendReport(interaction, nonResponders) {
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
    files: [{ attachment: "non_responders.txt", name: "non_responders.txt" }],
    flags: MessageFlags.Ephemeral,
  });

  fs.unlinkSync("non_responders.txt");
}

module.exports = {
  validateReaction,
  getNonResponders,
  generateAndSendReport,
};