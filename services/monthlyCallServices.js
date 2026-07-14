const moment = require("moment");
const fs = require("fs");

async function sendMonthlyCallMessage(bot, channel, month, roleID, emojiID) {
  const msg = await channel.send(
    `📢 Esta é a Chamada Obrigatória do mês de **${month}**. Todos os <@&${roleID}> tem 7 dias para confirmar na reação abaixo que estão ativos. Caso contrário, podem receber 2 pontos de infração.\n`,
  );
  await msg.react(`<:spts:${emojiID}>`);
  console.log(`Chamada de ${month} enviada. Mensagem ID: ${msg.id}`);
  return msg.id;
}

async function safeFetchGuildMembers(guild) {
  const manager = guild.members;
  let attempt = 0;

  while (attempt < 3) {
    try {
      return await manager.fetch();
    } catch (err) {
      if (err.name === "GatewayRateLimitError" && err.data?.retry_after) {
        const waitMs = Math.ceil((err.data.retry_after + 1) * 1000);
        console.warn(
          `Rate limit ao buscar membros do guild. Aguardando ${waitMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        attempt += 1;
        continue;
      }
      throw err;
    }
  }

  return await manager.fetch();
}

async function sendDMsToMembers(bot, guild, channelID, month, roleID) {
  const allMembers =
    guild.members.cache.size > 0
      ? guild.members.cache
      : await safeFetchGuildMembers(guild);
  const targetMembers = allMembers.filter(
    (member) => member.roles.cache.has(roleID) && !member.user.bot && member.id,
  );

  const dmMessage = `📢 Olá! A Chamada Obrigatória do mês de **${month}** começou.\n\nPor favor, vá até o canal <#${channelID}> e reaja na mensagem com o emoji SPTS para marcar sua presença!`;

  for (const [memberId, member] of targetMembers) {
    try {
      await member.send(dmMessage);
    } catch (error) {
      console.error(
        `Erro ao enviar DM para ${member.user.tag}:`,
        error.message,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

function scheduleReport(
  bot,
  channel,
  msgID,
  emojiID,
  reportChannelID,
  month,
  roleID,
  startDate = new Date(),
) {
  const schedule = require("node-schedule");
  const dataRelatorio = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  return schedule.scheduleJob(dataRelatorio, async () => {
    await generateReport(
      bot,
      channel,
      msgID,
      emojiID,
      reportChannelID,
      month,
      roleID,
    );
  });
}

async function generateReport(
  bot,
  channel,
  msgID,
  emojiID,
  reportChannelID,
  month,
  roleID,
) {
  try {
    const relatorioChannel = await bot.channels.fetch(reportChannelID);
    const mensagemChamada = await channel.messages.fetch(msgID);
    let reaction = mensagemChamada.reactions.cache.find(
      (r) =>
        r.emoji.id === emojiID ||
        r.emoji.name === emojiID ||
        r.emoji.identifier === emojiID,
    );

    if (!reaction) {
      const fetchedReactions = await mensagemChamada.reactions.fetch();
      reaction = fetchedReactions.find(
        (r) =>
          r.emoji.id === emojiID ||
          r.emoji.name === emojiID ||
          r.emoji.identifier === emojiID,
      );
    }

    if (!reaction) {
      console.error(
        `Emoji de reação ${emojiID} não encontrado na mensagem ${msgID}.`,
      );
      return;
    }

    const reactedUsers = await reaction.users.fetch();
    const nonResponders = [];

    const guild = bot.guilds.cache.get(mensagemChamada.guildId);
    const membrosAtuais = await safeFetchGuildMembers(guild);
    membrosAtuais.forEach((member) => {
      if (member.user.bot) return;
      if (member.roles.cache.has(roleID) && !reactedUsers.has(member.id)) {
        nonResponders.push(member);
      }
    });

    if (nonResponders.length === 0) {
      return await relatorioChannel.send(
        `✅ O prazo da chamada de **${month}** acabou e TODOS os membros reagiram!`,
      );
    }

    const nonRespondersList = nonResponders
      .map((u) => `${u.displayName} (${u.id})`)
      .join("\n");
    const fileName = `pendentes_${month}.txt`;
    fs.writeFileSync(fileName, nonRespondersList);

    await relatorioChannel.send({
      content: `⚠️ O prazo da chamada de **${month}** encerrou.\nAqui está a lista dos **${nonResponders.length}** membros que **NÃO** reagiram:`,
      files: [{ attachment: fileName, name: fileName }],
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
  generateReport,
};
