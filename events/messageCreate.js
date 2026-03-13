const moment = require("moment");

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message) {
    const channels = [
      "856185518684504074", "1018270570456035418", "1189596088584376340",
      "1194292103778406511", "1195761430478205050", "1195766388606898308",
      "1195765733712474274", "1195766182729490493",
    ];
    if (channels.includes(message.channel.id)) {
      await message.react("✅");
      await message.react("❌");
      const postDate = moment(message.createdAt).format("DD/MM/YYYY");
      const threadName = `${message.author.displayName} (${postDate})`;
      await message.startThread({ name: threadName });
    }
  },
};