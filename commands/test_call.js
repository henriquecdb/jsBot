const { SlashCommandBuilder } = require("discord.js");
const schedule = require("node-schedule");
const moment = require("moment");
const fs = require("fs");
const {
    guildID,
    channelID,
    roleID,
    emojiID,
    reportChannelID,
} = require("../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("test_call")
        .setDescription("Testa a chamada mensal instantaneamente"),

    async execute(interaction, bot) {
        await interaction.deferReply({ ephemeral: true });

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

            const msg = await channel.send(
                `📢 [TESTE] Esta é a Chamada Obrigatória do mês de **${month}**. Todos os <@&${roleID}> tem 7 dias para confirmar na reação abaixo que estão ativos.\n`,
            );
            await msg.react(emojiID);
            console.log(
                `[TESTE] Chamada de ${month} enviada. Mensagem ID: ${msg.id}`,
            );

            const allMembers = await guild.members.fetch();
            const targetMembers = allMembers.filter(
                (member) => member.roles.cache.has(roleID) && !member.user.bot,
            );

            const dmMessage = `📢 [TESTE] Chamada do mês de **${month}** começou!\n\nVá até <#${channelID}> e reaja para confirmar.`;

            for (const [memberId, member] of targetMembers) {
                try {
                    await member.send(dmMessage);
                } catch (error) {
                    console.error(
                        `Erro ao enviar DM para ${member.user.tag}:`,
                        error.message,
                    );
                }
                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            await interaction.editReply(
                `✅ Chamada de teste enviada! ID da mensagem: ${msg.id}`,
            );
        } catch (error) {
            console.error("Erro ao testar chamada:", error);
            await interaction.editReply(`❌ Erro: ${error.message}`);
        }
    },
};
