const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list_jobs')
    .setDescription('Lista todos os jobs agendados.'),
  
  async execute(interaction, scheduledJobs) {
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
  },
};