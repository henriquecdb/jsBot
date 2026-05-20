const schedule = require("node-schedule");
const moment = require("moment");
const { guildID, channelID, roleID, emojiID, reportChannelID } = require('../config');
const { sendMonthlyCallMessage, sendDMsToMembers, scheduleReport } = require('../services/monthlyCallServices');

module.exports = (bot) => {
  schedule.scheduleJob("0 0 25 * *", async () => {
    try {
      const guild = await bot.guilds.fetch(guildID);
      const channel = await guild.channels.fetch(channelID);
      const monthNames = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
      ];

      const month = monthNames[moment().month()];
      const msgID = await sendMonthlyCallMessage(bot, channel, month, roleID, emojiID);
      await sendDMsToMembers(bot, guild, channelID, month, roleID);
      scheduleReport(bot, channel, msgID, emojiID, reportChannelID, month, roleID);
      
    } catch (error) {
      console.error("Erro no job da chamada mensal:", error);
    }
  });

  bot.scheduledJobs.push("Chamada Mensal (Dia 25 às 00:00) + DMs e Relatório automático após 7 dias");
};