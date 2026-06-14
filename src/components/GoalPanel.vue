<script setup lang="ts">
import type { SurvivalGoal, GoalProgress } from '@/types/game'

interface Props {
  goals: SurvivalGoal[]
  goalProgress: GoalProgress[]
  completedCount: number
}

const props = defineProps<Props>()

function getProgress(goalId: string): GoalProgress | undefined {
  return props.goalProgress.find(g => g.goalId === goalId)
}

function getProgressPercent(goal: SurvivalGoal): number {
  const progress = getProgress(goal.id)
  if (!progress) return 0
  return Math.min(100, (progress.current / goal.target) * 100)
}

function getProgressText(goal: SurvivalGoal): string {
  const progress = getProgress(goal.id)
  if (!progress) return `0/${goal.target}`
  return `${progress.current}/${goal.target}`
}

function isCompleted(goalId: string): boolean {
  const progress = getProgress(goalId)
  return progress?.completed ?? false
}

function formatReward(goal: SurvivalGoal): string {
  const parts: string[] = []
  if (goal.reward.health) parts.push(`❤️+${goal.reward.health}`)
  if (goal.reward.hunger && goal.reward.hunger < 0) parts.push(`🍖${goal.reward.hunger}`)
  if (goal.reward.thirst && goal.reward.thirst < 0) parts.push(`💧${goal.reward.thirst}`)
  if (goal.reward.wood && goal.reward.wood > 0) parts.push(`🪵+${goal.reward.wood}`)
  if (goal.reward.stone && goal.reward.stone > 0) parts.push(`🪨+${goal.reward.stone}`)
  return parts.join(' ')
}
</script>

<template>
  <div class="bg-game-card rounded-2xl p-6 border border-game-border shadow-xl">
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-xl font-bold text-white flex items-center gap-2">
        <span>🎯</span>
        <span>生存目标</span>
      </h2>
      <span class="text-sm px-3 py-1 rounded-full bg-green-900/40 text-green-400 font-medium">
        已完成 {{ completedCount }}/{{ goals.length }}
      </span>
    </div>
    <div class="space-y-3">
      <div
        v-for="goal in goals"
        :key="goal.id"
        :class="[
          'p-3 rounded-xl border transition-all duration-300',
          isCompleted(goal.id)
            ? 'bg-green-900/20 border-green-800/50'
            : 'bg-gray-800/50 border-game-border',
        ]"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ goal.icon }}</span>
            <div>
              <p
                :class="[
                  'font-semibold text-sm',
                  isCompleted(goal.id) ? 'text-green-400' : 'text-white',
                ]"
              >
                {{ goal.title }}
                <span v-if="isCompleted(goal.id)" class="ml-1">✓</span>
              </p>
              <p class="text-gray-400 text-xs">{{ goal.description }}</p>
            </div>
          </div>
          <span
            :class="[
              'text-xs font-mono tabular-nums flex-shrink-0',
              isCompleted(goal.id) ? 'text-green-400' : 'text-gray-300',
            ]"
          >
            {{ getProgressText(goal) }}
          </span>
        </div>
        <div class="h-1.5 bg-gray-700/50 rounded-full overflow-hidden mb-2">
          <div
            :class="[
              'h-full rounded-full transition-all duration-500 ease-out',
              isCompleted(goal.id) ? 'bg-green-500' : 'bg-cyan-500',
            ]"
            :style="{ width: `${getProgressPercent(goal)}%` }"
          ></div>
        </div>
        <div class="text-xs text-yellow-400/80 flex items-center gap-1">
          <span>🎁</span>
          <span>{{ formatReward(goal) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
