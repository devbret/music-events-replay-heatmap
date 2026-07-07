# Music Events Replay Heatmap

![Screenshot from the frontend UI of this application, featuring a heatmap of activity layered over a world map.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/42e3db9c-f1bd-48ad-b500-9ac2a38cc613.png)

Visualize a timeline of music events on an interactive map with time scrubbing, markers, heatmap density and a mini bar chart for quickly navigating event volume.

## Application Overview

Loads a month-by-month timeline of geocoded music events from `events_timeline.json`, renders them on an interactive Leaflet map and lets you scrub or autoplay through time with a slider. Events are drawn either as D3 circles on a Leaflet SVG overlay or, when the heatmap toggle is enabled, as a weighted heat layer for density visualization. Each event is automatically classified into a simple type and color-coded on the map. A compact D3 mini bar chart summarizes event volume across the full timeline and allows quick month jumping, with the active month highlighted as you navigate or play through the dataset.

## Basic Setup Instructions

Below are the required software programs and instructions for installing and using this application on a Linux machine.

### Programs Needed

- [Git](https://git-scm.com/downloads)

- [Python](https://www.python.org/downloads/)

### Steps

1. Install the above programs

2. Open a terminal

3. Clone this repository: `git clone git@github.com:devbret/music-events-replay-heatmap.git`

4. Navigate to the repo's directory: `cd music-events-replay-heatmap`

5. Create a virtual environment: `python3 -m venv venv`

6. Activate your virtual environment: `source venv/bin/activate`

7. Download the [source data](https://metabrainz.org/datasets/postgres-dumps) as a JSON file

8. Place the `event.json` file at the cloned repo's root

9. Run the Python script: `python3 app.py`

10. Launch an HTTP server: `python3 -m http.server`

11. Access the frontend in a browser: `http://localhost:8000`

12. When finished, close the HTTP server: `CTRL + C`

13. Exit the virtual environment: `deactivate`

## Other Considerations

This project repo is intended to demonstrate an ability to do the following:

- Convert JSON data into a month-by-month timeline of geolocated events

- Display events on an interactive Leaflet map with D3-rendered markers for each selected month

- Enable users to play through the timeline, adjust speed and manually switch between months with a slider

- Provide event details through tooltips and an optional heatmap mode for visualizing event density

If you have any questions or would like to collaborate, please reach out either on GitHub or via [my website](https://bretbernhoft.com/).
