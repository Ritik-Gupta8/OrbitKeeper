/**
 * Deadline Monitoring Agent
 *
 * Continuously monitors application deadlines and sends proactive reminders.
 * Runs on a cron schedule every 30 minutes.
 *
 * MCP tools used:
 *   - get_upcoming_deadlines   (find apps nearing deadline)
 *   - get_profile              (get user email from Firebase auth)
 *   - mark_reminder_sent       (prevent duplicate sends)
 *   - log_notification         (audit trail in MongoDB)
 *
 * Reminder rules:
 *   - 24h reminder: when deadline is ≤ 24h away (and not yet sent)
 *   - 12h reminder: when deadline is ≤ 12h away (and not yet sent)
 *
 * Email: Sends to user's Google account email (from Firebase Authentication)
 */

import cron from 'node-cron';
import admin from 'firebase-admin';
import mcpClient from '../mcp/mcpClient.js';
import { sendDeadlineReminder } from '../utils/emailer.js';

const MONITOR_INTERVAL = '*/2 * * * *'; // Every 30 minutes

const checkAndSendReminders = async () => {
  console.log(`[DeadlineMonitor] 🔍 Checking deadlines at ${new Date().toISOString()}`);

  try {
    // ── MCP Tool: get_upcoming_deadlines (check ALL users) ────────────────
    // Check 30 hours ahead to catch deadlines set to midnight tomorrow
    const deadlineResult = await mcpClient.callTool('get_upcoming_deadlines', { hoursAhead: 30 });

    if (!deadlineResult.count || deadlineResult.count === 0) {
      console.log('[DeadlineMonitor] No upcoming deadlines found.');
      return;
    }

    console.log(`[DeadlineMonitor] Found ${deadlineResult.count} application(s) with upcoming deadlines`);

    const now = new Date();

    for (const app of deadlineResult.applications) {
      // ── Get user email from Firebase Authentication ────────────────────────
      let userEmail = null;
      try {
        const userRecord = await admin.auth().getUser(app.userId);
        userEmail = userRecord.email;
      } catch (err) {
        console.log(`[DeadlineMonitor] Could not fetch user email for userId: ${app.userId}`);
        continue;
      }

      if (!userEmail) {
        console.log(`[DeadlineMonitor] No email found for user: ${app.userId}`);
        continue;
      }

      const deadline           = new Date(app.deadline);
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

      console.log(`[DeadlineMonitor] ${app.company} - ${app.role}: ${hoursUntilDeadline.toFixed(1)}h until deadline`);
      console.log(`[DeadlineMonitor]   → reminder24hSent: ${app.reminder24hSent}, reminder12hSent: ${app.reminder12hSent}`);

      // ── 24-Hour Reminder (20-24 hours before deadline) ────────────────────
      if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 20 && !app.reminder24hSent) {
        console.log(`[DeadlineMonitor]   → ✅ Triggering 24h reminder (${hoursUntilDeadline.toFixed(1)}h remaining)`);
        await triggerReminder(app, '24h', '24 Hours', userEmail);
      } else if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 20) {
        console.log(`[DeadlineMonitor]   → ⏭️  Skipping 24h reminder (already sent)`);
      }

      // ── 12-Hour Reminder (10-12 hours before deadline) ────────────────────
      if (hoursUntilDeadline <= 12 && hoursUntilDeadline > 10 && !app.reminder12hSent) {
        console.log(`[DeadlineMonitor]   → ✅ Triggering 12h reminder (${hoursUntilDeadline.toFixed(1)}h remaining)`);
        await triggerReminder(app, '12h', '12 Hours', userEmail);
      } else if (hoursUntilDeadline <= 12 && hoursUntilDeadline > 10) {
        console.log(`[DeadlineMonitor]   → ⏭️  Skipping 12h reminder (already sent)`);
      }
    }
  } catch (error) {
    console.error('[DeadlineMonitor] Error during check:', error.message);
  }
};

const triggerReminder = async (app, type, remainingTime, userEmail) => {
  console.log(`[DeadlineMonitor] 📧 Sending ${type} reminder to ${userEmail} for ${app.company} — ${app.role}`);

  try {
    // Send email (or skip if not configured)
    const emailResult = await sendDeadlineReminder({
      to:            userEmail,
      company:       app.company,
      role:          app.role,
      deadline:      app.deadline,
      remainingTime,
      applicationId: app._id,
    });

    // If email was skipped (not configured), still mark as sent to avoid spam
    const emailStatus = emailResult?.skipped ? 'skipped' : 'sent';
    
    if (emailResult?.skipped) {
      console.log(`[DeadlineMonitor] ⚠️  Email skipped (not configured)`);
    }

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
        status:           emailStatus,
      },
    });

    console.log(`[DeadlineMonitor] ✅ ${type} reminder logged for ${app.company}`);
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
