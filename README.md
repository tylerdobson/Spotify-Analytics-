# Spotify Analytics Dashboard

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)
![Streamlit](https://img.shields.io/badge/Streamlit-1.31-FF4B4B?logo=streamlit&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Local%20analytics-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-111827)

A professional Streamlit dashboard for personal Spotify analytics. The app authenticates with Spotify, shows live playback, analyzes top tracks and artists, stores recently played history in SQLite, audits playlists, and exports listening data for deeper analysis.

This project is designed as a portfolio-ready example of OAuth API integration, local data persistence, data visualization, and product-minded dashboard design.

## Live Proof

The app is designed for local OAuth because Spotify redirects to a loopback callback during authentication.

- Demo screenshot: [docs/screenshots/dashboard-home.jpg](docs/screenshots/dashboard-home.jpg)
- Proof recording: [docs/proof/spotify-analytics-demo.gif](docs/proof/spotify-analytics-demo.gif)
- Validation notes: [docs/PORTFOLIO_PROOF.md](docs/PORTFOLIO_PROOF.md)

![Spotify Analytics dashboard screenshot](docs/screenshots/dashboard-home.jpg)

## Features

- Spotify OAuth with token caching through Spotipy.
- Current playback card with album art, track metadata, progress, and playback actions.
- Top tracks and artists for short, medium, and long Spotify time windows.
- Local listening history saved to SQLite from Spotify's recently played endpoint.
- Timeline, listening heatmap, monthly artist, genre, and month-over-month charts.
- Playlist manager with playlist export, backup snapshots, duplicate scanning, and mood playlist workflow.
- Discovery analysis for new artists, first-listen dates, and low-popularity favorite tracks.
- CSV and HTML report exports.
- Demo mode for screenshots, portfolio review, and UI exploration without exposing private Spotify data.

## Tech Stack

- Python
- Streamlit
- Spotipy
- Pandas
- Plotly
- SQLite
- HTML/CSS

## Project Structure

```text
Spotify-Analytics-/
|-- app.py
|-- config.py
|-- data_processor.py
|-- spotify_client.py
|-- visualizations.py
|-- oauth_callback_capture.py
|-- requirements.txt
|-- .env.example
|-- .gitignore
|-- data/
|   |-- .gitkeep
|   `-- cache/
|       `-- .gitkeep
|-- docs/
|   |-- API_LIMITATIONS.md
|   |-- PORTFOLIO_PROOF.md
|   |-- SETUP.md
|   |-- proof/
|   |   `-- spotify-analytics-demo.gif
|   `-- screenshots/
|       |-- dashboard-home.jpg
|       |-- top-content.jpg
|       |-- listening-history.jpg
|       |-- playlists.jpg
|       |-- settings.jpg
|       `-- mobile-home.jpg
`-- tests/
    `-- test_data_processor.py
```

## Setup

Create a Spotify app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

Use this redirect URI:

```text
http://127.0.0.1:8888/callback
```

Then configure the local environment:

```powershell
Copy-Item .env.example .env
```

Edit `.env`:

```text
SPOTIPY_CLIENT_ID=your_client_id_here
SPOTIPY_CLIENT_SECRET=your_client_secret_here
SPOTIPY_REDIRECT_URI=http://127.0.0.1:8888/callback
SPOTIFY_DEMO_MODE=false
```

Install and run:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
streamlit run app.py
```

Open:

```text
http://localhost:8501
```

## Demo Mode

Set this in `.env` to inspect the dashboard without Spotify credentials:

```text
SPOTIFY_DEMO_MODE=true
```

Demo mode uses realistic sample records and is safe for public screenshots.

## Testing

```powershell
python -m unittest discover -s tests
python -m compileall .
```

## Spotify API Limitation

Spotify restricted several Web API endpoints for many new apps, including Audio Features. If that endpoint returns `403`, the dashboard keeps working and shows a clear unavailable-state message on audio-feature views.

See [docs/API_LIMITATIONS.md](docs/API_LIMITATIONS.md).

## Security

Do not commit `.env`, `.spotify_cache`, local SQLite databases, exported reports, logs, or dependency folders. The repository `.gitignore` excludes these by default.

## Portfolio Value

This project demonstrates:

- OAuth authentication and token lifecycle handling.
- API wrapper design and graceful failure states.
- SQLite schema design for local analytics.
- Data processing with Pandas.
- Interactive visualization with Plotly.
- Streamlit product UI development.
- Public-proof workflow using demo-safe screenshots and recording.

## License

MIT License. See [LICENSE](LICENSE).
