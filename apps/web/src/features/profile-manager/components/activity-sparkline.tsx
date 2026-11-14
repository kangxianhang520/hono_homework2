const LINE_PATH =
	"M0,60 Q30,20 60,45 T120,30 T180,65 T240,15 T300,40 T360,10 T420,55 T480,25 L500,30";
const AREA_PATH = `${LINE_PATH} L500,80 L0,80 Z`;

/** Peaks highlighted on the curve; the first one pings. */
const MARKERS = [
	{ cx: 240, cy: 15, ping: true },
	{ cx: 360, cy: 10, ping: false },
] as const;

export function ActivitySparkline() {
	return (
		<svg
			aria-label="近 30 天 API 活动密度曲线"
			className="h-full w-full text-primary"
			fill="none"
			preserveAspectRatio="none"
			role="img"
			viewBox="0 0 500 80"
		>
			<path d={AREA_PATH} fill="currentColor" fillOpacity={0.08} />
			<path
				d={LINE_PATH}
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth={2.5}
			/>
			{MARKERS.map((marker) => (
				<g key={`${marker.cx}-${marker.cy}`}>
					{marker.ping ? (
						<circle
							className="origin-center animate-ping [transform-box:fill-box]"
							cx={marker.cx}
							cy={marker.cy}
							fill="currentColor"
							r={4}
						/>
					) : null}
					<circle
						className="fill-surface"
						cx={marker.cx}
						cy={marker.cy}
						r={3}
						stroke="currentColor"
						strokeWidth={2}
					/>
				</g>
			))}
		</svg>
	);
}
