import { faker } from "@faker-js/faker"
import { MessageReaction, ReactionCollector, ReactionEmoji, SlashCommandBuilder, SlashCommandIntegerOption, type ChatInputCommandInteraction, type PartialMessageReaction, type TextChannel, type User } from "discord.js"
import { animalCaracMods, generateChampion, type Champion } from "./champion"
import type { AsyncReturnType } from "./utils"
import { battleIndex, client } from "./index.ts"
import { BLOOD_EMOJI, CROSS_EMOJI, DAGUE_EMOJI, FIGHT_EMOJI, REFRESH_EMOJI, SEARCH_EMOJI, WIND_EMOJI } from "./emoji.ts"

export type AttackResult = {
  missed: boolean
  damage: number
}

type BattleStatus = 'preparing' | 'running' | 'finished'

const waiter = (time = 1000) => new Promise<void>((resolve, reject) => {
  setTimeout(() => {
    resolve(undefined)
  }, time);
})
const generateChampions = (nb: number) => {
  const champions: Champion[] = []
  do {
    const newChamp = generateChampion()
    if (!champions.find(champ => champ.animal === newChamp.animal)) {
      champions.push(newChamp)
    }
  } while (champions.length < nb);
  return champions.toSorted((a, b) => b.caracs.initiative - a.caracs.initiative)
}
const createBattle = async (
  { player_nb = 0, bot_nb = 0 }: { player_nb: number, bot_nb: number },
  interaction: ChatInputCommandInteraction & { channel: TextChannel },
  author: User
) => {
  if (!player_nb) player_nb = 0
  if (!bot_nb) bot_nb = 0
  await interaction.reply('Preparing champions ...')
  let status: BattleStatus = 'preparing'
  let tour: number = 0
  let topMessage = await interaction.channel.send('Training champions ...')
  const reactionCollector: ReactionCollector = new ReactionCollector(topMessage)
  const startTime = new Date(Date.now())

  const totalParticipants = player_nb + bot_nb
  let champions: Champion[] = generateChampions(totalParticipants + 1)

  setTimeout(async () => {
    await updateMessage('Choose your champion', { withChampions: true, renew: false })
    if (player_nb) {
      champions.forEach(({ animal }) => topMessage.react(animal))
    }
    topMessage.react(CROSS_EMOJI)
    topMessage.react(FIGHT_EMOJI)
    topMessage.react(REFRESH_EMOJI)
  }, 1000)

  const getAlives = () => champions.filter(({ getHealth }) => getHealth() > 0)
  const getRandomOpponent = (champion: Champion) => new Promise<number>((res, rej) => {
    const animalsAlived = getAlives()
    const possibleOpponents = animalsAlived.filter(({ animal }) => animal !== champion.animal)
    const opponent = faker.helpers.arrayElement(possibleOpponents)
    const championIdx = champions.findIndex(({ animal }) => animal === opponent.animal)
    setTimeout(() => {
      res(championIdx)
    }, 1000)
  })

  const attack = (attacker: Champion, defender: Champion) => new Promise<AttackResult>((res, rej) => {
    setTimeout(() => {
      res(Math.random() * 100 > defender.caracs.dodge
        ? {
          damage: attacker.caracs.attack,
          missed: false
        }
        : {
          damage: 0,
          missed: true
        })
    }, 1000)
  })

  const refreshChampions = async () => {
    champions = generateChampions(totalParticipants + 1)
    await topMessage.reactions.removeAll()
    await updateMessage('Choose your champion', { withChampions: true })
    if (player_nb) {
      champions.forEach(({ animal }) => topMessage.react(animal))
    }
    topMessage.react(CROSS_EMOJI)
    topMessage.react(FIGHT_EMOJI)
    topMessage.react(REFRESH_EMOJI)
  }

  const players = new Map<string, User>()

  const userSelectChampion = async (reaction: MessageReaction) => {
    const emoji = reaction.valueOf() as keyof typeof animalCaracMods
    const playerIds = Array.from(players.keys())
    const pendingCandidates = Array.from(reaction.users.cache.keys()).filter(user =>
      user !== (client.user?.id ?? '')
      && !playerIds.includes(user)
    )

    if (!pendingCandidates.length) return
    const champion = champions.find(champion => champion.animal === emoji)
    if (!champion) return
    if (!champion.isAvailable()) return
    const userId = pendingCandidates[0]
    const user = reaction.users.cache.get(userId)
    if (!user) return
    players.set(userId, user)
    champion.assignOwner(userId)

    const leftToChoose = player_nb - champions.filter(({ isAvailable }) => !isAvailable()).length
    if (!leftToChoose) return leftToChoose
    await updateMessage(`Choose your champion, left ${leftToChoose}`, { withChampions: true })
    reaction.remove()
  }

  const updateMessage = async (content: string, { withChampions = true, renew = false }) => {
    let message = content
    if (withChampions) {
      message += `\n${champions.map(c => c.toString()).join('\n')}`
    }
    if (renew) {
      const newTopMessage = await topMessage.channel.send(message)
      await topMessage.delete()
      topMessage = newTopMessage
      return
    }
    await topMessage.edit(message)
  }

  const abortbattle = async () => {
    topMessage.channel.send('Battle is aborted, shame on the planner')
    delete battleIndex[topMessage.channelId]
  }

  const nextTurn = async () => {
    tour++
    await updateMessage(`TOUR ${tour}, FIGHT...`, { withChampions: true, renew: true })
    for (const attacker of champions) {
      if (attacker.getHealth() <= 0) continue
      const fightMessage = await topMessage.channel.send(`${attacker.animal} ${SEARCH_EMOJI} ${SEARCH_EMOJI}`)
      const defenderIndex = await getRandomOpponent(attacker)
      const defender = champions[defenderIndex]
      await fightMessage.edit(`${attacker.animal} ${(FIGHT_EMOJI)} ${defender.animal}`)
      const result = await attack(attacker, defender)
      if (result.missed) {
        await fightMessage.edit(`${attacker.animal} ${WIND_EMOJI}${WIND_EMOJI}${WIND_EMOJI} ${defender.animal}`)
      } else {
        champions[defenderIndex].doDamage(result.damage, attacker.animal)
        await fightMessage.edit(`${attacker.animal} ${BLOOD_EMOJI}${DAGUE_EMOJI}${BLOOD_EMOJI} ${defender.animal} (-${result.damage})`)
      }
      await waiter()
      await fightMessage.delete()
      const alives = getAlives()

      if (alives.length < 2) return endBattle(alives)
      await updateMessage(`TOUR ${tour} ENDED, BREATHE...`, { withChampions: true, renew: false })
    }


    setTimeout(nextTurn, 5000)
  }
  const endBattle = async (alives: Champion[]) => {
    if (alives.length === 0) {
      await topMessage.edit('Ohhhh everybody seems to have perished, so sad ...')
    } else {
      const winner = alives[0]
      if (winner.getOwnerId().startsWith('Bot')) {
        if (champions.filter(({ getOwnerId }) => !getOwnerId().startsWith('Bot')).length) {
          await updateMessage(`The Bot won the game with his ${winner.animal}, you loser !`, { withChampions: true, renew: true })
        } else {
          await updateMessage(`${winner.getOwnerId()} won the game with his ${winner.animal} !`, { withChampions: true, renew: true })
        }
      }
      else {
        await updateMessage(`Congratulations <@${winner.getOwnerId()}> your ${winner.animal} won the battle in ${tour} tours!`, { withChampions: true, renew: true })
      }
    }
    status = 'finished'
  }
  const startBattle = async () => {
    status = 'running'
    const botsToAssign = faker.helpers.multiple(() => `Bot ${faker.person.firstName()}`, { count: bot_nb })
    champions = champions.reduce((acc, champion) => {
      if (!champion.isAvailable()) {
        acc.push(champion)
        return acc
      }
      if (botsToAssign.length) {
        champion.assignOwner(botsToAssign.pop())
        acc.push(champion)
        return acc
      }
      return acc
    }, [] as Champion[])

    nextTurn()
  }
  const manageReaction = async (reaction: MessageReaction) => {
    const emoji = reaction.valueOf()

    const isAdminReaction = reaction.users.cache.get(author.id)
    if (isAdminReaction && (emoji === FIGHT_EMOJI && status === 'preparing')) return startBattle()
    if (
      emoji === REFRESH_EMOJI &&
      (reaction.count !== 1 && reaction.me) &&
      (reaction.count ?? 1) - 1 >= Math.ceil(player_nb / 2) &&
      status === 'preparing'
    ) {
      await reaction.message.reactions.removeAll()
      return refreshChampions()
    }
    const lefts = await userSelectChampion(reaction)

    if (lefts === 0) startBattle()

  }
  const getStatus = () => status
  return {
    manageReaction,
    interaction,
    author,
    getStatus,
    player_nb,
    bot_nb,
    totalParticipants,
    startTime,
    reactionCollector,
  }
}

