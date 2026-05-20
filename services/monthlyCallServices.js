const moment = require("moment");
const fs = require("fs");

async function sendMonthlyCallMessage(bot, channel, month, roleID, emojiID) {
  const msg = await channel.send(
    `📢 Esta é a Chamada Obrigatória do mês de **${month}**. Todos os <@&${roleID}> tem 7 dias para confirmar na reação abaixo que estão ativos. Caso contrário, podem receber 2 pontos de infração.\n`
  );
  await msg.react(`<:spts:${emojiID}>`);
  console.log(`Chamada de ${month} enviada. Mensagem ID: ${msg.id}`);
  return msg.id;
}

async function sendDMsToMembers(bot, guild, channelID, month, roleID) {
  const allMembers = await guild.members.fetch();
  const targetMembers = allMembers.filter(member => 
    member.roles.cache.has(roleID) && !member.user.bot && member.id
  );
  
  const dmMessage = `📢 Olá! A Chamada Obrigatória do mês de **${month}** começou.\n\nPor favor, vá até o canal <#${channelID}> e reaja na mensagem com o emoji SPTS para marcar sua presença!`;
  
  for (const [memberId, member] of targetMembers) {
    try {
      await member.send(dmMessage);
    } catch (error) {
      console.error(`Erro ao enviar DM para ${member.user.tag}:`, error.message);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

function scheduleReport(bot, channel, msgID, emojiID, reportChannelID, month, roleID) {
  const schedule = require("node-schedule");
  const dataRelatorio = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  schedule.scheduleJob(dataRelatorio, async () => {
    await generateReport(bot, channel, msgID, emojiID, reportChannelID, month, roleID);
  });
}

async function generateReport(bot, channel, msgID, emojiID, reportChannelID, month, roleID) {
  try {
    const relatorioChannel = await bot.channels.fetch(reportChannelID);
    const mensagemChamada = await channel.messages.fetch(msgID);
    const reaction = mensagemChamada.reactions.cache.get(emojiID);

    if (!reaction) return;

    const reactedUsers = await reaction.users.fetch();
    const nonResponders = [];

    const membrosAtuais = await bot.guilds.cache.get(mensagemChamada.guildId).members.fetch();
    membrosAtuais.forEach(member => {
      if (member.user.bot) return;
      if (member.roles.cache.has(roleID) && !reactedUsers.has(member.id)) {
        nonResponders.push(member);
      }
    });

    if (nonResponders.length === 0) {
      return await relatorioChannel.send(`✅ O prazo da chamada de **${month}** acabou e TODOS os membros reagiram!`);
    }

    const nonRespondersList = nonResponders.map(u => `${u.displayName} (${u.id})`).join("\n");
    const fileName = `pendentes_${month}.txt`;
    fs.writeFileSync(fileName, nonRespondersList);

    await relatorioChannel.send({
      content: `⚠️ O prazo da chamada de **${month}** encerrou.\nAqui está a lista dos **${nonResponders.length}** membros que **NÃO** reagiram:`,
      files: [{ attachment: fileName, name: fileName }]
    });

    fs.unlinkSync(fileName);
  } catch (err) {
    console.error("Erro ao gerar relatório:", err);
  }
}

module.exports = {
  sendMonthlyCallMessage,
  sendDMsToMembers,
  scheduleReport,
  generateReport
};