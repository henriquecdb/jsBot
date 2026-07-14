const { MessageFlags } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction, bot) {
    if (!interaction.isCommand()) return;
    const command = bot.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, bot);
    } catch (error) {
      console.error(
        `Erro ao executar comando ${interaction.commandName}:`,
        error,
      );
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "Houve um erro ao executar esse comando!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "Houve um erro ao executar esse comando!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