export type Battle = AsyncReturnType<typeof createBattle>

export const data = new SlashCommandBuilder()
  .setName(String('battle'))
  .setDescription('Start a battle with friends')
  .setDescriptionLocalizations({
    fr: 'Commencez une bataille avec des amis',
    "en-GB": 'Start battle with friends',
    "en-US": 'Start battle with friends',
    no: "Starter en krig med venner"
  })
  .addIntegerOption(new SlashCommandIntegerOption()
    .setDescription('Bot number').setName('bot_number')
    .setMaxValue(8).setMinValue(0)
  )
  .addIntegerOption(new SlashCommandIntegerOption()
    .setDescription('player number').setName('player_number')
    .setMaxValue(8).setMinValue(0)
  )

export const execute = async (interaction: ChatInputCommandInteraction) => {
  if (!interaction.inGuild()) return
  if (!interaction.channel || !interaction.user) return
  const channelBattle = battleIndex[interaction.channelId]
  if (channelBattle) {
    const status = channelBattle.getStatus()
    if (status === 'finished') {
      delete battleIndex[interaction.channelId]
      interaction.channel.send(`${interaction.user.username}, c'est reparti pour un tour`)
    }
    if (status === 'preparing' || status === 'running') {
      if (channelBattle.author.id === interaction.user.id) {
        interaction.channel.send(`${interaction.user.username}, A battle is already ${status}, type /abortbattle to abort it`)
      } else {
        interaction.channel.send(`${interaction.user.username}, A battle is already ${status} by an other user`)
      }
      return
    }
  }
  const bot_nb = interaction.options.data.find(({ name }) => name === 'bot_number')?.value as number ?? 0
  const player_nb = interaction.options.data.find(({ name }) => name === 'player_number')?.value as number ?? 0

  if (bot_nb + player_nb < 2) {
    interaction.reply('Total of bots and players must be at least 2')
    return
  }

  const battle = await createBattle({ bot_nb, player_nb }, interaction, interaction.user)
  battleIndex[interaction.channelId] = battle

}





