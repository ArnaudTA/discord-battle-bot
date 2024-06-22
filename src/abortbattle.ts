import { ChatInputCommandInteraction, SlashCommandBuilder, User, type Channel } from "discord.js"
import { battleIndex } from "./index.ts"

export const data = new SlashCommandBuilder()
  .setName('abortbattle')
  .setDescription('Abort battle in this channel')

export const execute = async (interaction: ChatInputCommandInteraction) => {
  if (!interaction.inGuild()) return
  const channelBattle = battleIndex[interaction.channelId]
  if (!channelBattle) return
  if (channelBattle.author.id !== interaction.user.id) {
    interaction.reply('Only the author of the battle can abort it')
    return
  }
  delete battleIndex[interaction.channelId]
  interaction.reply('Current battle aborted')
}