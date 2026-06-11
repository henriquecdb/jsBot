const setupMonthlyCall = require("../jobs/monthly_call");

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(bot) {
    console.log(`${bot.user.tag} is ready and online!`);

    const commandsArray = bot.commands.map((command) =>
      command.data.toJSON(),
    );
    try {
      await bot.application.commands.set(commandsArray);
      console.log("Comandos registrados com sucesso.");
    } catch (error) {
      console.error("Erro ao registrar comandos:", error);
    }
    setupMonthlyCall(bot);
  },
};
