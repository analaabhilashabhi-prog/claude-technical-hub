// Merged L / staircase silhouette: a top bar fused with a bottom-left card via
// curved "bridge" fillers, leaving the bottom-right as negative space.
const MergedShape = ({ fill = '#ffffff', children, style: containerStyle, ...props }) => (
  <div
    style={{
      position: 'relative',
      width: 350,
      height: 320,
      ...containerStyle,
    }}
    {...props}
  >
    {/* Shape 1 — bottom-left */}
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 160,
        width: 180,
        height: 160,
        backgroundColor: fill,
        borderRadius: '30px 0px 30px 30px',
      }}
    />
    {/* Shape 2 — top-right */}
    <div
      style={{
        position: 'absolute',
        left: 170,
        top: 0,
        width: 180,
        height: 160,
        backgroundColor: fill,
        borderRadius: '30px 30px 30px 0px',
      }}
    />
    {/* Shape 3 — top-left */}
    <div
      style={{
        position: 'absolute',
        left: 10,
        top: 10,
        width: 150,
        height: 140,
        backgroundColor: fill,
        borderRadius: '30px',
      }}
    />
    {/* Bridge 1 — smooths the left inner corner */}
    <svg
      style={{ position: 'absolute', left: 140, top: 130, width: 30, height: 30, pointerEvents: 'none' }}
      viewBox="-30 0 30 30"
    >
      <path d="M 0 0 C 0 15.600000000000001 -2.5500000000000003 30 -30 30 H 0 Z" fill={fill} />
    </svg>
    {/* Bridge 2 — smooths the right inner corner */}
    <svg
      style={{ position: 'absolute', left: 180, top: 160, width: 30, height: 30, pointerEvents: 'none' }}
      viewBox="0 -30 30 30"
    >
      <path d="M 0 0 C 0 -15.600000000000001 2.5500000000000003 -30 30 -30 H 0 Z" fill={fill} />
    </svg>
    {children}
  </div>
)

export default MergedShape
