# Tech Context

## Technologies Used
- HTML, CSS, JavaScript for the frontend.
- JSON for data storage (`data.json`).
- Python's `http.server` module for serving local files during development.

## Development Setup
- The project is served locally using `python -m http.server 8000`. This is necessary to avoid CORS issues when fetching `data.json` from `index.html`.

## Technical Constraints
- Cross-Origin Resource Sharing (CORS) restrictions prevent direct `file://` access to local JSON data from the HTML file, necessitating a local HTTP server.

## Dependencies
- None explicitly defined beyond the standard browser environment for HTML/CSS/JS and Python for the local server.

## Tool Usage Patterns
- `read_file` and `replace_in_file` for modifying code.
- `browser_action` for testing the web application.
- `execute_command` for starting local development servers (e.g., `python -m http.server`).
