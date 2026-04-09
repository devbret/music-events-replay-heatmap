# Music Events Replay Heatmap

![Screenshot from the frontend UI of this application, featuring a heatmap of activity layered over a world map.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/dfb1ce1c-fc8c-450f-af8a-1f10f44b0fd3.png)

Visualizes a month-by-month timeline of geocoded music events on an interactive Leaflet map with time scrubbing, D3-rendered markers, heatmap density mode, automatic event type color-coding and a mini bar chart for quickly navigating event volume.

## Overview

Loads a month-by-month timeline of geocoded music events from `events_timeline.json`, renders them on an interactive Leaflet map and lets you scrub or autoplay through time with a slider. Events are drawn either as D3 circles on a Leaflet SVG overlay or, when the heatmap toggle is enabled, as a weighted heat layer for density visualization. Each event is automatically classified into a simple type and color-coded on the map. A compact D3 mini bar chart summarizes event volume across the full timeline and allows quick month jumping, with the active month highlighted as you navigate or play through the dataset.

## Set Up Instructions

Below are the required software programs and instructions for installing and using this application.

### Programs Needed

- [Git](https://git-scm.com/downloads)

- [Python](https://www.python.org/downloads/)

### Steps

1. Install the above programs

2. Open a terminal

3. Clone this repository using `git` by running the following command: `git clone git@github.com:devbret/music-events-replay-heatmap.git`

4. Navigate to the repo's directory by running: `cd music-events-replay-heatmap`

5. Create a virtual environment with this command: `python3 -m venv venv`

6. Activate your virtual environment using: `source venv/bin/activate`

7. Download the [source data](https://metabrainz.org/datasets/postgres-dumps) as a JSON file

8. Place the `event.json` file into the root directory of this repo

9. Process the raw data using the Python script by running the following command: `python3 app.py`

10. Launch the application's frontend: `python3 -m http.server`

11. Access the visualization in a browser by visiting: `http://localhost:8000`

12. Explore and enjoy

## Other Considerations

This project repo is intended to demonstrate an ability to do the following:

- Visualize event data geographically over time by animating monthly event locations on an interactive map

- Enable analysis of events through filtering, playback controls, heatmaps and a synchronized timeline chart

- Provide contextual metadata via tooltips and structured event listings

If you have any questions or would like to collaborate, please reach out either on GitHub or via [my website](https://bretbernhoft.com/).
