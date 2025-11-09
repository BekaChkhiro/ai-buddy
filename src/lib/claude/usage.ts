/**
 * Token Usage Tracking
 * Track and analyze Claude API token usage
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { UsageStats, ClaudeModel } from './types'
import { calculateTokenCost } from './config'

/**
 * Save token usage to database
 */
export async function saveTokenUsage(
  supabase: SupabaseClient,
  data: {
    userId: string
    projectId: string
    inputTokens: number
    outputTokens: number
    model: ClaudeModel
  }
): Promise<void> {
  try {
    await supabase.from('token_usage').insert({
      user_id: data.userId,
      project_id: data.projectId,
      input_tokens: data.inputTokens,
      output_tokens: data.outputTokens,
      total_tokens: data.inputTokens + data.outputTokens,
      model: data.model,
      cost: calculateTokenCost(data.model, data.inputTokens, data.outputTokens),
    })
  } catch (error) {
    console.error('Error saving token usage:', error)
    // Don't throw - token tracking is non-critical
  }
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(
  supabase: SupabaseClient,
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageStats> {
  try {
    let query = supabase
      .from('token_usage')
      .select('*')
      .eq('user_id', userId)

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString())
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error || !data) {
      throw error
    }

    const stats: UsageStats = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      requestCount: data.length,
      averageTokensPerRequest: 0,
    }

    data.forEach((record) => {
      stats.totalInputTokens += record.input_tokens
      stats.totalOutputTokens += record.output_tokens
      stats.totalTokens += record.total_tokens
      stats.totalCost += record.cost
    })

    stats.averageTokensPerRequest =
      stats.requestCount > 0 ? stats.totalTokens / stats.requestCount : 0

    return stats
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
      averageTokensPerRequest: 0,
    }
  }
}

/**
 * Get usage statistics for a project
 */
export async function getProjectUsageStats(
  supabase: SupabaseClient,
  projectId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageStats> {
  try {
    let query = supabase
      .from('token_usage')
      .select('*')
      .eq('project_id', projectId)

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString())
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error || !data) {
      throw error
    }

    const stats: UsageStats = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      requestCount: data.length,
      averageTokensPerRequest: 0,
    }

    data.forEach((record) => {
      stats.totalInputTokens += record.input_tokens
      stats.totalOutputTokens += record.output_tokens
      stats.totalTokens += record.total_tokens
      stats.totalCost += record.cost
    })

    stats.averageTokensPerRequest =
      stats.requestCount > 0 ? stats.totalTokens / stats.requestCount : 0

    return stats
  } catch (error) {
    console.error('Error fetching project usage stats:', error)
    return {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
      averageTokensPerRequest: 0,
    }
  }
}

/**
 * Check if user has exceeded usage limits
 */
export async function checkUsageLimits(
  supabase: SupabaseClient,
  userId: string,
  limits: {
    maxTokensPerDay?: number
    maxTokensPerMonth?: number
    maxCostPerDay?: number
    maxCostPerMonth?: number
  }
): Promise<{
  exceeded: boolean
  reason?: string
  current?: number
  limit?: number
}> {
  try {
    // Check daily limits
    if (limits.maxTokensPerDay || limits.maxCostPerDay) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const dailyStats = await getUserUsageStats(supabase, userId, today)

      if (limits.maxTokensPerDay && dailyStats.totalTokens >= limits.maxTokensPerDay) {
        return {
          exceeded: true,
          reason: 'Daily token limit exceeded',
          current: dailyStats.totalTokens,
          limit: limits.maxTokensPerDay,
        }
      }

      if (limits.maxCostPerDay && dailyStats.totalCost >= limits.maxCostPerDay) {
        return {
          exceeded: true,
          reason: 'Daily cost limit exceeded',
          current: dailyStats.totalCost,
          limit: limits.maxCostPerDay,
        }
      }
    }

    // Check monthly limits
    if (limits.maxTokensPerMonth || limits.maxCostPerMonth) {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const monthlyStats = await getUserUsageStats(supabase, userId, monthStart)

      if (limits.maxTokensPerMonth && monthlyStats.totalTokens >= limits.maxTokensPerMonth) {
        return {
          exceeded: true,
          reason: 'Monthly token limit exceeded',
          current: monthlyStats.totalTokens,
          limit: limits.maxTokensPerMonth,
        }
      }

      if (limits.maxCostPerMonth && monthlyStats.totalCost >= limits.maxCostPerMonth) {
        return {
          exceeded: true,
          reason: 'Monthly cost limit exceeded',
          current: monthlyStats.totalCost,
          limit: limits.maxCostPerMonth,
        }
      }
    }

    return { exceeded: false }
  } catch (error) {
    console.error('Error checking usage limits:', error)
    // On error, allow the request (fail open)
    return { exceeded: false }
  }
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`
}

/**
 * Format token count with commas
 */
export function formatTokenCount(count: number): string {
  return count.toLocaleString()
}
