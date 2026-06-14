export type GoalType = 'surviveTurns' | 'gatherWood' | 'gatherStone' | 'hunt' | 'drink'

export interface GoalReward {
  health?: number
  hunger?: number
  thirst?: number
  wood?: number
  stone?: number
}

export interface SurvivalGoal {
  id: string
  title: string
  description: string
  type: GoalType
  target: number
  reward: GoalReward
  icon: string
}

export interface GoalProgress {
  goalId: string
  current: number
  completed: boolean
  claimed: boolean
}

export interface GameState {
  health: number
  hunger: number
  thirst: number
  wood: number
  stone: number
  turn: number
  isGameOver: boolean
  logs: LogEntry[]
  goalProgress: GoalProgress[]
  actionCounts: Record<ActionType, number>
}

export interface LogEntry {
  id: number
  text: string
  type: 'action' | 'event' | 'system' | 'good' | 'bad' | 'goal'
  turn: number
}

export interface RandomEvent {
  id: string
  text: string
  type: 'good' | 'bad' | 'neutral'
  effects: {
    health?: number
    hunger?: number
    thirst?: number
    wood?: number
    stone?: number
  }
}

export type ActionType = 'gatherWood' | 'gatherStone' | 'hunt' | 'drink'

export interface ActionEffect {
  health?: number
  hunger?: number
  thirst?: number
  wood?: number
  stone?: number
}
