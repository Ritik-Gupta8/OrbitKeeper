/**
 * Deadline Monitoring Agent
 *
 * Continuously monitors application deadlines and sends proactive reminders.
 * Runs on a cron schedule every 30 minutes.
 *
 * MCP tools used:
 *   - get_upcoming_deadlines   (find apps nearing deadline)
 *   - get_profile              (get user email)
 *   - mark_reminder_sent       (prevent duplicate sends)
 *   - log_notification         (audit trail in MongoDB)
 *
 * Reminder rules:
 *   - 24h reminder: when deadline is ≤ 24h away (and not yet sent)
 *   - 12h reminder: when deadline is ≤ 12h away (and not yet sent)
 */

import cron from 'node-cron';
import mcpClient from '../mcp/mcpClient.js';
import { sendDeadlineReminder } from '../utils/emailer.js';

const MONITOR_INTERVAL = '*/30 * * * *'; // Every 30 minutes

const checkAndSendReminders = async () => {
  console.log(`[DeadlineMonitor] 🔍 Checking deadlines at ${new Date().toISOString()}`);

  try {
    // ── MCP Tool: get_upcoming_deadlines ─────────────────────────────────────
    const deadlineResult = await mcpClient.callTool('get_upcoming_deadlines', { hoursAhead: 25 });

    if (!deadlineResult.count || deadlineResult.count === 0) {
      console.log('[DeadlineMonitor] No upcoming deadlines found.');
      return;
    }

    // ── MCP Tool: get_profile — fetch user email ──────────────────────────────
    const profileResult = await mcpClient.callTool('get_profile', { userId: 'default' });
    const userEmail     = profileResult.profile?.email;

    if (!userEmail) {
      console.log('[DeadlineMonitor] No user email set. Add email in Profile to receive reminders.');
      return;
    }

    const now = new Date();

    for (const app of deadlineResult.applications) {
      const deadline           = new Date(app.deadline);
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

      // ── 24-Hour Reminder ───────────────────────────────────────────────────
      if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 11 && !app.reminder24hSent) {
        await triggerReminder(app, '24h', '24 Hours', userEmail);
      }

      // ── 12-Hour Reminder ───────────────────────────────────────────────────
      if (hoursUntilDeadline <= 12 && hoursUntilDeadline > 0 && !app.reminder12hSent) {
        await triggerReminder(app, '12h', '12 Hours', userEmail);
      }
    }
  } catch (error) {
    console.error('[DeadlineMonitor] Error during check:', error.message);
  }
};

const triggerReminder = async (app, type, remainingTime, userEmail) => {
  console.log(`[DeadlineMonitor] 📧 Sending ${type} reminder for ${app.company} — ${app.role}`);

  try {
    // Send email
    await sendDeadlineReminder({
      to:            userEmail,
      company:       app.company,
      role:          app.role,
      deadline:      app.deadline,
      remainingTime,
      applicationId: app._id,
    });

    // ── MCP Tool: mark_reminder_sent ─────────────────────────────────────────
    await mcpClient.callTool('mark_reminder_sent', {
      applicationId: app._id,
      type,
    });

    // ── MCP Tool: log_notification ───────────────────────────────────────────
    await mcpClient.callTool('log_notification', {
      data: {
        applicationId:    app._id,
        company:          app.company,
        role:             app.role,
        notificationType: type === '24h' ? '24_hour_reminder' : '12_hour_reminder',
        channel:          'email',
        sentTo:           userEmail,
        status:           'sent',
      },
    });

    console.log(`[DeadlineMonitor] ✅ ${type} reminder sent for ${app.company}`);
  } catch (error) {
    console.error(`[DeadlineMonitor] ❌ Failed to send ${type} reminder for ${app.company}:`, error.message);

    // ── MCP Tool: log_notification (failure) ─────────────────────────────────
    await mcpClient.callTool('log_notification', {
      data: {
        applicationId:    app._id,
        company:          app.company,
        role:             app.role,
        notificationType: type === '24h' ? '24_hour_reminder' : '12_hour_reminder',
        channel:          'email',
        sentTo:           userEmail,
        status:           'failed',
        errorMessage:     error.message,
      },
    }).catch(() => {});
  }
};

export const startDeadlineMonitor = () => {
  // Small delay on first run — wait for MCP server to be ready
  setTimeout(checkAndSendReminders, 3000);

  cron.schedule(MONITOR_INTERVAL, checkAndSendReminders, {
    name:      'deadline-monitor',
    scheduled: true,
    timezone:  'UTC',
  });

  console.log('[DeadlineMonitor] Started. Checking every 30 minutes via MCP.');
};
