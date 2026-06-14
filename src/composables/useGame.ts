import { ref, computed } from 'vue'
import type { GameState, LogEntry, RandomEvent, ActionType, ActionEffect, SurvivalGoal, GoalProgress, GoalReward } from '@/types/game'
import { randomEvents } from '@/data/events'

const STORAGE_KEY_HIGH_SCORE = 'survival_game_high_score'
const MAX_STAT = 100

const survivalGoals: SurvivalGoal[] = [
  {
    id: 'survive_5',
    title: '初入荒野',
    description: '生存 5 回合',
    type: 'surviveTurns',
    target: 5,
    reward: { wood: 15, stone: 10 },
    icon: '🌱',
  },
  {
    id: 'survive_15',
    title: '荒野新手',
    description: '生存 15 回合',
    type: 'surviveTurns',
    target: 15,
    reward: { health: 20, wood: 20 },
    icon: '🌿',
  },
  {
    id: 'survive_30',
    title: '生存达人',
    description: '生存 30 回合',
    type: 'surviveTurns',
    target: 30,
    reward: { health: 30, stone: 25, wood: 25 },
    icon: '🌳',
  },
  {
    id: 'wood_50',
    title: '伐木工人',
    description: '累计采集 50 木材',
    type: 'gatherWood',
    target: 50,
    reward: { stone: 15, health: 10 },
    icon: '🪵',
  },
  {
    id: 'stone_40',
    title: '采石专家',
    description: '累计采集 40 石头',
    type: 'gatherStone',
    target: 40,
    reward: { wood: 15, health: 10 },
    icon: '⛏️',
  },
  {
    id: 'hunt_5',
    title: '猎人之路',
    description: '累计打猎 5 次',
    type: 'hunt',
    target: 5,
    reward: { hunger: -30, health: 15 },
    icon: '🏹',
  },
  {
    id: 'drink_8',
    title: '找水能手',
    description: '累计喝水 8 次',
    type: 'drink',
    target: 8,
    reward: { thirst: -40, health: 10 },
    icon: '💧',
  },
]

function formatRewardText(reward: GoalReward): string {
  const parts: string[] = []
  if (reward.health) parts.push(`❤️ 生命 +${reward.health}`)
  if (reward.hunger && reward.hunger < 0) parts.push(`🍖 饥饿 ${reward.hunger}`)
  if (reward.thirst && reward.thirst < 0) parts.push(`💧 口渴 ${reward.thirst}`)
  if (reward.wood && reward.wood > 0) parts.push(`🪵 木材 +${reward.wood}`)
  if (reward.stone && reward.stone > 0) parts.push(`🪨 石头 +${reward.stone}`)
  return parts.join('，')
}

const actionEffects: Record<ActionType, ActionEffect> = {
  gatherWood: {
    health: -5, hunger: 5, thirst: 3, wood: 10, stone: 0 },
  gatherStone: {
    health: -8, hunger: 6, thirst: 4, wood: 0, stone: 8 },
  hunt: {
    health: 15, hunger: -20, thirst: 5, wood: -5, stone: 0 },
  drink: {
    health: 0, hunger: 2, thirst: -25, wood: -3, stone: 0 },
}

const actionNames: Record<ActionType, string> = {
  gatherWood: '采集木头',
  gatherStone: '采集石头',
  hunt: '打猎',
  drink: '喝水',
}

function initGoalProgress(): GoalProgress[] {
  return survivalGoals.map(goal => ({
    goalId: goal.id,
    current: 0,
    completed: false,
    claimed: false,
  }))
}

function initActionCounts(): Record<ActionType, number> {
  return {
    gatherWood: 0,
    gatherStone: 0,
    hunt: 0,
    drink: 0,
  }
}

