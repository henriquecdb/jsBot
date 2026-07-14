const required = [
  "GUILD_ID",
  "CHANNEL_ID",
  "ROLE_ID",
  "EMOJI_ID",
  "REPORT_CHANNEL_ID",
];

required.forEach((k) => {
  if (!process.env[k]) throw new Error(`Missing env var ${k}`);
});

module.exports = {
  guildID: process.env.GUILD_ID,
  channelID: process.env.CHANNEL_ID,
  reportChannelID: process.env.REPORT_CHANNEL_ID,
  roleID: process.env.ROLE_ID,
  emojiID: process.env.EMOJI_ID,
  inactiveRoleID: process.env.INACTIVE_ROLE_ID,
};
