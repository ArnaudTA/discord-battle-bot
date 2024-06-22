import { faker } from "@faker-js/faker"
import { DAGUE_EMOJI, HEART_EMOJI, SKULL_EMOJI } from "./emoji.ts"

// const animalChoice = Object.keys(faker.animal.).slice(1,-1)

export const getAnimal = () => faker.helpers.arrayElement(animals)
export const getName = () => faker.person.middleName()

export type Caracs = {
  maxHealth: number,
  attack: number,
  dodge: number,
  initiative: number
}
export type Champion = ReturnType<typeof generateChampion>
export const generateChampion = () => {
  const animal = getAnimal()
  const animalCarac = animalCaracMods[animal]
  const firstName = getName()
  const name = `${animal} ${firstName}`
  // const alias = `the ${getTitle()}`
  const color = faker.number.int({ min: 100, max: 255 * 255 * 255 - 1000 })
  let caracPoints = (animalCarac.attack + animalCarac.dodge + animalCarac.maxHealth) * 8
  let health = 0
  let ownerId = ''
  let killer = ''
  const caracs: Caracs = {
    attack: 0,
    dodge: 0,
    initiative: 0,
    maxHealth: 0,
  }
  const addAttack = () => {
    caracPoints--
    caracs.attack += 0.4
  }
  const addDodge = () => {
    caracPoints--
    caracs.dodge++
  }
  const addHealth = () => {
    caracPoints--
    caracs.maxHealth++
  }
  const rollCarac = () => {
    const roll20 = Math.random() * (animalCarac.attack + animalCarac.dodge + animalCarac.maxHealth)
    if (roll20 < animalCarac.attack) return addAttack
    if (roll20 < animalCarac.attack + animalCarac.dodge) return addDodge
    return addHealth
  }
  addAttack()
  addDodge()
  addHealth()
  while (caracPoints > 0) {
    rollCarac()()
  }
  const toString = () => championString({
    caracs,
    firstName,
    animal,
    health,
    ownerId,
    killer,
  }) as string
  Object.keys(caracs).forEach(key => caracs[key] = Math.round(caracs[key]))
  health = caracs.maxHealth
  const getHealth = () => health
  const assignOwner = (userId: string) => {
    ownerId = userId
  }

  const isAvailable = () => !ownerId
  const doDamage = (damage: number, murderer: Animals) => {
    health -= damage
    if (health <= 0) {
      killer = murderer
    }
  }
  const getOwnerId = () => ownerId
  const setKiller = (emoji: Animals) => killer = emoji
  return {
    setKiller,
    getOwnerId,
    doDamage,
    isAvailable,
    assignOwner,
    getHealth,
    toString,
    color,
    animal,
    name,
    caracs,
    health,
    ownerId,
    killer,
    firstName
  }
}

export const championString = (champ: Pick<Champion, 'caracs' | 'animal' | 'firstName' | 'health' | 'ownerId' | 'killer'>, { onlyMaxHealth } = { onlyMaxHealth: true }): string => {
  const caracs = [
    onlyMaxHealth
      ? champ.health > 0
        ? `${HEART_EMOJI} ${champ.health} / ${champ.caracs.maxHealth}`.padEnd(15, ' ')
        : `${SKULL_EMOJI} ${champ.health} / ${champ.caracs.maxHealth} (${champ.killer})`.padEnd(15, ' ')
      : `💚 ${champ.caracs.maxHealth}`.padEnd(15, ''),
    `${DAGUE_EMOJI} ${champ.caracs.attack}`.padEnd(10, ' '),
    `🥷 ${champ.caracs.dodge}`.padEnd(5, ' '),
  ].join('')
  return [
    `${champ.animal}\`${champ.firstName.padEnd(15, ' ')}${caracs}\``,
    champ.ownerId
      ? champ.ownerId.startsWith('Bot')
        ? champ.ownerId
        : `<@${champ.ownerId}>`
      : ''
  ].join('   ')
}

