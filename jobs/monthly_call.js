const schedule = require("node-schedule");
const moment = require("moment");
const {
  guildID,
  channelID,
  roleID,
  emojiID,
  reportChannelID,
} = require("../config");
const {
  sendMonthlyCallMessage,
  sendDMsToMembers,
  scheduleReport,
} = require("../services/monthlyCallServices");

module.exports = (bot) => {
  const cronRule = "0 0 0 25 * *";

  const job = schedule.scheduleJob(cronRule, async () => {
    try {
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
      const msgID = await sendMonthlyCallMessage(
        bot,
        channel,
        month,
        roleID,
        emojiID,
      );
      await sendDMsToMembers(bot, guild, channelID, month, roleID);
      scheduleReport(
        bot,
        channel,
        msgID,
        emojiID,
        reportChannelID,
        month,
        roleID,
      );
    } catch (error) {
      console.error("Erro no job da chamada mensal:", error);
    }
  });

  const nextRun = job.nextInvocation();
  const nextRunFormatted = nextRun.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  bot.scheduledJobs.push(
    `Chamada Mensal agendada para ${nextRunFormatted} + DMs e relatório automático 7 dias após a chamada`,
  );
};
