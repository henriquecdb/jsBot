const moment = require("moment");

const channels = {
      PR_PROPOSAL: "856185518684504074",
      PR_APPLICATION: "1195765733712474274",
      SQUAD_PROPOSAL: "1018270570456035418",
      SQUAD_APPLICATION: "1195761430478205050",
      ARMA_PROPOSAL: "1194292103778406511",
      ARMA_APPLICATION:"1195766182729490493",
  };

const channelsId = Object.values(channels);

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message) {

    if (!channelsId.includes(message.channel.id)) {
      return;
    }

    try {
      await Promise.allSettled([
        message.react("✅"),
        message.react("❌"),
      ]);
      const postDate = moment(message.createdAt).format("DD/MM/YYYY");
      const threadName = `${message.author.displayName} (${postDate})`;
      
      if (message.hasThread || message.thread) {
        return;
      }

      await message.startThread({ name: threadName });
    } catch (error) {
      console.error(
        `Não foi possível criar a thread para a mensagem ${message.id}:`,
        error
      );
    }
  },
};
