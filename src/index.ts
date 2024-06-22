import { ChatInputCommandInteraction, Client, Events, type Channel, type SlashCommandOptionsOnlyBuilder } from "discord.js";
import * as battle from "./battle"
import * as abortbattle from "./abortbattle.ts"
import { readFileSync } from "fs";


export const battleIndex: Record<Channel['id'], battle.Battle> = {}

type Command = {
  data: SlashCommandOptionsOnlyBuilder
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

export const commands: Record<string, Command> = {}

export const client = new Client({
  intents: [
    "GuildMessages",
    "Guilds",
    "MessageContent",
    "GuildMessageReactions",
    "GuildModeration",
  ]
})

commands[battle.data.name] = battle
commands[abortbattle.data.name] = abortbattle


client.on("ready", () => {
  console.log("Ready to battle !");
  if (client.application?.id) {
    client.guilds.cache.forEach(async guild => {
      Object.values(commands).forEach(({ data }) => guild.commands.create(data))
    });
  }
});

let token: string | undefined
try {
  token = readFileSync('./config/token').toString().trim()
} catch (error) {
  token = process.env.TOKEN
}

if (!token) {
  console.error(Error('NEED TO SPECIFY A TOKEN'))
  process.exit(1)
}
client.login(token);


// client.on('guildCreate', async (guild) => // create commands when joining guild
//   Object.values(commands).forEach(command => guild.commands.create(command.data)))

type InteractionJSON = {
  commandName: string
}

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return
  const command = commands[interaction.commandName]
  if (!command) return
  try {
    await command.execute(interaction)
    // console.log(commands.get('battle'));
    // commands.get(command.commandName)(interaction)
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
})


client.on('messageReactionAdd', async (reaction) => {
  if (reaction.partial) return
  const channelBattle = battleIndex[reaction.message.channelId]
  channelBattle.manageReaction(reaction, 'add')
})

client.on('messageReactionRemove', async (reaction) => {
  if (reaction.partial) return
  const channelBattle = battleIndex[reaction.message.channelId]
  channelBattle.manageReaction(reaction, 'remove')
})

// client.on('messageReactionRemove', (reaction) => {
//   const channelBattle = battleIndex[reaction.message.channelId]
//   if(channelBattle?.status !== 'preparing') return
//   const championChoosed = channelBattle.messageChampions[reaction.message.id]
//   if (!championChoosed) return
// })

