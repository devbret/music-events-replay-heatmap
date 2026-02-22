# Music Events Replay Heatmap

![Screenshot from the frontend UI of this application, featuring a heatmap of activity layered over a world map.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/dfb1ce1c-fc8c-450f-af8a-1f10f44b0fd3.png)

Visualizes a month-by-month timeline of geocoded music events on an interactive Leaflet map with time scrubbing, D3-rendered markers, heatmap density mode, automatic event type color-coding and a mini bar chart for quickly navigating event volume.

## Overview

Loads a month-by-month timeline of geocoded music events from `events_timeline.json`, renders them on an interactive Leaflet map and lets you scrub or autoplay through time with a slider. Events are drawn either as D3 circles on a Leaflet SVG overlay or, when the heatmap toggle is enabled, as a weighted heat layer for density visualization. Each event is automatically classified into a simple type and color-coded on the map. A compact D3 mini bar chart summarizes event volume across the full timeline and allows quick month jumping, with the active month highlighted as you navigate or play through the dataset.

## Data Source

Here is a link to [the MusicBrainz data source](https://metabrainz.org/datasets/postgres-dumps#musicbrainz) used for building this application