export const animalCaracMods = {
  "🐌": { attack: 0, dodge: 0, maxHealth: 1, initiative: 0 },
  "🐘": { attack: 6, dodge: 0, maxHealth: 9, initiative: 0 },
  "🦕": { attack: 4, dodge: 0, maxHealth: 11, initiative: 0 },
  "🦣": { attack: 5, dodge: 0, maxHealth: 10, initiative: 0 },
  "🦥": { attack: 1, dodge: 0, maxHealth: 3, initiative: 0 },

  "🐢": { attack: 2, dodge: 6, maxHealth: 7, initiative: 1 },
  "🐳": { attack: 4, dodge: 0, maxHealth: 10, initiative: 1 },
  "🦏": { attack: 7, dodge: 0, maxHealth: 7, initiative: 1 },

  "🐂": { attack: 5, dodge: 2, maxHealth: 6, initiative: 2 },
  "🐊": { attack: 7, dodge: 2, maxHealth: 4, initiative: 2 },
  "🐐": { attack: 4, dodge: 5, maxHealth: 4, initiative: 2 },
  "🐪": { attack: 5, dodge: 2, maxHealth: 6, initiative: 2 },
  "🐫": { attack: 5, dodge: 2, maxHealth: 6, initiative: 2 },
  "🦆": { attack: 2, dodge: 2, maxHealth: 3, initiative: 2 },
  "🦍": { attack: 4, dodge: 3, maxHealth: 6, initiative: 2 },
  "🦒": { attack: 4, dodge: 2, maxHealth: 7, initiative: 2 },
  "🦔": { attack: 5, dodge: 4, maxHealth: 4, initiative: 2 },
  "🦤": { attack: 3, dodge: 7, maxHealth: 3, initiative: 2 },
  "🦧": { attack: 1, dodge: 2, maxHealth: 4, initiative: 2 },
  "🦫": { attack: 3, dodge: 6, maxHealth: 4, initiative: 2 },
  "🦭": { attack: 3, dodge: 5, maxHealth: 4, initiative: 2 },

  "🐄": { attack: 5, dodge: 2, maxHealth: 5, initiative: 3 },
  "🐅": { attack: 4, dodge: 4, maxHealth: 4, initiative: 3 },
  "🐎": { attack: 3, dodge: 4, maxHealth: 5, initiative: 3 },
  "🐕": { attack: 3, dodge: 6, maxHealth: 3, initiative: 3 },
  "🐙": { attack: 1, dodge: 8, maxHealth: 3, initiative: 3 },
  "🐧": { attack: 3, dodge: 5, maxHealth: 4, initiative: 3 },
  "🦃": { attack: 2, dodge: 6, maxHealth: 4, initiative: 3 },
  "🦌": { attack: 3, dodge: 4, maxHealth: 5, initiative: 3 },
  "🦖": { attack: 6, dodge: 2, maxHealth: 4, initiative: 3 },
  "🦙": { attack: 2, dodge: 4, maxHealth: 5, initiative: 3 },
  "🦩": { attack: 3, dodge: 5, maxHealth: 4, initiative: 3 },
  "🦬": { attack: 4, dodge: 2, maxHealth: 6, initiative: 3 },

  "🐍": { attack: 3, dodge: 4, maxHealth: 3, initiative: 4 },
  "🐏": { attack: 3, dodge: 4, maxHealth: 4, initiative: 4 },
  "🐑": { attack: 3, dodge: 4, maxHealth: 4, initiative: 4 },
  "🐓": { attack: 2, dodge: 7, maxHealth: 2, initiative: 4 },
  "🐬": { attack: 2, dodge: 5, maxHealth: 4, initiative: 4 },
  "🦈": { attack: 3, dodge: 3, maxHealth: 5, initiative: 4 },
  "🦉": { attack: 2, dodge: 6, maxHealth: 3, initiative: 4 },
  "🦚": { attack: 1, dodge: 7, maxHealth: 3, initiative: 4 },
  "🦜": { attack: 1, dodge: 8, maxHealth: 2, initiative: 4 },
  "🦡": { attack: 3, dodge: 5, maxHealth: 3, initiative: 4 },
  "🦢": { attack: 2, dodge: 5, maxHealth: 4, initiative: 4 },
  "🦦": { attack: 2, dodge: 7, maxHealth: 2, initiative: 4 },
  "🦨": { attack: 3, dodge: 5, maxHealth: 3, initiative: 4 },

  "🐀": { attack: 1, dodge: 9, maxHealth: 1, initiative: 5 },
  "🐁": { attack: 1, dodge: 9, maxHealth: 1, initiative: 5 },
  "🐒": { attack: 1, dodge: 7, maxHealth: 2, initiative: 5 },
  "🐝": { attack: 1, dodge: 8, maxHealth: 1, initiative: 5 },
  "🦅": { attack: 3, dodge: 5, maxHealth: 3, initiative: 5 },
  "🦇": { attack: 1, dodge: 8, maxHealth: 1, initiative: 5 },
  "🦎": { attack: 1, dodge: 8, maxHealth: 1, initiative: 5 },
  "🦘": { attack: 1, dodge: 7, maxHealth: 2, initiative: 5 },
  "🦛": { attack: 2, dodge: 4, maxHealth: 4, initiative: 5 },
  "🦟": { attack: 2, dodge: 7, maxHealth: 1, initiative: 5 },

  "🐇": { attack: 1, dodge: 7, maxHealth: 2, initiative: 7 },
}

type AnimalList = Array<keyof typeof animalCaracMods>
type Animals = AnimalList[number]
const animals: AnimalList = Object.keys(animalCaracMods) as Array<keyof typeof animalCaracMods>