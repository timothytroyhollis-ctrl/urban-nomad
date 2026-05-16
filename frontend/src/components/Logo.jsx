export default function Logo({ size = 64, className = '' }) {
  return (
    <img
      src="/logo.jpeg"
      alt="Urban Nomad — Live Local, Explore Everywhere"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', borderRadius: 8 }}
    />
  )
}
