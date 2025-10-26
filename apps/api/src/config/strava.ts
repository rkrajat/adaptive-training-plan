import * as strava from 'strava-v3';

export const stravaConfig = {
  client_id: process.env.STRAVA_CLIENT_ID || '',
  client_secret: process.env.STRAVA_CLIENT_SECRET || '',
  redirect_uri: process.env.STRAVA_REDIRECT_URI || '',
};

export { strava };
