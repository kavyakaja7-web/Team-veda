import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="font-display text-3xl font-semibold text-ink">404</p>
      <p className="text-muted">This page doesn&apos;t exist in the control room.</p>
      <Link to="/" className="btn-primary mt-2">
        Back to Dashboard
      </Link>
    </div>
  )
}
