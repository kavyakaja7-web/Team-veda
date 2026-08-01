import React from 'react'

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800 ${className}`}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="card-cmd space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-36" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

export function MapSkeleton({ height = 400 }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
      style={{ height }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-100/50 backdrop-blur-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Initializing Geospatial Layers & GIS Map…
        </p>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="card-cmd overflow-hidden p-0">
      <div className="border-b border-slate-100 p-4">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
