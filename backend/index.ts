import { router, json, error, requireAuth, db } from '@appdeploy/sdk';

function activityTable(userId: string) {
  const safeId = userId.replace(/[^A-Za-z0-9_-]/g, '_');
  return `activities_${safeId}`;
}

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],

  'GET /api/activities': [
    requireAuth(),
    async ctx => {
      const table = activityTable(ctx.user!.userId);
      const result = await db.list(table, { limit: 50 });
      const items = result.items.sort((a, b) =>
        String(b.completedAt).localeCompare(String(a.completedAt))
      );
      return json({ items });
    },
  ],

  'POST /api/activities': [
    requireAuth(),
    async ctx => {
      const body = (ctx.body || {}) as {
        title?: unknown;
        minutes?: unknown;
        category?: unknown;
      };
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const minutes = Number(body.minutes);
      const category =
        typeof body.category === 'string' ? body.category.trim() : 'Other';

      if (!title || title.length > 70)
        return error('Enter an activity name of 1 to 70 characters.', 400);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) {
        return error(
          'Activity duration must be between 1 and 240 minutes.',
          400
        );
      }
      if (!category || category.length > 30)
        return error('Choose a valid activity type.', 400);

      const activity = {
        title,
        minutes,
        category,
        completedAt: new Date().toISOString(),
      };
      const [id] = await db.add(activityTable(ctx.user!.userId), [activity]);
      if (!id)
        return error('The activity could not be saved. Please try again.', 503);
      return json({ activity: { ...activity, id } }, 201);
    },
  ],

  'DELETE /api/activities/:id': [
    requireAuth(),
    async ctx => {
      const id = ctx.params.id;
      if (!id || id.length > 128) return error('Invalid activity ID.', 400);
      const [deleted] = await db.delete(activityTable(ctx.user!.userId), [id]);
      if (!deleted) return error('Activity not found.', 404);
      return json({ deleted: true });
    },
  ],
});
