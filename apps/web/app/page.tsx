export const HomePage = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        Adaptive Training Plan
      </h1>
      <p style={{ fontSize: '1.25rem', lineHeight: '1.6', color: '#666' }}>
        Welcome to the Adaptive Training Plan platform. We help runners
        intelligently adjust their training plans based on recent performance
        and health data from Strava.
      </p>
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Coming Soon</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>Connect your Strava account</li>
          <li>Upload your training plan</li>
          <li>Get AI-powered weekly recommendations</li>
        </ul>
      </div>
    </div>
  );
};

export default HomePage;