export function useGame() {
  const state = ref<GameState>({
    health: 80,
    hunger: 30,
    thirst: 30,
    wood: 10,
    stone: 5,
    turn: 0,
    isGameOver: false,
    logs: [],
    goalProgress: initGoalProgress(),
    actionCounts: initActionCounts(),
  })

  const highScore = ref<number>(0)
  let logIdCounter = 0

  const canAct = computed(() => !state.value.isGameOver)
  const goals = computed(() => survivalGoals)
  const completedGoalsCount = computed(() => state.value.goalProgress.filter(g => g.completed).length)

  function loadHighScore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGH_SCORE)
      if (saved) {
        highScore.value = parseInt(saved, 10) || 0
      }
    } catch (e) {
      highScore.value = 0
    }
  }

  function saveHighScore() {
    if (state.value.turn > highScore.value) {
      highScore.value = state.value.turn
      try {
        localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(highScore.value))
      } catch (e) {
        // ignore
      }
    }
  }

  function addLog(text: string, type: LogEntry['type'] = 'action') {
    state.value.logs.unshift({
      id: ++logIdCounter,
      text,
      type,
      turn: state.value.turn,
    })
    if (state.value.logs.length > 50) {
      state.value.logs.pop()
    }
  }

  function clampStat(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  function applyEffects(effects: ActionEffect) {
    if (effects.health !== undefined) {
      state.value.health = clampStat(state.value.health + effects.health, 0, MAX_STAT)
    }
    if (effects.hunger !== undefined) {
      state.value.hunger = clampStat(state.value.hunger + effects.hunger, 0, MAX_STAT)
    }
    if (effects.thirst !== undefined) {
      state.value.thirst = clampStat(state.value.thirst + effects.thirst, 0, MAX_STAT)
    }
    if (effects.wood !== undefined) {
      state.value.wood = Math.max(0, state.value.wood + effects.wood)
    }
    if (effects.stone !== undefined) {
      state.value.stone = Math.max(0, state.value.stone + effects.stone)
    }
  }

  function getRandomEvent(): RandomEvent {
    const index = Math.floor(Math.random() * randomEvents.length)
    return randomEvents[index]
  }

  function checkGameOver() {
    if (state.value.health <= 0 || state.value.hunger >= MAX_STAT || state.value.thirst >= MAX_STAT) {
      state.value.isGameOver = true
      saveHighScore()
      addLog('你没能在荒野中生存下来...', 'system')
    }
  }

  function updateGoalProgress(action: ActionType, turnAfterAction: number) {
    state.value.goalProgress.forEach(progress => {
      if (progress.completed) return

      const goal = survivalGoals.find(g => g.id === progress.goalId)
      if (!goal) return

      let newValue = progress.current
      switch (goal.type) {
        case 'surviveTurns':
          newValue = turnAfterAction
          break
        case 'gatherWood':
        case 'gatherStone':
        case 'hunt':
        case 'drink':
          if (goal.type === action) {
            newValue = progress.current + 1
          }
          break
      }
      progress.current = Math.min(newValue, goal.target)
    })
  }

  function checkAndCompleteGoals() {
    state.value.goalProgress.forEach(progress => {
      if (progress.completed) return

      const goal = survivalGoals.find(g => g.id === progress.goalId)
      if (!goal) return

      if (progress.current >= goal.target && !progress.completed) {
        progress.completed = true
        progress.claimed = true
        applyEffects(goal.reward)
        const rewardText = formatRewardText(goal.reward)
        addLog(`🎯 完成目标「${goal.title}」！奖励：${rewardText}`, 'goal')
      }
    })
  }

  function canPerformAction(action: ActionType): boolean {
    if (state.value.isGameOver) return false
    const effects = actionEffects[action]
    if (effects.wood !== undefined && state.value.wood + effects.wood < 0) {
      return false
    }
    if (effects.stone !== undefined && state.value.stone + effects.stone < 0) {
      return false
    }
    return true
  }

  function performAction(action: ActionType) {
    if (!canPerformAction(action)) return

    const effects = actionEffects[action]
    applyEffects(effects)
    state.value.turn++
    state.value.actionCounts[action]++

    addLog(`第 ${state.value.turn} 回合：${actionNames[action]}`, 'action')

    updateGoalProgress(action, state.value.turn)
    checkAndCompleteGoals()

    const event = getRandomEvent()
    applyEffects(event.effects)

    const eventLogType = event.type === 'good' ? 'good' : event.type === 'bad' ? 'bad' : 'event'
    addLog(event.text, eventLogType)

    checkGameOver()
  }

  function gatherWood() {
    performAction('gatherWood')
  }

  function gatherStone() {
    performAction('gatherStone')
  }

  function hunt() {
    performAction('hunt')
  }

  function drink() {
    performAction('drink')
  }

  function restart() {
    state.value = {
      health: 80,
      hunger: 30,
      thirst: 30,
      wood: 10,
      stone: 5,
      turn: 0,
      isGameOver: false,
      logs: [],
      goalProgress: initGoalProgress(),
      actionCounts: initActionCounts(),
    }
    logIdCounter = 0
    addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')
  }

  loadHighScore()
  addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')

  return {
    state,
    highScore,
    canAct,
    goals,
    completedGoalsCount,
    canPerformAction,
    gatherWood,
    gatherStone,
    hunt,
    drink,
    restart,
  }
}
