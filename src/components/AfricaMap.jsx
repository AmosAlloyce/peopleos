import React from 'react';
const points = [
  ['Senegal', 79, 131, 'Dakar'],
  ['Côte d’Ivoire', 118, 173, 'Abidjan'],
  ['Mali', 132, 122, 'Bamako'],
  ['Burkina Faso', 145, 150, 'Ouagadougou'],
  ['The Gambia', 83, 142, 'Banjul'],
  ['Uganda', 287, 203, 'Kampala'],
  ['Niger', 187, 133, 'Niamey'],
  ['Sierra Leone', 93, 167, 'Freetown'],
  ['Cameroon', 194, 184, 'Yaoundé'],
  ['Kenya', 310, 221, 'Nairobi'],
  ['Ghana', 139, 176, 'Accra'],
];
export default function AfricaMap({ employees, onSelect, selected }) {
  const normal = (s) => s?.replaceAll('’', "'").toLowerCase();
  return (
    <div className="africa-map">
      <svg
        viewBox="0 0 440 370"
        aria-label="Illustrative African footprint. Select a country marker to filter the workspace."
        role="img"
      >
        <defs>
          <pattern id="map-dots" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#cbd7d5" />
          </pattern>
        </defs>
        <path
          className="africa-land"
          d="M131 25 158 19 176 28 205 31 225 30 244 43 263 41 276 58 294 63 304 87 317 101 321 126 337 153 365 153 381 141 374 166 351 191 331 215 324 242 307 259 305 285 285 315 269 342 251 345 231 328 219 302 209 277 194 254 188 223 170 201 147 192 129 190 112 180 87 177 70 162 60 140 70 121 77 99 94 90 105 63 123 50Z"
        />
        <path d="M349 270 358 254 361 266 353 296 344 316 338 308Z" className="africa-land" />
        <path
          className="map-link"
          d="M79 131 Q175 72 310 221M118 173Q214 111 287 203M145 150Q217 157 310 221"
        />
        {points.map(([name, x, y, city]) => {
          const count = employees.filter((e) => normal(e.country) === normal(name)).length;
          return (
            <g
              key={name}
              role="button"
              tabIndex="0"
              aria-label={`${name}: ${count} sample employees`}
              onClick={() => onSelect(name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(name);
                }
              }}
              className={`map-marker ${selected === name ? 'selected' : ''}`}
            >
              <title>
                {name}: {count} sample employees
              </title>
              <circle cx={x} cy={y} r="11" className="map-halo" />
              <circle cx={x} cy={y} r="4" className="map-dot" />
              {['Senegal', 'Kenya', 'Côte d’Ivoire'].includes(name) && (
                <text
                  x={x + (name === 'Senegal' ? -12 : 12)}
                  y={y + (name === 'Senegal' ? -12 : 5)}
                  textAnchor={name === 'Senegal' ? 'end' : 'start'}
                >
                  {city}
                </text>
              )}
            </g>
          );
        })}
        <text x="53" y="285" className="map-ocean">
          ATLANTIC OCEAN
        </text>
        <text x="338" y="338" className="map-ocean">
          INDIAN OCEAN
        </text>
      </svg>
      <span className="map-note">
        <i />
        Illustrative footprint · select a location
      </span>
    </div>
  );
}
