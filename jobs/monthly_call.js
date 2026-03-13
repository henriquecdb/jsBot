const schedule = require("node-schedule");
const moment = require("moment");
const fs = require("fs");
const { guildID, channelID, roleID, emojiID, relatorioChannelID } = require('../config.json');

module.exports = (bot) => {
  schedule.scheduleJob("0 3 25 * *", async () => {
    try {
      const guild = await bot.guilds.fetch(guildID);
      const channel = await guild.channels.fetch(channelID);
      const monthNames = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
      ];
      const month = monthNames[moment().month()];
      const msg = await channel.send(
        `📢 Esta é a Chamada Obrigatória do mês de **${month}**. Todos os <@&${roleID}> tem 7 dias para confirmar na reação abaixo que estão ativos. Caso contrário, podem receber 2 pontos de infração.\n`
      );
      await msg.react(`<:spts:${emojiID}>`);
      console.log(`Chamada de ${month} enviada. Mensagem ID: ${msg.id}`);

      // === PARTE QUE ENVIA DM NO PRIVADO DA GALERA
      const allMembers = await guild.members.fetch();
      const targetMembers = allMembers.filter(member => member.roles.cache.has(roleID) && !member.user.bot && member.id !== '422808933862735872');
      
      const dmMessage = `📢 Olá! A Chamada Obrigatória do mês de **${month}** começou.\n\nPor favor, vá até o canal <#${channelID}> e reaja na mensagem com o emoji SPTS para marcar sua presença!`;
      
      for (const [memberId, member] of targetMembers) {
        try {
          await member.send(dmMessage);
        } catch (error) {
          // Ignora caso a DM do membro seja fechada
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // === LISTA NON RESPONDERS ENVIADO AUTOMATICAMENTE 7 DIAS DEPOIS DA CHAMADA
      const dataRelatorio = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      schedule.scheduleJob(dataRelatorio, async () => {
        try {
          const relatorioChannel = await guild.channels.fetch(relatorioChannelID);
          const mensagemChamada = await channel.messages.fetch(msg.id);
          const reaction = mensagemChamada.reactions.cache.get(emojiID);

          if (!reaction) return;

          const reactedUsers = await reaction.users.fetch();
          const nonResponders = [];

          // Puxa a lista de membros novamente para estar atualizada
          const membrosAtuais = await guild.members.fetch();
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
          console.error("Erro ao gerar o relatório automático de 7 dias:", err);
        }
      });
    } catch (error) {
      console.error("Erro no job da chamada mensal:", error);
    }
  });

  bot.scheduledJobs.push("Chamada Mensal (Dia 25 às 03:00) + DMs e Relatório automático após 7 dias");
};