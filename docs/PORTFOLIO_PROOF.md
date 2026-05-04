# Portfolio Proof

This repository includes public-safe proof artifacts generated from demo mode.

## Proof Assets

- Home dashboard screenshot: `docs/screenshots/dashboard-home.jpg`
- Top content screenshot: `docs/screenshots/top-content.jpg`
- Listening history screenshot: `docs/screenshots/listening-history.jpg`
- Playlist manager screenshot: `docs/screenshots/playlists.jpg`
- Settings and exports screenshot: `docs/screenshots/settings.jpg`
- Mobile layout screenshot: `docs/screenshots/mobile-home.jpg`
- Demo recording: `docs/proof/spotify-analytics-demo.gif`

## Verification Performed

- Streamlit server started locally.
- Home page loaded successfully.
- Main dashboard pages loaded in a browser automation run.
- Mobile viewport rendered without layout failure.
- Demo-mode dashboard rendered without Spotify credentials.
- Python files compiled successfully.
- Data-processing tests passed.
- Public proof artifacts do not expose private Spotify listening data or OAuth tokens.

## Recruiter-Facing Summary

This project demonstrates a complete analytics workflow: OAuth authentication, API ingestion, local storage, data transformation, visualization, export workflows, and graceful handling of restricted third-party API endpoints.
