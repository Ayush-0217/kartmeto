export default function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ paddingTop: 24 }}>
      <h2>{title}</h2>
      <p className="muted">This screen is built in the next step.</p>
    </div>
  )
}
