import { Router, type Request, type Response } from 'express';

import { strava } from '../config/strava';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// GET /api/activities - Fetch activities from Strava (last 30 days)
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { stravaAccessToken } = req.user;

    // Calculate timestamp for 30 days ago
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

    // Fetch activities from Strava
    const activities = await (strava as any).athlete.listActivities({
      access_token: stravaAccessToken,
      after: thirtyDaysAgo,
      per_page: 200,
    });

    // Format activity data
    const formattedActivities = activities.map((activity: any) => ({
      id: activity.id,
      name: activity.name,
      distance: activity.distance,
      movingTime: activity.moving_time,
      type: activity.type,
      startDate: activity.start_date,
      averageHeartrate: activity.average_heartrate || null,
    }));

    res.json({ activities: formattedActivities });
  } catch (error) {
    console.error('Error fetching activities from Strava:', error);

    if ((error as any).statusCode === 401) {
      res.status(401).json({ error: 'Strava access token expired or invalid' });
      return;
    }

    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

export { router as activitiesRouter };
