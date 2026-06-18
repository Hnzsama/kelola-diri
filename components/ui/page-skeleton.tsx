"use client"

import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <Skeleton className="h-9 w-64 border-2 border-border" />
      <Skeleton className="h-5 w-96 border-2 border-border" />
    </div>
  )
}

export function StatsGridSkeleton() {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border-2 border-border bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="w-full px-4 lg:px-6 py-6">
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="border-2 border-border bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-6 flex-1" />
                </div>
              ))}
            </div>
          </div>
          <div className="border-2 border-border bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="border-2 border-border bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <Skeleton className="h-6 w-36 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="w-full px-4 lg:px-6 py-6">
      <PageHeaderSkeleton />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Skeleton className="h-9 w-full sm:w-64 border-2 border-border" />
        <Skeleton className="h-9 w-32 border-2 border-border" />
      </div>
      <div className="border-2 border-border bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] overflow-hidden">
        <div className="border-b-2 border-border bg-muted p-4">
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="divide-y-2 divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 bg-background">
              <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="w-full px-4 lg:px-6 py-6">
      <PageHeaderSkeleton />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Skeleton className="h-9 w-full sm:w-64 border-2 border-border" />
        <Skeleton className="h-9 w-32 border-2 border-border" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="border-2 border-border bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between h-48">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-8 w-16 border border-border" />
              <Skeleton className="h-8 w-16 border border-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="w-full px-4 lg:px-6 py-6 max-w-2xl">
      <PageHeaderSkeleton />
      <div className="border-2 border-border bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full border border-border" />
          </div>
        ))}
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-32 border border-border" />
          <Skeleton className="h-10 w-24 border border-border bg-muted" />
        </div>
      </div>
    </div>
  )
}
